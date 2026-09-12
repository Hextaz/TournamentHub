import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegistrationService } from "../services/RegistrationService";

// Mock supabase client
vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "../lib/supabase";

describe("RegistrationService - Anti-IDOR Security (SEC-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should deny access if tournament.guild_id does not match interaction.guildId", async () => {
    const mockReply = vi.fn();
    const mockInteraction = {
      isButton: () => true,
      isModalSubmit: () => false,
      customId: "btn_toggle_lang_tourney123_fr",
      guildId: "guild-attacker",
      reply: mockReply,
    };

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: "tourney123",
        guild_id: "guild-victim",
        name: "Victim Tournament",
        description: "Private description",
      },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    await RegistrationService.handleInteraction(mockInteraction as any);

    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith({
      content: "❌ Tournoi introuvable ou accès non autorisé.",
      ephemeral: true,
    });
  });

  it("should allow access and return embed if tournament.guild_id matches interaction.guildId", async () => {
    const mockReply = vi.fn();
    const mockInteraction = {
      isButton: () => true,
      isModalSubmit: () => false,
      customId: "btn_toggle_lang_tourney123_en",
      guildId: "guild-legit",
      reply: mockReply,
    };

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: "tourney123",
        guild_id: "guild-legit",
        name: "Legit Tournament",
        description: "Public description",
      },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    await RegistrationService.handleInteraction(mockInteraction as any);

    expect(mockReply).toHaveBeenCalledTimes(1);
    const firstCall = mockReply.mock.calls[0];
    expect(firstCall).toBeDefined();
    const callArg = firstCall?.[0];
    expect(callArg?.ephemeral).toBe(true);
    expect(callArg?.embeds).toBeDefined();
    expect(callArg?.embeds?.[0]?.title).toBeDefined();
  });

  it("should deny access if tournament is not found", async () => {
    const mockReply = vi.fn();
    const mockInteraction = {
      isButton: () => true,
      isModalSubmit: () => false,
      customId: "btn_toggle_lang_notfound_fr",
      guildId: "guild-any",
      reply: mockReply,
    };

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("Not found"),
    });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    });

    await RegistrationService.handleInteraction(mockInteraction as any);

    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith({
      content: "❌ Tournoi introuvable ou accès non autorisé.",
      ephemeral: true,
    });
  });
});

describe("RegistrationService - Batch Insert & i18n (PERF-02 & BOT-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should perform a single batch insert for team members in finalizeRegistration", async () => {
    const tournamentId = "tourney-batch-test";
    const captainId = "captain-user-1";

    // 1. Submit main modal to populate cache
    const mockModalReply = vi.fn();
    const mockModalInteraction = {
      isButton: () => false,
      isModalSubmit: () => true,
      customId: `modal_register_main_${tournamentId}`,
      guildId: "guild-1",
      user: { id: captainId },
      fields: {
        getTextInputValue: vi.fn((fieldId: string) => {
          switch (fieldId) {
            case "team_name": return "Team Alpha";
            case "player1": return "Cap SW-1111-2222-3333";
            case "player2": return "P2 SW-2222-3333-4444";
            case "player3": return "P3 SW-3333-4444-5555";
            case "player4": return "P4 SW-4444-5555-6666";
            default: return "";
          }
        }),
      },
      reply: mockModalReply,
    };

    const mockTeamMembersInsert = vi.fn().mockResolvedValue({ error: null });
    const mockTeamsInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "team-uuid-1", name: "Team Alpha" },
          error: null,
        }),
      }),
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "tournaments") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: tournamentId,
              guild_id: "guild-1",
              status: "REGISTRATION",
              language: "en",
              discord_registration_channel_id: null,
            },
            error: null,
          }),
        };
      }
      if (table === "teams") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          }),
          insert: mockTeamsInsert,
        };
      }
      if (table === "team_members") {
        return {
          insert: mockTeamMembersInsert,
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    await RegistrationService.handleInteraction(mockModalInteraction as any);
    expect(mockModalReply).toHaveBeenCalledTimes(1);

    // 2. Click skip subs to trigger finalizeRegistration
    const mockDeferReply = vi.fn().mockResolvedValue(undefined);
    const mockEditReply = vi.fn().mockResolvedValue(undefined);
    const mockButtonInteraction = {
      isButton: () => true,
      isModalSubmit: () => false,
      customId: `btn_skip_subs_${tournamentId}`,
      guildId: "guild-1",
      user: { id: captainId },
      deferReply: mockDeferReply,
      editReply: mockEditReply,
      client: {
        channels: {
          fetch: vi.fn().mockResolvedValue(null),
        },
      },
    };

    await RegistrationService.handleInteraction(mockButtonInteraction as any);

    // Batch insert check (PERF-02): team_members.insert called exactly ONCE with all 4 players
    expect(mockTeamMembersInsert).toHaveBeenCalledTimes(1);
    const insertedMembers = mockTeamMembersInsert.mock.calls[0]?.[0];
    expect(insertedMembers).toHaveLength(4);
    expect(insertedMembers[0]).toEqual({
      team_id: "team-uuid-1",
      user_id: captainId,
      ingame_name: "Cap",
      is_captain: true,
      friend_code: "SW-1111-2222-3333",
    });
    expect(insertedMembers[1]).toEqual({
      team_id: "team-uuid-1",
      user_id: null,
      ingame_name: "P2",
      is_captain: false,
      friend_code: "SW-2222-3333-4444",
    });

    // Check localized reply
    expect(mockEditReply).toHaveBeenCalledTimes(1);
    const replyArg = mockEditReply.mock.calls[0]?.[0];
    expect(replyArg?.embeds?.[0]?.title).toBe("✅ Registration Confirmed!");
  });

  it("should localize modal in French when tournament language is fr", async () => {
    const tournamentId = "tourney-fr";
    const mockShowModal = vi.fn().mockResolvedValue(undefined);
    const mockInteraction = {
      isButton: () => true,
      isModalSubmit: () => false,
      customId: `btn_register_${tournamentId}`,
      guildId: "guild-fr",
      showModal: mockShowModal,
    };

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "tournaments") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: tournamentId,
              guild_id: "guild-fr",
              status: "REGISTRATION",
              language: "fr",
            },
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    await RegistrationService.handleInteraction(mockInteraction as any);
    expect(mockShowModal).toHaveBeenCalledTimes(1);
    const modalData = mockShowModal.mock.calls[0]?.[0]?.data;
    expect(modalData?.title).toBe("Inscription - Roster Principal");
  });
});

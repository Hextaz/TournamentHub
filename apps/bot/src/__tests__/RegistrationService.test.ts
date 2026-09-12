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

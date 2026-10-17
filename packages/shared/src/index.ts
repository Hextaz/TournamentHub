import { z } from "zod";

// Game Types Supported
export type GameType = "GENERIC" | "SPLATOON_3" | "ROCKET_LEAGUE" | "SMASH_BROS" | string;

// Tournament Status
export type TournamentStatus = "DRAFT" | "REGISTRATION" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

// Phase Types
export type PhaseType = "ROUND_ROBIN" | "SINGLE_ELIM" | "SWISS" | "DOUBLE_ELIM";

// Supported Languages (tournaments.language / server_settings.language)
export const LocaleSchema = z.enum(["fr", "en"]);
export type Locale = z.infer<typeof LocaleSchema>;

// Plafond de génération d'équipes fictives (back-office de test) : borne l'UI et l'API bot.
export const MAX_FAKE_TEAMS = 64;

// Common Domain Interfaces
export interface Tournament {
  id: string;
  guild_id: string;
  name: string;
  description?: string | null;
  is_public: boolean;
  status: TournamentStatus;
  game_type: GameType;
  language: Locale;
  start_at?: string | null;
  start_date?: string | null;
  is_registration_open?: boolean | null;
  checkin_message_id?: string | null;
  discord_category_id?: string | null;
  tie_breaker_method?: string | null;
  checkin_start_at?: string | null;
  checkin_end_at?: string | null;
  discord_announcement_channel_id?: string | null;
  discord_registration_channel_id?: string | null;
  discord_checkin_channel_id?: string | null;
  discord_captain_role_id?: string | null;
  discord_to_role_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Phase {
  id: string;
  tournament_id: string;
  name: string;
  phase_order: number;
  format: PhaseType;
  max_groups?: number | null;
  allow_asymmetric_groups?: boolean;
  bracket_size?: number;
  settings?: Record<string, any>;
  discord_channel_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  tournament_id: string;
  name: string;
  captain_discord_id: string;
  is_checked_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  phase_id: string;
  team1_id?: string | null;
  team2_id?: string | null;
  team1_score: number;
  team2_score: number;
  status: string;
  round_number?: number;
  match_number?: number;
  group_id?: string | null;
  next_match_winner_id?: string | null;
  next_match_loser_id?: string | null;
  created_at: string;
  updated_at: string;
}

// Invitation Discord publique configurée par les TO (doublée par la contrainte SQL server_settings_invite_url_check).
export const DiscordInviteUrlSchema = z
  .string()
  .trim()
  .regex(/^https:\/\/(discord\.gg|discord\.com\/invite)\/[A-Za-z0-9-]+$/, "Invitation Discord invalide");

export interface ServerSettings {
  guild_id: string;
  guild_name: string | null;
  guild_icon: string | null;
  bot_present: boolean;
  invite_url: string | null;
  language: Locale;
  to_role_id: string | null;
  captain_role_id: string | null;
  checkin_channel_id: string | null;
  announcement_channel_id: string | null;
  registration_channel_id: string | null;
  updated_at: string;
}

const OptionalDiscordId = z
  .union([z.string().regex(/^\d{1,25}$/, "Identifiant Discord invalide"), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v ? v : null));

// Corps de PUT /api/server-settings. Les champs absents ne sont pas modifiés (sauf les rôles et salons, envoyés en bloc par le formulaire).
export const ServerSettingsUpdateSchema = z.object({
  guild_id: z.string().regex(/^\d{1,25}$/, "guild_id invalide"),
  to_role_id: OptionalDiscordId,
  captain_role_id: OptionalDiscordId,
  checkin_channel_id: OptionalDiscordId,
  announcement_channel_id: OptionalDiscordId,
  registration_channel_id: OptionalDiscordId,
  language: LocaleSchema.optional(),
  invite_url: z
    .union([DiscordInviteUrlSchema, z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v || null)),
});
export type ServerSettingsUpdate = z.infer<typeof ServerSettingsUpdateSchema>;

// Motif d'accès au back-office d'un serveur (colonne guild_admins.reason).
export const GuildAdminReasonSchema = z.enum(["SERVER_OWNER", "ADMINISTRATOR", "MANAGE_GUILD", "TO_ROLE"]);
export type GuildAdminReason = z.infer<typeof GuildAdminReasonSchema>;

// Common Zod Schemas
export const CreateTournamentSchema = z.object({
  name: z.string().min(2, "Le nom du tournoi doit comporter au moins 2 caractères"),
  guild_id: z.string().min(1, "guild_id obligatoire"),
  description: z.string().optional().nullable(),
  game_type: z.string().default("GENERIC"),
  language: LocaleSchema.optional(),
  start_at: z.string().optional().nullable(),
  checkin_start_at: z.string().optional().nullable(),
  checkin_end_at: z.string().optional().nullable(),
});

export const ReportScoreSchema = z.object({
  match_id: z.string().uuid(),
  team1_score: z.number().min(0),
  team2_score: z.number().min(0),
  reported_by_team_id: z.string().optional(),
});

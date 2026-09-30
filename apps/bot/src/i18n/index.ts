import { LocaleSchema, type Locale } from '@hub/shared';
import { fr } from './locales/fr';
import { en } from './locales/en';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export type BotLocale = Locale;

type Dictionary = typeof fr;

/** Chemins pointés (`score.matchNotFound`) de toutes les feuilles du dictionnaire. */
type LeafKeys<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : LeafKeys<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type BotTranslationKey = LeafKeys<Dictionary>;
export type BotTranslationParams = Record<string, string | number>;

const locales: Record<BotLocale, Dictionary> = { fr, en };

// Code PostgREST renvoyé par `.single()` quand aucune ligne ne correspond : ce n'est pas une panne.
const NO_ROWS = 'PGRST116';

export function isBotLocale(value: unknown): value is BotLocale {
  return LocaleSchema.safeParse(value).success;
}

function lookup(dict: Dictionary, key: BotTranslationKey): string | undefined {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null || !(part in node)) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

export function tBot(lang: BotLocale, key: BotTranslationKey, params?: BotTranslationParams): string {
  const template = lookup(locales[lang], key) ?? lookup(locales.fr, key) ?? key;
  if (!params) return template;
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value)),
    template,
  );
}

/** Même texte dans toutes les locales, au format attendu par `setDescriptionLocalizations` de Discord. */
export function discordLocalizations(key: BotTranslationKey): { fr: string; 'en-US': string; 'en-GB': string } {
  return { fr: tBot('fr', key), 'en-US': tBot('en', key), 'en-GB': tBot('en', key) };
}

async function readLanguage(table: 'tournaments' | 'server_settings', column: 'id' | 'guild_id', value: string): Promise<BotLocale | null> {
  const { data, error } = await supabase.from(table).select('language').eq(column, value).single();
  if (error && error.code !== NO_ROWS) {
    logger.warn(`[i18n] Lecture de la langue impossible (${table}.${column}=${value}), repli sur la locale suivante:`, error);
    return null;
  }
  return isBotLocale(data?.language) ? data.language : null;
}

/** Langue d'un message bot : tournoi ➜ serveur ➜ `fr`. */
export async function getGuildLanguage(guildId?: string | null, tournamentId?: string | null): Promise<BotLocale> {
  if (tournamentId) {
    const tournamentLang = await readLanguage('tournaments', 'id', tournamentId);
    if (tournamentLang) return tournamentLang;
  }
  if (guildId) {
    const guildLang = await readLanguage('server_settings', 'guild_id', guildId);
    if (guildLang) return guildLang;
  }
  return 'fr';
}

/** Langue d'un message lié à une phase (match, ronde suisse) : résout le tournoi de la phase. */
export async function getPhaseLanguage(guildId: string | null | undefined, phaseId: string | null | undefined): Promise<BotLocale> {
  if (!phaseId) return getGuildLanguage(guildId);
  const { data, error } = await supabase.from('phases').select('tournament_id').eq('id', phaseId).single();
  if (error && error.code !== NO_ROWS) {
    logger.warn(`[i18n] Lecture de la phase ${phaseId} impossible, repli sur la langue du serveur:`, error);
  }
  return getGuildLanguage(guildId, data?.tournament_id ?? null);
}

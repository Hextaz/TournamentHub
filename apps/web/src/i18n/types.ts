import type { Locale } from "@hub/shared";
import type { fr } from "./locales/fr";

export type { Locale };

export type TranslationParams = Record<string, string | number>;

export type Translations = {
  [key: string]: string | Translations;
};

/** Chemins pointés (`admin.launchTournament`) de toutes les feuilles du dictionnaire. */
type LeafKeys<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : LeafKeys<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = LeafKeys<typeof fr>;

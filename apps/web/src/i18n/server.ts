import { cookies } from "next/headers";
import { LocaleSchema } from "@hub/shared";
import { defaultLocale } from "./index";
import type { Locale } from "./types";

/** Locale d'un Server Component : cookie `NEXT_LOCALE` validé, sinon locale par défaut. */
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const parsed = LocaleSchema.safeParse(cookieStore.get("NEXT_LOCALE")?.value);
  return parsed.success ? parsed.data : defaultLocale;
}

"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Locale, TranslationKey, TranslationParams } from "./types";
import { defaultLocale, t as translate } from "./index";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

// Seule source de vérité : lu côté serveur par le RootLayout (avec repli sur Accept-Language), qui fournit `initialLocale`.
const COOKIE_NAME = "NEXT_LOCALE";

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(
    initialLocale || defaultLocale,
  );

  const setLocale = useCallback(
    (newLocale: Locale) => {
      setLocaleState(newLocale);
      document.cookie = `${COOKIE_NAME}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = newLocale;
      // Instantly refresh Server Component routes without manual page reload
      router.refresh();
    },
    [router]
  );

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => {
      return translate(locale, key, params);
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}


export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Safe fallback if used outside provider
    return {
      locale: defaultLocale,
      setLocale: () => {},
      t: (key: TranslationKey, params?: TranslationParams) =>
        translate(defaultLocale, key, params),
    };
  }
  return context;
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store";
import { auth } from "@/lib/api";
import ruTranslations from "@/lib/translations/ru.json";
import kkTranslations from "@/lib/translations/kk.json";

export type Locale = "ru" | "kk";
type Translations = typeof ruTranslations;

const translations: Record<Locale, Translations> = {
  ru: ruTranslations,
  kk: kkTranslations,
};

const LOCALE_STORAGE_KEY = "locale";

export function useTranslation() {
  const { user, setUser } = useAuthStore();
  const [locale, setLocaleState] = useState<Locale>("ru");
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate locale from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
      if (savedLocale && (savedLocale === "ru" || savedLocale === "kk")) {
        setLocaleState(savedLocale);
      }
      setIsHydrated(true);
    }
  }, []);

  // Sync with user.locale when user changes
  useEffect(() => {
    if (user?.locale && (user.locale === "ru" || user.locale === "kk")) {
      if (user.locale !== locale) {
        setLocaleState(user.locale as Locale);
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCALE_STORAGE_KEY, user.locale);
        }
      }
    }
  }, [user?.locale, locale]);

  // Set locale and persist
  const setLocale = useCallback(
    async (newLocale: Locale) => {
      setLocaleState(newLocale);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      }

      // Update on backend if user is logged in
      if (user) {
        try {
          const updatedUser = await auth.updateProfile({ locale: newLocale });
          setUser(updatedUser);
        } catch (e) {
          console.error("Failed to update locale", e);
        }
      }
    },
    [user, setUser]
  );

  // Translation function with dot notation support
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split(".");
      let value: unknown = translations[locale];

      for (const k of keys) {
        if (value && typeof value === "object") {
          value = (value as Record<string, unknown>)[k];
        } else {
          return key; // Fallback to key if not found
        }
      }

      if (typeof value !== "string") {
        return key;
      }

      // Replace parameters like {count} with actual values
      if (params) {
        return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
          return params[paramKey]?.toString() ?? `{${paramKey}}`;
        });
      }

      return value;
    },
    [locale]
  );

  // For bilingual labels (nameRu/nameKz or ru/kz from label objects)
  const tLabel = useCallback(
    (ru: string | undefined, kz?: string | undefined): string => {
      if (locale === "kk" && kz) return kz;
      return ru || "";
    },
    [locale]
  );

  // Get label from object with ru/kz or nameRu/nameKz keys
  const tLabelObj = useCallback(
    (obj: { ru?: string; kz?: string; nameRu?: string; nameKz?: string } | undefined): string => {
      if (!obj) return "";
      if (locale === "kk") {
        return obj.kz || obj.nameKz || obj.ru || obj.nameRu || "";
      }
      return obj.ru || obj.nameRu || obj.kz || obj.nameKz || "";
    },
    [locale]
  );

  // Check if user can change language (only KZ users)
  const canChangeLanguage = user?.country === "kz";

  return {
    t,
    tLabel,
    tLabelObj,
    locale,
    setLocale,
    canChangeLanguage,
    isHydrated,
  };
}

// Hook for using translation without user context (for public pages)
export function usePublicTranslation(defaultLocale: Locale = "ru") {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
      if (savedLocale && (savedLocale === "ru" || savedLocale === "kk")) {
        setLocaleState(savedLocale);
      }
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split(".");
      let value: unknown = translations[locale];

      for (const k of keys) {
        if (value && typeof value === "object") {
          value = (value as Record<string, unknown>)[k];
        } else {
          return key;
        }
      }

      if (typeof value !== "string") {
        return key;
      }

      if (params) {
        return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
          return params[paramKey]?.toString() ?? `{${paramKey}}`;
        });
      }

      return value;
    },
    [locale]
  );

  const tLabel = useCallback(
    (ru: string | undefined, kz?: string | undefined): string => {
      if (locale === "kk" && kz) return kz;
      return ru || "";
    },
    [locale]
  );

  const tLabelObj = useCallback(
    (obj: { ru?: string; kz?: string; nameRu?: string; nameKz?: string } | undefined): string => {
      if (!obj) return "";
      if (locale === "kk") {
        return obj.kz || obj.nameKz || obj.ru || obj.nameRu || "";
      }
      return obj.ru || obj.nameRu || obj.kz || obj.nameKz || "";
    },
    [locale]
  );

  return {
    t,
    tLabel,
    tLabelObj,
    locale,
    setLocale,
  };
}

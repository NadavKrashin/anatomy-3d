"use client";

import { useEffect, type ReactNode } from "react";
import { LOCALE_DIRECTION } from "@/lib/i18n/locale";
import { useSettingsStore } from "@/store/settingsStore";

/** Rehydrates persisted settings and keeps <html lang/dir> in sync. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const locale = useSettingsStore((s) => s.locale);

  useEffect(() => {
    void useSettingsStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = LOCALE_DIRECTION[locale];
  }, [locale]);

  return children;
}

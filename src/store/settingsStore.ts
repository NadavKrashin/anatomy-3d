import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale";
import {
  DEFAULT_TERM_PREFERENCE,
  type TermPreference,
} from "@/lib/anatomy/names";

interface SettingsState {
  locale: Locale;
  termPreference: TermPreference;
  setLocale: (locale: Locale) => void;
  setTermPreference: (preference: TermPreference) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      termPreference: DEFAULT_TERM_PREFERENCE,
      setLocale: (locale) => set({ locale }),
      setTermPreference: (termPreference) => set({ termPreference }),
    }),
    {
      name: "anatomy.settings",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ locale, termPreference }) => ({ locale, termPreference }),
      // Rehydrated from a client effect so server and first client render match.
      skipHydration: true,
    },
  ),
);

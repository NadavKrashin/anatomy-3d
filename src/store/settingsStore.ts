import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale";
import {
  DEFAULT_TERM_PREFERENCE,
  type TermPreference,
} from "@/lib/anatomy/names";
import { DEFAULT_BODY_SEX } from "@/lib/anatomy/bodySex";
import type { BodySex } from "@/types/anatomy";

interface SettingsState {
  locale: Locale;
  termPreference: TermPreference;
  /** Which body the model shows (female: the female organs instead of the male). */
  bodySex: BodySex;
  setLocale: (locale: Locale) => void;
  setTermPreference: (preference: TermPreference) => void;
  setBodySex: (sex: BodySex) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      termPreference: DEFAULT_TERM_PREFERENCE,
      bodySex: DEFAULT_BODY_SEX,
      setLocale: (locale) => set({ locale }),
      setTermPreference: (termPreference) => set({ termPreference }),
      setBodySex: (bodySex) => set({ bodySex }),
    }),
    {
      name: "anatomy.settings",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ locale, termPreference, bodySex }) => ({
        locale,
        termPreference,
        bodySex,
      }),
      // Rehydrated from a client effect so server and first client render match.
      skipHydration: true,
    },
  ),
);

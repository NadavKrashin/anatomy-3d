import { en } from "./messages.en";
import { he, type Messages } from "./messages.he";

export const LOCALES = ["he", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "he";

export const LOCALE_DIRECTION: Record<Locale, "rtl" | "ltr"> = {
  he: "rtl",
  en: "ltr",
};

const MESSAGES: Record<Locale, Messages> = { he, en };

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}

export type { Messages };

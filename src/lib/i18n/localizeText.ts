import type { LocalizedText, TermLanguage } from "@/types/anatomy";
import type { Locale } from "./locale";

export interface LocalizedValue {
  text: string;
  language: TermLanguage;
  dir: "rtl" | "ltr";
}

/**
 * Educational content is authored in English first; Hebrew is shown when a
 * translation exists and the UI is in Hebrew. The returned language/dir let
 * the caller mark up mixed-direction content correctly.
 */
export function localizeText(
  text: LocalizedText,
  locale: Locale,
): LocalizedValue {
  return locale === "he" && text.he
    ? { text: text.he, language: "he", dir: "rtl" }
    : { text: text.en, language: "en", dir: "ltr" };
}

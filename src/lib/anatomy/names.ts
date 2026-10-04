import type {
  AnatomicalStructure,
  BodySide,
  TermLanguage,
} from "@/types/anatomy";

export interface TermPreference {
  primary: TermLanguage;
  /** Shown under the primary name; null hides it. */
  secondary: TermLanguage | null;
}

export const DEFAULT_TERM_PREFERENCE: TermPreference = {
  primary: "en",
  secondary: "he",
};

export interface ResolvedName {
  text: string;
  /** Language actually used (may differ from the requested one after fallback). */
  language: TermLanguage;
  verified: boolean;
}

const SIDE_LABELS: Record<
  TermLanguage,
  Record<Exclude<BodySide, "midline">, string>
> = {
  en: { left: "left", right: "right" },
  he: { left: "שמאל", right: "ימין" },
  // Latin side adjectives agree in gender with the noun, so use the
  // conventional gender-neutral abbreviations instead.
  la: { left: "sin.", right: "dext." },
};

export function getSideLabel(
  side: BodySide | undefined,
  language: TermLanguage,
): string | null {
  if (side === undefined || side === "midline") return null;
  return SIDE_LABELS[language][side];
}

/** Name in the requested language, falling back to English. Includes the side. */
export function resolveName(
  structure: AnatomicalStructure,
  language: TermLanguage,
): ResolvedName {
  const term = structure.names[language] ?? structure.names.en;
  const usedLanguage = structure.names[language] ? language : "en";
  const side = getSideLabel(structure.side, usedLanguage);
  return {
    text: side ? `${term.text} — ${side}` : term.text,
    language: usedLanguage,
    verified: term.verified,
  };
}

/** Names to show for a structure under the user's preference. */
export function resolveDisplayNames(
  structure: AnatomicalStructure,
  preference: TermPreference,
): { primary: ResolvedName; secondary: ResolvedName | null } {
  const primary = resolveName(structure, preference.primary);
  if (preference.secondary === null) return { primary, secondary: null };
  const secondary = resolveName(structure, preference.secondary);
  // Don't repeat the same name twice when the secondary language fell back.
  return {
    primary,
    secondary: secondary.text === primary.text ? null : secondary,
  };
}

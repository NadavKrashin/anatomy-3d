import Fuse from "fuse.js";
import type { AnatomicalStructure } from "@/types/anatomy";
import { TERM_LANGUAGES } from "@/types/anatomy";
import { getSideLabel } from "./names";

const HEBREW_FINAL_LETTERS: Record<string, string> = {
  ך: "כ",
  ם: "מ",
  ן: "נ",
  ף: "פ",
  ץ: "צ",
};
const HEBREW_FINAL_RE = /[ךםןףץ]/g;
// Cantillation marks and niqqud (vowel points).
const HEBREW_DIACRITICS_RE = /[֑-ֽֿ-ׇ]/g;
const LATIN_DIACRITICS_RE = /[̀-ͯ]/g;
// Maqaf, hyphens, dashes, slashes, underscores, dots, commas → word break.
const SEPARATORS_RE = /[־\-‐-―_/.,()]+/g;
// Geresh/gershayim (and the ASCII quotes people type instead).
const QUOTES_RE = /[׳״'"`‘’“”]/g;
const HEBREW_WORD_RE = /^[א-ת]/;

/**
 * Normalizes text so Hebrew and English queries match regardless of niqqud,
 * final letter forms, quote marks, hyphens, case, or a leading definite
 * article ("העצב המדיאני" ≈ "עצב מדיאני"). Applied to both index and query.
 */
export function normalizeSearchText(input: string): string {
  return input
    .normalize("NFKD")
    .replace(LATIN_DIACRITICS_RE, "")
    .replace(HEBREW_DIACRITICS_RE, "")
    .replace(QUOTES_RE, "")
    .replace(SEPARATORS_RE, " ")
    .toLowerCase()
    .replace(
      HEBREW_FINAL_RE,
      (letter) => HEBREW_FINAL_LETTERS[letter] ?? letter,
    )
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      HEBREW_WORD_RE.test(word) && word.length >= 3 && word.startsWith("ה")
        ? word.slice(1)
        : word,
    )
    .join(" ");
}

interface SearchRecord {
  id: string;
  keys: string[];
}

function buildSearchKeys(structure: AnatomicalStructure): string[] {
  const keys: string[] = [];
  for (const language of TERM_LANGUAGES) {
    const side = getSideLabel(structure.side, language) ?? "";
    const texts = [
      structure.names[language]?.text,
      ...(structure.aliases[language] ?? []),
    ];
    for (const text of texts) {
      if (text) keys.push(normalizeSearchText(`${text} ${side}`));
    }
  }
  return keys;
}

export interface StructureSearch {
  search(query: string, limit?: number): AnatomicalStructure[];
}

export function createStructureSearch(
  structures: readonly AnatomicalStructure[],
): StructureSearch {
  const byId = new Map(structures.map((s) => [s.id, s]));
  const records: SearchRecord[] = structures.map((s) => ({
    id: s.id,
    keys: buildSearchKeys(s),
  }));
  const fuse = new Fuse(records, {
    keys: ["keys"],
    threshold: 0.34,
    ignoreLocation: true,
    includeScore: true,
  });

  return {
    search(query, limit = 12) {
      const normalized = normalizeSearchText(query);
      if (normalized.length === 0) return [];

      // Exact substring matches first (predictable for students typing a
      // known name), then fuzzy matches to tolerate typos.
      const exact = records
        .filter((r) => r.keys.some((k) => k.includes(normalized)))
        .map((r) => r.id);
      const fuzzy = fuse.search(normalized).map((r) => r.item.id);

      const ids = [...new Set([...exact, ...fuzzy])].slice(0, limit);
      return ids
        .map((id) => byId.get(id))
        .filter((s): s is AnatomicalStructure => s !== undefined);
    },
  };
}

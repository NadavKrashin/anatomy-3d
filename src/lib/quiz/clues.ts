import type { AnatomicalStructure } from "@/types/anatomy";

/** A description to quiz from (her words) and the structures it describes. */
export interface QuizClue {
  text: string;
  /** Clicking any of these answers it: every side of a paired structure. */
  answerIds: string[];
  /** Fixed wrong options (a distinction's other half); else picked as usual. */
  distractorIds?: string[];
}

/**
 * One of her "distinctions" (two easily confused structures), as a clue to
 * one of them. Ids are side-less (`ureter`, not `ureter-left`).
 */
export interface Distinction {
  text: string;
  answer: string;
  /** The structures it is told apart from. */
  others: string[];
}

/** What replaces a structure's own name inside a clue. */
export const MASK = "…";
/** Clues shorter than this (after masking) say too little to answer from. */
export const MIN_CLUE_LENGTH = 20;

const HEBREW_PREFIXES = "[והבלמשכ]{0,2}";
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Her text with the structure's own names masked, so the clue doesn't give
 * the answer away ("הכבד הוא איבר…" → "… הוא איבר…"). Hebrew names may carry
 * attached prefixes (ה, ב, ל, ו…); matching is whole-word.
 */
export function maskNames(text: string, names: readonly string[]): string {
  const terms = [...new Set(names.map((n) => n.trim()))]
    .filter((n) => n.length >= 2)
    // Longest first: "Renal pelvis" before "Renal".
    .sort((a, b) => b.length - a.length);
  return terms.reduce((masked, term) => {
    const pattern = new RegExp(
      `(?<![\\p{L}\\p{N}])${HEBREW_PREFIXES}${escape(term)}(?![\\p{L}\\p{N}])`,
      "giu",
    );
    return masked.replace(pattern, MASK);
  }, text);
}

/** Every name a structure goes by, without the side. */
function namesOf(structure: AnatomicalStructure): string[] {
  return [
    ...Object.values(structure.names).map((n) => n.text),
    ...Object.values(structure.aliases).flat(),
    ...(structure.studyNotes ?? []).map((n) => n.term),
  ];
}

/** The structures a side-less id stands for: itself, or both sides. */
function membersOf(
  base: string,
  structures: readonly AnatomicalStructure[],
): AnatomicalStructure[] {
  return structures.filter((s) => s.id === base || s.bilateralGroupId === base);
}

const groupKey = (s: AnatomicalStructure) => s.bilateralGroupId ?? s.id;

/**
 * Clues from her summary notes: each note about the structure itself (not a
 * shared or part-of note), names masked, long enough to answer from. Keyed
 * by structure id; both sides of a pair get the same clues.
 */
export function summaryClues(
  structures: readonly AnatomicalStructure[],
): Map<string, QuizClue[]> {
  const byGroup = new Map<string, AnatomicalStructure[]>();
  for (const s of structures)
    byGroup.set(groupKey(s), [...(byGroup.get(groupKey(s)) ?? []), s]);

  const clues = new Map<string, QuizClue[]>();
  for (const members of byGroup.values()) {
    const first = members[0];
    if (!first) continue;
    const names = members.flatMap(namesOf);
    const texts = new Set(
      (first.studyNotes ?? [])
        .filter((note) => !note.shared)
        .map((note) => maskNames(note.text, names))
        .filter(
          (text) => text.replaceAll(MASK, "").trim().length >= MIN_CLUE_LENGTH,
        ),
    );
    if (texts.size === 0) continue;
    const answerIds = members.map((s) => s.id);
    const list = [...texts].map((text) => ({ text, answerIds }));
    for (const s of members) clues.set(s.id, list);
  }
  return clues;
}

/**
 * Clues from her distinctions. A distinction whose structure isn't in this
 * body (the testis in the female body) is left out; its other half becomes
 * a fixed wrong option when present.
 */
export function distinctionClues(
  distinctions: readonly Distinction[],
  structures: readonly AnatomicalStructure[],
): Map<string, QuizClue[]> {
  const clues = new Map<string, QuizClue[]>();
  for (const d of distinctions) {
    const answers = membersOf(d.answer, structures);
    if (answers.length === 0) continue;
    const distractorIds = d.others
      .map((other) => membersOf(other, structures)[0]?.id)
      .filter((id): id is string => id !== undefined);
    const clue: QuizClue = {
      text: d.text,
      answerIds: answers.map((s) => s.id),
      distractorIds,
    };
    for (const s of answers)
      clues.set(s.id, [...(clues.get(s.id) ?? []), clue]);
  }
  return clues;
}

/**
 * Every structure her distinctions name, the answers and what they are told
 * apart from (a quiz on them shows both halves of each pair).
 */
export function distinctionStructureIds(
  distinctions: readonly Distinction[],
  structures: readonly AnatomicalStructure[],
): string[] {
  const asked = distinctionClues(distinctions, structures);
  const named = distinctions
    .filter((d) => membersOf(d.answer, structures).length > 0)
    .flatMap((d) => [d.answer, ...d.others])
    .flatMap((base) => membersOf(base, structures).map((s) => s.id));
  return [...new Set([...asked.keys(), ...named])];
}

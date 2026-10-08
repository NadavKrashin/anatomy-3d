import type { AnatomicalStructure } from "@/types/anatomy";
import type { QuizMode, QuizQuestion } from "@/types/quiz";
import type { QuizClue } from "./clues";
import { shuffle, type Rng } from "./random";

export const IDENTIFY_OPTION_COUNT = 4;

export interface GenerateQuizOptions {
  /** Structures the quiz may ask about (already filtered by `eligibleStructures`). */
  structures: readonly AnatomicalStructure[];
  /**
   * Structures that may appear as wrong options in identify questions. Usually
   * every selectable structure in the model, so small scopes still get
   * plausible choices. Defaults to `structures`.
   */
  distractorPool?: readonly AnatomicalStructure[];
  mode: QuizMode;
  count: number;
  rng: Rng;
  /**
   * Her descriptions per structure id ("summary" mode asks only structures
   * that have one; see `summaryClues` / `distinctionClues`).
   */
  clues?: ReadonlyMap<string, readonly QuizClue[]>;
}

/**
 * How plausible `candidate` is as a wrong answer for `target`: another part
 * of the same whole is the hardest (left vs right ventricle), then same
 * system and region (radial vs ulnar nerve); unrelated is easiest.
 */
function distractorScore(
  target: AnatomicalStructure,
  candidate: AnatomicalStructure,
): number {
  const sibling =
    target.parentId !== undefined && candidate.parentId === target.parentId;
  return (
    (sibling ? 3 : 0) +
    (candidate.system === target.system ? 2 : 0) +
    (candidate.region === target.region ? 1 : 0)
  );
}

/**
 * A distractor must not share a name with the target (e.g. its other side),
 * and must not be its whole or one of its parts — "Heart" isn't a wrong
 * answer for the left ventricle.
 */
function isValidDistractor(
  target: AnatomicalStructure,
  candidate: AnatomicalStructure,
): boolean {
  if (candidate.id === target.id) return false;
  if (candidate.id === target.parentId || candidate.parentId === target.id)
    return false;
  if (
    target.bilateralGroupId &&
    candidate.bilateralGroupId === target.bilateralGroupId
  )
    return false;
  return candidate.names.en.text !== target.names.en.text;
}

export function pickDistractors(
  target: AnatomicalStructure,
  pool: readonly AnatomicalStructure[],
  count: number,
  rng: Rng,
): AnatomicalStructure[] {
  const chosen: AnatomicalStructure[] = [];
  // Shuffle first so equally plausible candidates are picked at random, then
  // take the most plausible ones; skip a second side of an already-chosen pair.
  const ranked = shuffle(pool, rng)
    .filter((c) => isValidDistractor(target, c))
    .sort((a, b) => distractorScore(target, b) - distractorScore(target, a));
  for (const candidate of ranked) {
    if (chosen.length === count) break;
    if (chosen.some((c) => !isValidDistractor(c, candidate))) continue;
    chosen.push(candidate);
  }
  return chosen;
}

function questionTypeFor(
  mode: Exclude<QuizMode, "summary">,
  rng: Rng,
): "find" | "identify" {
  if (mode === "mixed") return rng() < 0.5 ? "find" : "identify";
  return mode;
}

/**
 * "Summary" mode: her description of the structure; half the time she finds
 * it in the model (either side counts), half the time she picks its name.
 * One question per structure pair, so a quiz doesn't ask the same clue for
 * the left and the right side.
 */
function summaryQuiz(
  { structures, distractorPool = structures, count, rng }: GenerateQuizOptions,
  clues: ReadonlyMap<string, readonly QuizClue[]>,
): QuizQuestion[] {
  const seen = new Set<string>();
  const targets = shuffle(structures, rng).filter((s) => {
    const group = s.bilateralGroupId ?? s.id;
    if (!clues.get(s.id)?.length || seen.has(group)) return false;
    seen.add(group);
    return true;
  });
  return targets.slice(0, Math.max(0, count)).map((target, index) => {
    const id = `q${index + 1}-${target.id}`;
    const options = clues.get(target.id) ?? [];
    const clue = options[Math.floor(rng() * options.length)] ?? options[0];
    if (!clue) throw new Error(`no clue for ${target.id}`);
    if (rng() < 0.5) {
      const distractorIds =
        clue.distractorIds ??
        pickDistractors(
          target,
          distractorPool,
          IDENTIFY_OPTION_COUNT - 1,
          rng,
        ).map((s) => s.id);
      if (distractorIds.length > 0)
        return {
          id,
          type: "describe",
          structureId: target.id,
          optionIds: shuffle([target.id, ...distractorIds], rng),
          clue: clue.text,
        };
    }
    return {
      id,
      type: "find",
      structureId: target.id,
      acceptedStructureIds: clue.answerIds,
      clue: clue.text,
    };
  });
}

/**
 * Builds a quiz: up to `count` distinct structures in random order. Identify
 * questions that can't get at least one plausible distractor fall back to find.
 */
export function generateQuiz(options: GenerateQuizOptions): QuizQuestion[] {
  const { structures, distractorPool = structures, mode, count, rng } = options;
  if (mode === "summary")
    return summaryQuiz(options, options.clues ?? new Map());
  const targets = shuffle(structures, rng).slice(0, Math.max(0, count));

  return targets.map((target, index): QuizQuestion => {
    const id = `q${index + 1}-${target.id}`;
    if (questionTypeFor(mode, rng) === "identify") {
      const distractors = pickDistractors(
        target,
        distractorPool,
        IDENTIFY_OPTION_COUNT - 1,
        rng,
      );
      if (distractors.length > 0) {
        return {
          id,
          type: "identify",
          structureId: target.id,
          optionIds: shuffle([target, ...distractors], rng).map((s) => s.id),
        };
      }
    }
    return {
      id,
      type: "find",
      structureId: target.id,
      acceptedStructureIds: [target.id],
    };
  });
}

import type { QuizAttempt } from "@/types/quiz";

/*
 * Deliberately simple, transparent spaced review (§25) — not Anki/SM-2.
 *
 *   again (wrong / revealed)      → review in 10 minutes, interval reset to 0
 *   hard  (right after retries)   → interval × 1.2 (at least 1 day)
 *   good  (right first time)      → 1 day, then interval × 2.5 (max 60 days)
 *
 * Confidence is an exponential moving average of grade scores, so a single
 * mistake lowers it noticeably but doesn't erase a long good history.
 */

export type ReviewGrade = "again" | "hard" | "good";

export const AGAIN_DELAY_MINUTES = 10;
export const HARD_MULTIPLIER = 1.2;
export const GOOD_MULTIPLIER = 2.5;
export const MAX_INTERVAL_DAYS = 60;
export const CONFIDENCE_WEIGHT = 0.4;
/** Confidence at which a structure counts as "learned". */
export const MASTERED_CONFIDENCE = 0.8;

const GRADE_SCORE: Record<ReviewGrade, number> = {
  again: 0,
  hard: 0.6,
  good: 1,
};
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export function gradeAttempt(
  attempt: Pick<QuizAttempt, "correct" | "attempts" | "revealed">,
): ReviewGrade {
  if (!attempt.correct || attempt.revealed) return "again";
  return attempt.attempts > 1 ? "hard" : "good";
}

export function nextInterval(previousDays: number, grade: ReviewGrade): number {
  switch (grade) {
    case "again":
      return 0;
    case "hard":
      return Math.max(1, Math.round(previousDays * HARD_MULTIPLIER));
    case "good":
      return previousDays < 1
        ? 1
        : Math.min(
            MAX_INTERVAL_DAYS,
            Math.round(previousDays * GOOD_MULTIPLIER),
          );
  }
}

export function scheduleReview(
  previousDays: number,
  grade: ReviewGrade,
  now: number,
): { intervalDays: number; nextReviewAt: string } {
  const intervalDays = nextInterval(previousDays, grade);
  const delay =
    intervalDays === 0
      ? AGAIN_DELAY_MINUTES * MINUTE_MS
      : intervalDays * DAY_MS;
  return { intervalDays, nextReviewAt: new Date(now + delay).toISOString() };
}

export function updateConfidence(previous: number, grade: ReviewGrade): number {
  const next = previous + CONFIDENCE_WEIGHT * (GRADE_SCORE[grade] - previous);
  return Math.round(next * 1000) / 1000;
}

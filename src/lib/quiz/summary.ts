import type { QuizSession } from "@/types/quiz";

export interface QuizSummary {
  total: number;
  /** Correct on the first answer — this is the score (§22). */
  correctFirstTry: number;
  /** Correct, but only after one or more wrong clicks. */
  correctAfterRetry: number;
  /** Wrong (identify) or revealed (find). */
  missed: number;
  /** correctFirstTry / total, 0–100, rounded. */
  percent: number;
  averageResponseMs: number;
  /** Structures that weren't answered right first time, in quiz order. */
  reviewStructureIds: string[];
}

export function summarizeSession(session: QuizSession): QuizSummary {
  const { attempts } = session;
  const firstTry = attempts.filter((a) => a.correct && a.attempts === 1);
  const afterRetry = attempts.filter((a) => a.correct && a.attempts > 1);
  const total = session.totalQuestions;
  const totalTime = attempts.reduce((sum, a) => sum + a.responseTimeMs, 0);

  return {
    total,
    correctFirstTry: firstTry.length,
    correctAfterRetry: afterRetry.length,
    missed: attempts.length - firstTry.length - afterRetry.length,
    percent: total === 0 ? 0 : Math.round((firstTry.length / total) * 100),
    averageResponseMs:
      attempts.length === 0 ? 0 : Math.round(totalTime / attempts.length),
    reviewStructureIds: attempts
      .filter((a) => !(a.correct && a.attempts === 1))
      .map((a) => a.structureId),
  };
}

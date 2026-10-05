import { summarizeSession } from "@/lib/quiz/summary";
import type { ProgressData, StructureProgress } from "@/types/progress";
import { PROGRESS_DATA_VERSION } from "@/types/progress";
import type { QuizAttempt, QuizSession } from "@/types/quiz";
import {
  gradeAttempt,
  scheduleReview,
  updateConfidence,
} from "./reviewScheduler";

/** Keep history bounded; per-structure progress holds the long-term state. */
export const MAX_SESSION_RECORDS = 200;

export function emptyProgress(): ProgressData {
  return { version: PROGRESS_DATA_VERSION, structures: {}, sessions: [] };
}

function initialProgress(structureId: string): StructureProgress {
  return {
    structureId,
    timesSeen: 0,
    correctCount: 0,
    incorrectCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    confidence: 0,
    intervalDays: 0,
  };
}

/** Folds one quiz answer into a structure's progress. */
export function applyAttempt(
  previous: StructureProgress | undefined,
  attempt: QuizAttempt,
  now: number,
): StructureProgress {
  const progress = previous ?? initialProgress(attempt.structureId);
  const grade = gradeAttempt(attempt);
  // Only a clean first-try answer extends a streak.
  const currentStreak = grade === "good" ? progress.currentStreak + 1 : 0;

  return {
    ...progress,
    timesSeen: progress.timesSeen + 1,
    correctCount: progress.correctCount + (grade === "again" ? 0 : 1),
    incorrectCount: progress.incorrectCount + (grade === "again" ? 1 : 0),
    currentStreak,
    longestStreak: Math.max(progress.longestStreak, currentStreak),
    lastReviewedAt: attempt.answeredAt,
    confidence: updateConfidence(progress.confidence, grade),
    ...scheduleReview(progress.intervalDays, grade, now),
  };
}

/**
 * Applies a finished session to the progress data. Idempotent: a session that
 * was already recorded (same id) is ignored, so a double save can't
 * double-count.
 */
export function recordSession(
  data: ProgressData,
  session: QuizSession,
  now: number,
): ProgressData {
  if (!session.completedAt || data.sessions.some((s) => s.id === session.id))
    return data;

  const structures = { ...data.structures };
  for (const attempt of session.attempts) {
    structures[attempt.structureId] = applyAttempt(
      structures[attempt.structureId],
      attempt,
      now,
    );
  }

  const summary = summarizeSession(session);
  const record = {
    id: session.id,
    scopeId: session.scopeId,
    mode: session.mode,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    total: summary.total,
    correctFirstTry: summary.correctFirstTry,
    averageResponseMs: summary.averageResponseMs,
  };

  return {
    ...data,
    structures,
    sessions: [...data.sessions, record].slice(-MAX_SESSION_RECORDS),
  };
}

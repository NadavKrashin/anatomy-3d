import type { QuizMode } from "./quiz";

/** Learning state for one structure (§23). */
export interface StructureProgress {
  structureId: string;
  timesSeen: number;
  correctCount: number;
  incorrectCount: number;
  currentStreak: number;
  longestStreak: number;
  lastReviewedAt?: string;
  /** 0–1. Moving average of recent results; 0 for never seen. */
  confidence: number;
  /** Current review interval; 0 means "review again soon". */
  intervalDays: number;
  nextReviewAt?: string;
}

/** Compact record of a finished quiz, for history and stats. */
export interface QuizSessionRecord {
  id: string;
  scopeId: string;
  mode: QuizMode;
  startedAt: string;
  completedAt: string;
  total: number;
  correctFirstTry: number;
  averageResponseMs: number;
}

export const PROGRESS_DATA_VERSION = 1;

/** Everything persisted about a student's learning. */
export interface ProgressData {
  version: typeof PROGRESS_DATA_VERSION;
  structures: Record<string, StructureProgress>;
  sessions: QuizSessionRecord[];
}

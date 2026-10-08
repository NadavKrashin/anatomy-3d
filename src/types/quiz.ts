export const QUIZ_MODES = ["find", "identify", "mixed", "summary"] as const;
export type QuizMode = (typeof QUIZ_MODES)[number];
export type QuestionType = "find" | "identify" | "describe";

/**
 * "Find the radial nerve" — the student clicks the structure in 3D. With a
 * `clue`, the prompt is her own description of the structure from her
 * summary instead of its name ("summary" mode).
 */
export interface FindQuestion {
  id: string;
  type: "find";
  structureId: string;
  /** Clicking any of these counts as correct (both sides for a clue). */
  acceptedStructureIds: string[];
  clue?: string;
}

/** "What structure is highlighted?" — multiple choice. */
export interface IdentifyQuestion {
  id: string;
  type: "identify";
  structureId: string;
  /** Shuffled answer options, including the correct one. */
  optionIds: string[];
}

/**
 * Her description of a structure (from her summary) — multiple choice of
 * names, nothing highlighted ("summary" mode).
 */
export interface DescribeQuestion {
  id: string;
  type: "describe";
  structureId: string;
  /** Shuffled answer options, including the correct one. */
  optionIds: string[];
  clue: string;
}

export type QuizQuestion = FindQuestion | IdentifyQuestion | DescribeQuestion;

/** Questions answered by choosing a name from a list. */
export type ChoiceQuestion = IdentifyQuestion | DescribeQuestion;

export interface QuizAttempt {
  questionId: string;
  structureId: string;
  questionType: QuestionType;
  /** Eventually answered correctly without revealing the answer. */
  correct: boolean;
  /** Number of answers given, including the final one. */
  attempts: number;
  /** The student asked to see the answer. */
  revealed: boolean;
  responseTimeMs: number;
  answeredAt: string;
}

export interface QuizSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  scopeId: string;
  mode: QuizMode;
  totalQuestions: number;
  questions: QuizQuestion[];
  attempts: QuizAttempt[];
}

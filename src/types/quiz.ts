export const QUIZ_MODES = ["find", "identify", "mixed"] as const;
export type QuizMode = (typeof QUIZ_MODES)[number];
export type QuestionType = Exclude<QuizMode, "mixed">;

/** "Find the radial nerve" — the student clicks the structure in 3D. */
export interface FindQuestion {
  id: string;
  type: "find";
  structureId: string;
  /** Clicking any of these counts as correct (room for side-agnostic questions). */
  acceptedStructureIds: string[];
}

/** "What structure is highlighted?" — multiple choice. */
export interface IdentifyQuestion {
  id: string;
  type: "identify";
  structureId: string;
  /** Shuffled answer options, including the correct one. */
  optionIds: string[];
}

export type QuizQuestion = FindQuestion | IdentifyQuestion;

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

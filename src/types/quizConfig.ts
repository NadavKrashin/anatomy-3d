import type { QuizMode } from "./quiz";
import type { StudyScope } from "./study";

/** What the student chose on the quiz setup screen. */
export interface QuizConfig {
  scope: StudyScope;
  mode: QuizMode;
  count: number;
}

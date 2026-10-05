import { create } from "zustand";
import {
  quizReducer,
  type QuizAction,
  type QuizRun,
} from "@/lib/quiz/quizEngine";

/**
 * Holds the active quiz run. All rules live in the pure quiz engine; this
 * store only keeps the current state so the viewer, the quiz panel and the
 * top-bar progress can share it.
 */
interface QuizState {
  run: QuizRun | null;
  begin: (run: QuizRun) => void;
  dispatch: (action: QuizAction) => void;
  clear: () => void;
}

export const useQuizStore = create<QuizState>()((set) => ({
  run: null,
  begin: (run) => set({ run }),
  dispatch: (action) =>
    set((state) =>
      state.run ? { run: quizReducer(state.run, action) } : state,
    ),
  clear: () => set({ run: null }),
}));

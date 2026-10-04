import { create } from "zustand";
import type { ProgressRepository } from "@/lib/progress/progressRepository";
import { createLocalProgressRepository } from "@/lib/progress/localProgressRepository";
import { emptyProgress, recordSession } from "@/lib/progress/progressUpdates";
import type { ProgressData } from "@/types/progress";
import type { QuizSession } from "@/types/quiz";

export type ProgressStatus = "idle" | "loading" | "ready" | "error";

interface ProgressState {
  data: ProgressData;
  status: ProgressStatus;
  /** Loads persisted progress once; later calls are no-ops. */
  load: () => Promise<void>;
  /** Applies a completed quiz session and persists the result. */
  recordSession: (session: QuizSession) => Promise<void>;
}

/** Factory so tests can inject an in-memory repository and clock. */
export function createProgressStore(
  getRepository: () => ProgressRepository,
  now: () => number = Date.now,
) {
  return create<ProgressState>()((set, get) => ({
    data: emptyProgress(),
    status: "idle",

    load: async () => {
      if (get().status !== "idle") return;
      set({ status: "loading" });
      try {
        set({ data: await getRepository().load(), status: "ready" });
      } catch (error) {
        console.error("[progress] Failed to load progress.", error);
        set({ status: "error" });
      }
    },

    recordSession: async (session) => {
      const data = recordSession(get().data, session, now());
      if (data === get().data) return;
      set({ data });
      try {
        await getRepository().save(data);
      } catch (error) {
        // Progress stays in memory for this visit; surfaced via status.
        console.error("[progress] Failed to save progress.", error);
        set({ status: "error" });
      }
    },
  }));
}

let localRepository: ProgressRepository | null = null;

/** The app's progress store, backed by localStorage (created lazily: no storage on the server). */
export const useProgressStore = createProgressStore(() => {
  localRepository ??= createLocalProgressRepository(window.localStorage);
  return localRepository;
});

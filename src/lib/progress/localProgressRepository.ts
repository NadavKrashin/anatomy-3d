import { z } from "zod";
import type { ProgressData } from "@/types/progress";
import { PROGRESS_DATA_VERSION } from "@/types/progress";
import { QUIZ_MODES } from "@/types/quiz";
import type { ProgressRepository } from "./progressRepository";
import { emptyProgress } from "./progressUpdates";

export const PROGRESS_STORAGE_KEY = "anatomy.progress";

/** Storage subset we need — `localStorage` in the app, an in-memory map in tests. */
export type KeyValueStorage = Pick<Storage, "getItem" | "setItem">;

const structureProgressSchema = z.object({
  structureId: z.string(),
  timesSeen: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  incorrectCount: z.number().int().nonnegative(),
  currentStreak: z.number().int().nonnegative(),
  longestStreak: z.number().int().nonnegative(),
  lastReviewedAt: z.string().optional(),
  confidence: z.number().min(0).max(1),
  intervalDays: z.number().nonnegative(),
  nextReviewAt: z.string().optional(),
});

const progressSchema = z.object({
  version: z.literal(PROGRESS_DATA_VERSION),
  structures: z.record(z.string(), structureProgressSchema),
  sessions: z.array(
    z.object({
      id: z.string(),
      scopeId: z.string(),
      mode: z.enum(QUIZ_MODES),
      startedAt: z.string(),
      completedAt: z.string(),
      total: z.number().int().nonnegative(),
      correctFirstTry: z.number().int().nonnegative(),
      averageResponseMs: z.number().nonnegative(),
    }),
  ),
}) satisfies z.ZodType<ProgressData>;

/**
 * localStorage-backed progress. Stored data is validated on load; anything
 * unreadable is copied to a timestamped backup key instead of being silently
 * discarded, and the app starts from empty progress.
 */
export function createLocalProgressRepository(
  storage: KeyValueStorage,
  key = PROGRESS_STORAGE_KEY,
): ProgressRepository {
  return {
    load() {
      const raw = storage.getItem(key);
      if (raw === null) return Promise.resolve(emptyProgress());
      try {
        return Promise.resolve(progressSchema.parse(JSON.parse(raw)));
      } catch (error) {
        const backupKey = `${key}.corrupt.${Date.now()}`;
        storage.setItem(backupKey, raw);
        console.error(
          `[progress] Stored progress was unreadable; backed up to "${backupKey}".`,
          error,
        );
        return Promise.resolve(emptyProgress());
      }
    },
    save(data) {
      storage.setItem(key, JSON.stringify(data));
      return Promise.resolve();
    },
  };
}

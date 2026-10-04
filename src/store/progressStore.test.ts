import { describe, expect, it, vi } from "vitest";
import { createLocalProgressRepository } from "@/lib/progress/localProgressRepository";
import type { ProgressRepository } from "@/lib/progress/progressRepository";
import { createMemoryStorage } from "@/test/memoryStorage";
import type { QuizSession } from "@/types/quiz";
import { createProgressStore } from "./progressStore";

const NOW = Date.UTC(2026, 9, 4, 12);
const finished: QuizSession = {
  id: "s1",
  startedAt: new Date(NOW - 1000).toISOString(),
  completedAt: new Date(NOW).toISOString(),
  scopeId: "all",
  mode: "find",
  totalQuestions: 1,
  questions: [],
  attempts: [
    {
      questionId: "q1",
      structureId: "heart",
      questionType: "find",
      correct: true,
      attempts: 1,
      revealed: false,
      responseTimeMs: 1000,
      answeredAt: new Date(NOW).toISOString(),
    },
  ],
};

describe("progress store", () => {
  it("persists a recorded session so a new store (page refresh) sees it", async () => {
    const storage = createMemoryStorage();
    const repository = createLocalProgressRepository(storage);
    const store = createProgressStore(
      () => repository,
      () => NOW,
    );
    await store.getState().load();
    await store.getState().recordSession(finished);

    const afterRefresh = createProgressStore(
      () => createLocalProgressRepository(storage),
      () => NOW,
    );
    await afterRefresh.getState().load();
    expect(afterRefresh.getState().data.structures.heart?.correctCount).toBe(1);
    expect(afterRefresh.getState().status).toBe("ready");
  });

  it("does not save twice for the same session", async () => {
    const save = vi.fn(() => Promise.resolve());
    const repository: ProgressRepository = {
      load: () => createLocalProgressRepository(createMemoryStorage()).load(),
      save,
    };
    const store = createProgressStore(
      () => repository,
      () => NOW,
    );
    await store.getState().load();
    await store.getState().recordSession(finished);
    await store.getState().recordSession(finished);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("reports load failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const store = createProgressStore(() => ({
      load: () => Promise.reject(new Error("x")),
      save: () => Promise.resolve(),
    }));
    await store.getState().load();
    expect(store.getState().status).toBe("error");
  });
});

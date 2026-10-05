import { describe, expect, it, vi } from "vitest";
import { createMemoryStorage } from "@/test/memoryStorage";
import {
  createLocalProgressRepository,
  PROGRESS_STORAGE_KEY,
} from "./localProgressRepository";
import { applyAttempt, emptyProgress } from "./progressUpdates";

const sample = () => {
  const data = emptyProgress();
  data.structures.heart = applyAttempt(
    undefined,
    {
      questionId: "q",
      structureId: "heart",
      questionType: "find",
      correct: true,
      attempts: 1,
      revealed: false,
      responseTimeMs: 1000,
      answeredAt: "2026-10-04T12:00:00.000Z",
    },
    Date.UTC(2026, 9, 4),
  );
  return data;
};

describe("local progress repository", () => {
  it("starts empty", async () => {
    await expect(
      createLocalProgressRepository(createMemoryStorage()).load(),
    ).resolves.toEqual(emptyProgress());
  });

  it("round-trips saved progress", async () => {
    const repository = createLocalProgressRepository(createMemoryStorage());
    await repository.save(sample());
    await expect(repository.load()).resolves.toEqual(sample());
  });

  it("backs up unreadable data instead of discarding it", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const storage = createMemoryStorage({
      [PROGRESS_STORAGE_KEY]: '{"version": 99}',
    });
    await expect(
      createLocalProgressRepository(storage).load(),
    ).resolves.toEqual(emptyProgress());
    const backup = Object.entries(storage.dump()).find(([key]) =>
      key.startsWith(`${PROGRESS_STORAGE_KEY}.corrupt.`),
    );
    expect(backup?.[1]).toBe('{"version": 99}');
  });

  it("rejects structurally invalid values", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const bad = {
      ...sample(),
      structures: { heart: { ...sample().structures.heart, confidence: 7 } },
    };
    const storage = createMemoryStorage({
      [PROGRESS_STORAGE_KEY]: JSON.stringify(bad),
    });
    await expect(
      createLocalProgressRepository(storage).load(),
    ).resolves.toEqual(emptyProgress());
  });
});

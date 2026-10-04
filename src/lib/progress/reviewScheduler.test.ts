import { describe, expect, it } from "vitest";
import {
  AGAIN_DELAY_MINUTES,
  gradeAttempt,
  MAX_INTERVAL_DAYS,
  nextInterval,
  scheduleReview,
  updateConfidence,
} from "./reviewScheduler";

const NOW = Date.UTC(2026, 9, 4, 12);

describe("gradeAttempt", () => {
  it("grades by correctness, retries and reveals", () => {
    expect(gradeAttempt({ correct: true, attempts: 1, revealed: false })).toBe(
      "good",
    );
    expect(gradeAttempt({ correct: true, attempts: 3, revealed: false })).toBe(
      "hard",
    );
    expect(gradeAttempt({ correct: false, attempts: 1, revealed: false })).toBe(
      "again",
    );
    expect(gradeAttempt({ correct: false, attempts: 2, revealed: true })).toBe(
      "again",
    );
  });
});

describe("review intervals", () => {
  it("incorrect → review soon", () => {
    expect(scheduleReview(10, "again", NOW)).toEqual({
      intervalDays: 0,
      nextReviewAt: new Date(NOW + AGAIN_DELAY_MINUTES * 60_000).toISOString(),
    });
  });

  it("struggled → moderately soon, never less than a day", () => {
    expect(nextInterval(0, "hard")).toBe(1);
    expect(nextInterval(10, "hard")).toBe(12);
  });

  it("correct → later, growing with repetition and capped", () => {
    const intervals = [0];
    for (let i = 0; i < 8; i++)
      intervals.push(nextInterval(intervals.at(-1) ?? 0, "good"));
    expect(intervals.slice(0, 5)).toEqual([0, 1, 3, 8, 20]);
    expect(Math.max(...intervals)).toBe(MAX_INTERVAL_DAYS);
  });

  it("schedules whole days ahead for non-zero intervals", () => {
    expect(scheduleReview(1, "good", NOW).nextReviewAt).toBe(
      new Date(NOW + 3 * 86_400_000).toISOString(),
    );
  });
});

describe("updateConfidence", () => {
  it("moves toward the grade score without jumping all the way", () => {
    expect(updateConfidence(0, "good")).toBe(0.4);
    expect(updateConfidence(1, "again")).toBe(0.6);
    expect(updateConfidence(0.5, "hard")).toBe(0.54);
  });

  it("stays within 0–1", () => {
    let c = 0;
    for (let i = 0; i < 50; i++) c = updateConfidence(c, "good");
    expect(c).toBeLessThanOrEqual(1);
    expect(c).toBeGreaterThan(0.99);
  });
});

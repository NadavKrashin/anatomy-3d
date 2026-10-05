import { describe, expect, it } from "vitest";
import type { QuizAttempt, QuizSession } from "@/types/quiz";
import {
  applyAttempt,
  emptyProgress,
  MAX_SESSION_RECORDS,
  recordSession,
} from "./progressUpdates";
import {
  dueForReview,
  progressOverview,
  recentlyStudied,
  weakestStructures,
} from "./progressStats";

const NOW = Date.UTC(2026, 9, 4, 12);
const DAY = 86_400_000;

const attempt = (
  structureId: string,
  overrides: Partial<QuizAttempt> = {},
): QuizAttempt => ({
  questionId: `q-${structureId}`,
  structureId,
  questionType: "find",
  correct: true,
  attempts: 1,
  revealed: false,
  responseTimeMs: 3000,
  answeredAt: new Date(NOW).toISOString(),
  ...overrides,
});

const session = (
  id: string,
  attempts: QuizAttempt[],
  completed = true,
): QuizSession => ({
  id,
  startedAt: new Date(NOW - 60_000).toISOString(),
  ...(completed ? { completedAt: new Date(NOW).toISOString() } : {}),
  scopeId: "all",
  mode: "find",
  totalQuestions: attempts.length,
  questions: [],
  attempts,
});

describe("applyAttempt", () => {
  it("counts a first-try success and grows the streak", () => {
    const once = applyAttempt(undefined, attempt("heart"), NOW);
    const twice = applyAttempt(once, attempt("heart"), NOW);
    expect(twice).toMatchObject({
      timesSeen: 2,
      correctCount: 2,
      incorrectCount: 0,
      currentStreak: 2,
      longestStreak: 2,
    });
    expect(twice.intervalDays).toBeGreaterThan(once.intervalDays);
  });

  it("a miss resets the streak, keeps the longest, and schedules a quick review", () => {
    let p = applyAttempt(undefined, attempt("heart"), NOW);
    p = applyAttempt(p, attempt("heart"), NOW);
    p = applyAttempt(p, attempt("heart", { correct: false }), NOW);
    expect(p).toMatchObject({
      incorrectCount: 1,
      currentStreak: 0,
      longestStreak: 2,
      intervalDays: 0,
    });
  });

  it("a success after retries counts as correct but breaks the streak", () => {
    const p = applyAttempt(undefined, attempt("heart", { attempts: 3 }), NOW);
    expect(p).toMatchObject({
      correctCount: 1,
      currentStreak: 0,
      intervalDays: 1,
    });
  });
});

describe("recordSession", () => {
  it("applies every attempt and keeps a compact session record", () => {
    const data = recordSession(
      emptyProgress(),
      session("s1", [attempt("heart"), attempt("liver", { correct: false })]),
      NOW,
    );
    expect(Object.keys(data.structures).sort()).toEqual(["heart", "liver"]);
    expect(data.sessions).toEqual([
      expect.objectContaining({
        id: "s1",
        total: 2,
        correctFirstTry: 1,
        averageResponseMs: 3000,
      }),
    ]);
  });

  it("is idempotent for the same session id", () => {
    const s = session("s1", [attempt("heart")]);
    const once = recordSession(emptyProgress(), s, NOW);
    expect(recordSession(once, s, NOW)).toBe(once);
  });

  it("ignores unfinished sessions", () => {
    const data = emptyProgress();
    expect(
      recordSession(data, session("s1", [attempt("heart")], false), NOW),
    ).toBe(data);
  });

  it("bounds the session history", () => {
    let data = emptyProgress();
    for (let i = 0; i < MAX_SESSION_RECORDS + 5; i++)
      data = recordSession(data, session(`s${i}`, []), NOW);
    expect(data.sessions).toHaveLength(MAX_SESSION_RECORDS);
    expect(data.sessions[0]?.id).toBe("s5");
  });
});

describe("progress stats", () => {
  let data = emptyProgress();
  data = recordSession(
    data,
    session("s1", [
      attempt("heart"),
      attempt("liver", { correct: false }),
      attempt("skull", { attempts: 2 }),
    ]),
    NOW,
  );
  const ids = ["heart", "liver", "skull", "femur-left"];

  it("summarizes mastery and accuracy over the dataset", () => {
    expect(progressOverview(data, ids)).toEqual({
      totalStructures: 4,
      studied: 3,
      mastered: 0,
      masteryPercent: Math.round(((0.4 + 0 + 0.24) / 4) * 100),
      accuracyPercent: 67,
    });
    expect(progressOverview(emptyProgress(), ids).accuracyPercent).toBeNull();
  });

  it("lists the weakest studied structures first", () => {
    expect(weakestStructures(data, ids).map((p) => p.structureId)).toEqual([
      "liver",
      "skull",
      "heart",
    ]);
  });

  it("lists recently studied structures", () => {
    expect(recentlyStudied(data, ids)).toHaveLength(3);
  });

  it("knows what is due", () => {
    expect(dueForReview(data, ids, NOW).map((p) => p.structureId)).toEqual([]);
    expect(
      dueForReview(data, ids, NOW + 15 * 60_000).map((p) => p.structureId),
    ).toEqual(["liver"]);
    expect(
      dueForReview(data, ids, NOW + 2 * DAY)
        .map((p) => p.structureId)
        .sort(),
    ).toEqual(["heart", "liver", "skull"]);
  });
});

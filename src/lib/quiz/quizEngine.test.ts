import { describe, expect, it } from "vitest";
import type { QuizQuestion } from "@/types/quiz";
import {
  canReveal,
  currentQuestion,
  quizReducer,
  REVEAL_AFTER_WRONG_ATTEMPTS,
  startQuiz,
  type QuizRun,
} from "./quizEngine";
import { summarizeSession } from "./summary";

const find = (structureId: string): QuizQuestion => ({
  id: `q-${structureId}`,
  type: "find",
  structureId,
  acceptedStructureIds: [structureId],
});
const identify = (structureId: string, optionIds: string[]): QuizQuestion => ({
  id: `q-${structureId}`,
  type: "identify",
  structureId,
  optionIds,
});

const T0 = Date.UTC(2026, 9, 4, 12, 0, 0);
const start = (questions: QuizQuestion[]) =>
  startQuiz({ id: "s1", scopeId: "all", mode: "mixed", questions, now: T0 });
const answer = (run: QuizRun, structureId: string, now = T0 + 1000) =>
  quizReducer(run, { type: "answer", structureId, now });
const next = (run: QuizRun, now = T0 + 2000) =>
  quizReducer(run, { type: "next", now });

describe("quiz engine — find questions", () => {
  it("a correct click finishes the question and records a first-try success", () => {
    const run = answer(start([find("heart")]), "heart", T0 + 4800);
    expect(run.phase).toBe("answered");
    expect(run.feedback).toEqual({ kind: "correct", structureId: "heart" });
    expect(run.session.attempts[0]).toMatchObject({
      correct: true,
      attempts: 1,
      revealed: false,
      responseTimeMs: 4800,
    });
  });

  it("a wrong click gives feedback and allows a retry", () => {
    let run = answer(start([find("heart")]), "liver");
    expect(run.phase).toBe("answering");
    expect(run.feedback).toEqual({
      kind: "incorrect",
      chosenId: "liver",
      correctId: "heart",
      final: false,
    });
    run = answer(run, "heart");
    expect(run.session.attempts[0]).toMatchObject({
      correct: true,
      attempts: 2,
    });
  });

  it(`offers "show answer" only after ${REVEAL_AFTER_WRONG_ATTEMPTS} wrong clicks`, () => {
    let run = start([find("heart")]);
    run = answer(run, "liver");
    expect(canReveal(run)).toBe(false);
    expect(quizReducer(run, { type: "reveal", now: T0 })).toBe(run);
    run = answer(run, "lung-left");
    expect(canReveal(run)).toBe(true);

    run = quizReducer(run, { type: "reveal", now: T0 + 9000 });
    expect(run.feedback).toEqual({ kind: "revealed", structureId: "heart" });
    expect(run.session.attempts[0]).toMatchObject({
      correct: false,
      revealed: true,
      attempts: 2,
    });
  });

  it("ignores answers once the question is answered", () => {
    const run = answer(start([find("heart")]), "heart");
    expect(answer(run, "liver")).toBe(run);
  });
});

describe("quiz engine — identify questions", () => {
  it("is one-shot: a wrong choice ends the question and names the answer", () => {
    const run = answer(start([identify("heart", ["heart", "liver"])]), "liver");
    expect(run.phase).toBe("answered");
    expect(run.feedback).toEqual({
      kind: "incorrect",
      chosenId: "liver",
      correctId: "heart",
      final: true,
    });
    expect(run.session.attempts[0]).toMatchObject({
      correct: false,
      attempts: 1,
    });
    expect(canReveal(run)).toBe(false);
  });
});

describe("quiz engine — flow", () => {
  it("advances through questions and completes the session", () => {
    let run = start([find("heart"), find("liver")]);
    run = next(answer(run, "heart"));
    expect(currentQuestion(run)?.structureId).toBe("liver");
    expect(run.questionStartedAt).toBe(T0 + 2000);

    run = next(answer(run, "liver", T0 + 5000), T0 + 6000);
    expect(run.phase).toBe("complete");
    expect(run.session.completedAt).toBe(new Date(T0 + 6000).toISOString());
    expect(currentQuestion(run)).toBeUndefined();
  });

  it("can't skip an unanswered question", () => {
    const run = start([find("heart"), find("liver")]);
    expect(next(run)).toBe(run);
  });

  it("an empty quiz is immediately complete", () => {
    expect(start([]).phase).toBe("complete");
  });
});

describe("summarizeSession", () => {
  it("scores first-try answers and lists everything else for review", () => {
    let run = start([
      find("heart"),
      find("liver"),
      identify("lung-left", ["lung-left", "heart"]),
      find("skull"),
    ]);
    run = next(answer(run, "heart", T0 + 2000)); // first try
    run = next(answer(answer(run, "heart"), "liver", T0 + 6000)); // after retry
    run = next(answer(run, "heart", T0 + 4000)); // wrong identify
    run = answer(answer(run, "heart"), "liver");
    run = next(quizReducer(run, { type: "reveal", now: T0 + 10000 })); // revealed

    expect(summarizeSession(run.session)).toEqual({
      total: 4,
      correctFirstTry: 1,
      correctAfterRetry: 1,
      missed: 2,
      percent: 25,
      averageResponseMs: expect.any(Number) as number,
      reviewStructureIds: ["liver", "lung-left", "skull"],
    });
  });

  it("handles an empty session", () => {
    expect(summarizeSession(start([]).session)).toMatchObject({
      total: 0,
      percent: 0,
      averageResponseMs: 0,
    });
  });
});

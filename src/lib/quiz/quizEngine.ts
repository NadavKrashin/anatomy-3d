import type {
  QuizAttempt,
  QuizMode,
  QuizQuestion,
  QuizSession,
} from "@/types/quiz";

/** Wrong clicks needed on a find question before "Show answer" is offered (§18). */
export const REVEAL_AFTER_WRONG_ATTEMPTS = 2;

export type QuizFeedback =
  | { kind: "correct"; structureId: string }
  | { kind: "incorrect"; chosenId: string; correctId: string; final: boolean }
  | { kind: "revealed"; structureId: string };

export type QuizPhase = "answering" | "answered" | "complete";

/**
 * Everything needed to run a quiz. Immutable: every action returns a new
 * state, which keeps the engine framework-free and easy to test.
 */
export interface QuizRun {
  session: QuizSession;
  index: number;
  phase: QuizPhase;
  /** Wrong structure ids chosen on the current question. */
  wrongAnswers: string[];
  questionStartedAt: number;
  feedback: QuizFeedback | null;
}

export type QuizAction =
  | { type: "answer"; structureId: string; now: number }
  | { type: "reveal"; now: number }
  | { type: "next"; now: number };

export function startQuiz(params: {
  id: string;
  scopeId: string;
  mode: QuizMode;
  questions: QuizQuestion[];
  now: number;
}): QuizRun {
  const { id, scopeId, mode, questions, now } = params;
  return {
    session: {
      id,
      startedAt: new Date(now).toISOString(),
      scopeId,
      mode,
      totalQuestions: questions.length,
      questions,
      attempts: [],
    },
    index: 0,
    phase: questions.length === 0 ? "complete" : "answering",
    wrongAnswers: [],
    questionStartedAt: now,
    feedback: null,
  };
}

export function currentQuestion(run: QuizRun): QuizQuestion | undefined {
  return run.phase === "complete"
    ? undefined
    : run.session.questions[run.index];
}

export function canReveal(run: QuizRun): boolean {
  return (
    run.phase === "answering" &&
    currentQuestion(run)?.type === "find" &&
    run.wrongAnswers.length >= REVEAL_AFTER_WRONG_ATTEMPTS
  );
}

function isCorrect(question: QuizQuestion, structureId: string): boolean {
  return question.type === "find"
    ? question.acceptedStructureIds.includes(structureId)
    : question.structureId === structureId;
}

function finishQuestion(
  run: QuizRun,
  question: QuizQuestion,
  now: number,
  outcome: Pick<QuizAttempt, "correct" | "attempts" | "revealed">,
  feedback: QuizFeedback,
): QuizRun {
  const attempt: QuizAttempt = {
    questionId: question.id,
    structureId: question.structureId,
    questionType: question.type,
    ...outcome,
    responseTimeMs: Math.max(0, now - run.questionStartedAt),
    answeredAt: new Date(now).toISOString(),
  };
  return {
    ...run,
    phase: "answered",
    session: { ...run.session, attempts: [...run.session.attempts, attempt] },
    feedback,
  };
}

function answer(run: QuizRun, structureId: string, now: number): QuizRun {
  const question = currentQuestion(run);
  if (!question || run.phase !== "answering") return run;
  const attempts = run.wrongAnswers.length + 1;

  if (isCorrect(question, structureId)) {
    return finishQuestion(
      run,
      question,
      now,
      { correct: true, attempts, revealed: false },
      // The side clicked (a clue accepts either side of a pair).
      { kind: "correct", structureId },
    );
  }
  // Multiple-choice questions are one-shot; find questions allow retries (§18).
  if (question.type !== "find") {
    return finishQuestion(
      run,
      question,
      now,
      { correct: false, attempts, revealed: false },
      {
        kind: "incorrect",
        chosenId: structureId,
        correctId: question.structureId,
        final: true,
      },
    );
  }
  return {
    ...run,
    wrongAnswers: [...run.wrongAnswers, structureId],
    feedback: {
      kind: "incorrect",
      chosenId: structureId,
      correctId: question.structureId,
      final: false,
    },
  };
}

function reveal(run: QuizRun, now: number): QuizRun {
  const question = currentQuestion(run);
  if (!question || !canReveal(run)) return run;
  return finishQuestion(
    run,
    question,
    now,
    { correct: false, attempts: run.wrongAnswers.length, revealed: true },
    { kind: "revealed", structureId: question.structureId },
  );
}

function next(run: QuizRun, now: number): QuizRun {
  if (run.phase !== "answered") return run;
  const index = run.index + 1;
  const base = {
    ...run,
    index,
    wrongAnswers: [],
    feedback: null,
    questionStartedAt: now,
  };
  if (index < run.session.questions.length)
    return { ...base, phase: "answering" };
  return {
    ...base,
    phase: "complete",
    session: { ...run.session, completedAt: new Date(now).toISOString() },
  };
}

/** Applies an action; invalid actions for the current phase are ignored. */
export function quizReducer(run: QuizRun, action: QuizAction): QuizRun {
  switch (action.type) {
    case "answer":
      return answer(run, action.structureId, action.now);
    case "reveal":
      return reveal(run, action.now);
    case "next":
      return next(run, action.now);
  }
}

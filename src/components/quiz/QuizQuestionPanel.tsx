"use client";

import { Eye } from "lucide-react";
import { LayerControls } from "@/components/anatomy/LayerControls";
import { ViewerPanel } from "@/components/anatomy/ViewerPanel";
import { buttonClass } from "@/components/ui/Button";
import { useMessages } from "@/hooks/useMessages";
import { canReveal, currentQuestion } from "@/lib/quiz/quizEngine";
import { useQuizStore } from "@/store/quizStore";
import { IdentifyOptions } from "./IdentifyOptions";
import { QuizFeedback } from "./QuizFeedback";
import { QuizPrompt } from "./QuizPrompt";

/** The current question: prompt, answer options or click instruction, feedback and controls. */
export function QuizQuestionPanel() {
  const t = useMessages();
  const run = useQuizStore((s) => s.run);
  const dispatch = useQuizStore((s) => s.dispatch);
  const question = run ? currentQuestion(run) : undefined;
  if (!run || !question) return null;

  const answered = run.phase === "answered";
  const isLast = run.index === run.session.totalQuestions - 1;

  return (
    <ViewerPanel label={t.nav.quiz}>
      <div
        className="flex min-h-0 flex-col gap-5 overflow-y-auto p-5"
        aria-live="polite"
      >
        <QuizPrompt question={question} />

        {question.type !== "find" && (
          <IdentifyOptions
            question={question}
            answered={answered}
            feedback={run.feedback}
            onChoose={(structureId) =>
              dispatch({ type: "answer", structureId, now: Date.now() })
            }
          />
        )}

        {run.feedback && (
          <QuizFeedback
            feedback={run.feedback}
            withSide={question.type !== "describe"}
          />
        )}

        {question.type === "find" && !answered && (
          // Deep muscles hide under superficial ones: peel to reach them.
          <div className="-ms-2 flex flex-wrap gap-1">
            <LayerControls showLabel />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {canReveal(run) && (
            <button
              type="button"
              onClick={() => dispatch({ type: "reveal", now: Date.now() })}
              className={buttonClass({ variant: "secondary", size: "sm" })}
            >
              <Eye className="size-4" aria-hidden />
              {t.quiz.showAnswer}
            </button>
          )}
          {answered && (
            <button
              type="button"
              autoFocus
              onClick={() => dispatch({ type: "next", now: Date.now() })}
              className={buttonClass({ size: "sm" })}
            >
              {isLast ? t.quiz.finish : t.quiz.next}
            </button>
          )}
        </div>
      </div>
    </ViewerPanel>
  );
}

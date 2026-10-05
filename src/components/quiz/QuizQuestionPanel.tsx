"use client";

import { Eye } from "lucide-react";
import { StructureLabel } from "@/components/anatomy/StructureLabel";
import { ViewerPanel } from "@/components/anatomy/ViewerPanel";
import { buttonClass } from "@/components/ui/Button";
import { useMessages } from "@/hooks/useMessages";
import { canReveal, currentQuestion } from "@/lib/quiz/quizEngine";
import { useQuizStore } from "@/store/quizStore";
import { IdentifyOptions } from "./IdentifyOptions";
import { QuizFeedback } from "./QuizFeedback";

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
        {question.type === "find" ? (
          <div className="flex flex-col gap-1">
            <p className="text-graphite text-[14px]">{t.quiz.findPrompt}</p>
            <h2 className="font-serif text-[26px] leading-tight font-medium">
              <StructureLabel structureId={question.structureId} />
            </h2>
          </div>
        ) : (
          <h2 className="font-serif text-[24px] leading-tight font-medium">
            {t.quiz.identifyPrompt}
          </h2>
        )}

        {question.type === "identify" && (
          <IdentifyOptions
            question={question}
            answered={answered}
            feedback={run.feedback}
            onChoose={(structureId) =>
              dispatch({ type: "answer", structureId, now: Date.now() })
            }
          />
        )}

        {run.feedback && <QuizFeedback feedback={run.feedback} />}

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

"use client";

import { ArrowLeft, ArrowRight, Eye } from "lucide-react";
import { StructureLabel } from "@/components/anatomy/StructureLabel";
import { ViewerPanel } from "@/components/anatomy/ViewerPanel";
import { useMessages } from "@/hooks/useMessages";
import { canReveal, currentQuestion } from "@/lib/quiz/quizEngine";
import { useQuizStore } from "@/store/quizStore";
import { useSettingsStore } from "@/store/settingsStore";
import { IdentifyOptions } from "./IdentifyOptions";
import { QuizFeedback } from "./QuizFeedback";

const buttonBase =
  "inline-flex h-10 items-center gap-2 rounded-[10px] px-4 text-sm font-medium transition-colors";

/** The current question: prompt, answer options or click instruction, feedback and controls. */
export function QuizQuestionPanel() {
  const t = useMessages();
  const run = useQuizStore((s) => s.run);
  const dispatch = useQuizStore((s) => s.dispatch);
  const rtl = useSettingsStore((s) => s.locale === "he");
  const question = run ? currentQuestion(run) : undefined;
  if (!run || !question) return null;

  const answered = run.phase === "answered";
  const isLast = run.index === run.session.totalQuestions - 1;
  const Forward = rtl ? ArrowLeft : ArrowRight;

  return (
    <ViewerPanel label={t.nav.quiz}>
      <div
        className="flex min-h-0 flex-col gap-4 overflow-y-auto p-4"
        aria-live="polite"
      >
        {question.type === "find" ? (
          <div className="flex flex-col gap-1">
            <p className="text-muted text-sm">{t.quiz.findPrompt}</p>
            <h2 className="text-xl font-semibold">
              <StructureLabel structureId={question.structureId} />
            </h2>
          </div>
        ) : (
          <h2 className="text-xl font-semibold">{t.quiz.identifyPrompt}</h2>
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
              className={`${buttonBase} border-line bg-raised hover:border-accent/50 border`}
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
              className={`${buttonBase} bg-accent text-accent-ink hover:opacity-90`}
            >
              {isLast ? t.quiz.finish : t.quiz.next}
              <Forward className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </ViewerPanel>
  );
}

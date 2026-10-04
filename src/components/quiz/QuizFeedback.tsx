"use client";

import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { StructureLabel } from "@/components/anatomy/StructureLabel";
import { useMessages } from "@/hooks/useMessages";
import type { QuizFeedback as Feedback } from "@/lib/quiz/quizEngine";

/** Result of the last answer — always icon + text, never colour alone. */
export function QuizFeedback({ feedback }: { feedback: Feedback }) {
  const t = useMessages();

  switch (feedback.kind) {
    case "correct":
      return (
        <div
          role="status"
          className="flex items-start gap-3 rounded-[10px] border border-emerald-400/30 bg-emerald-400/10 p-3"
        >
          <CheckCircle2
            className="mt-0.5 size-5 shrink-0 text-emerald-300"
            aria-hidden
          />
          <div className="flex flex-col gap-1">
            <span className="font-medium text-emerald-200">
              {t.quiz.correct}
            </span>
            <StructureLabel
              structureId={feedback.structureId}
              className="text-sm"
            />
          </div>
        </div>
      );
    case "incorrect":
      return (
        <div
          role="status"
          className="flex items-start gap-3 rounded-[10px] border border-rose-400/30 bg-rose-400/10 p-3"
        >
          <XCircle
            className="mt-0.5 size-5 shrink-0 text-rose-300"
            aria-hidden
          />
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-base font-medium text-rose-200">
              {t.quiz.incorrect}
            </span>
            {feedback.final ? (
              <>
                <span className="text-muted">{t.quiz.correctAnswer}</span>
                <StructureLabel structureId={feedback.correctId} />
              </>
            ) : (
              <>
                <span className="text-muted">{t.quiz.youChose}</span>
                <StructureLabel structureId={feedback.chosenId} />
                <span className="text-muted">{t.quiz.tryAgain}</span>
              </>
            )}
          </div>
        </div>
      );
    case "revealed":
      return (
        <div
          role="status"
          className="border-line bg-raised flex items-start gap-3 rounded-[10px] border p-3"
        >
          <Eye className="text-accent mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-muted">{t.quiz.revealedAnswer}</span>
            <StructureLabel structureId={feedback.structureId} />
          </div>
        </div>
      );
  }
}

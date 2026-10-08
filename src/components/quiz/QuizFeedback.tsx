"use client";

import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { StructureLabel } from "@/components/anatomy/StructureLabel";
import { useMessages } from "@/hooks/useMessages";
import type { QuizFeedback as Feedback } from "@/lib/quiz/quizEngine";

/**
 * Result of the last answer — always icon + text, never colour alone. Names
 * leave out the side when the question didn't ask for one (her clues).
 */
export function QuizFeedback({
  feedback,
  withSide = true,
}: {
  feedback: Feedback;
  withSide?: boolean;
}) {
  const t = useMessages();

  switch (feedback.kind) {
    case "correct":
      return (
        <div
          role="status"
          className="bg-correct-soft flex items-start gap-3 rounded-xl p-4"
        >
          <CheckCircle2
            className="text-correct mt-0.5 size-5 shrink-0"
            aria-hidden
          />
          <div className="flex flex-col gap-1">
            <span className="text-correct font-medium">{t.quiz.correct}</span>
            <StructureLabel
              structureId={feedback.structureId}
              className="text-[14px]"
            />
          </div>
        </div>
      );
    case "incorrect":
      return (
        <div
          role="status"
          className="bg-wrong-soft flex items-start gap-3 rounded-xl p-4"
        >
          <XCircle className="text-wrong mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="flex flex-col gap-1 text-[14px]">
            <span className="text-wrong text-[15px] font-medium">
              {t.quiz.incorrect}
            </span>
            {feedback.final ? (
              <>
                <span className="text-graphite">{t.quiz.correctAnswer}</span>
                <StructureLabel
                  structureId={feedback.correctId}
                  withSide={withSide}
                />
              </>
            ) : (
              <>
                <span className="text-graphite">{t.quiz.youChose}</span>
                <StructureLabel structureId={feedback.chosenId} />
                <span className="text-graphite">{t.quiz.tryAgain}</span>
              </>
            )}
          </div>
        </div>
      );
    case "revealed":
      return (
        <div
          role="status"
          className="bg-wash flex items-start gap-3 rounded-xl p-4"
        >
          <Eye className="text-scrub mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="flex flex-col gap-1 text-[14px]">
            <span className="text-graphite">{t.quiz.revealedAnswer}</span>
            <StructureLabel structureId={feedback.structureId} />
          </div>
        </div>
      );
  }
}

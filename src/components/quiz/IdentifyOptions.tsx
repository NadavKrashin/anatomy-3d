"use client";

import { clsx } from "clsx";
import { Check, X } from "lucide-react";
import { StructureLabel } from "@/components/anatomy/StructureLabel";
import { Kbd } from "@/components/ui/Kbd";
import type { QuizFeedback } from "@/lib/quiz/quizEngine";
import type { ChoiceQuestion } from "@/types/quiz";

interface IdentifyOptionsProps {
  question: ChoiceQuestion;
  answered: boolean;
  feedback: QuizFeedback | null;
  onChoose: (structureId: string) => void;
}

/**
 * Multiple-choice answers; after answering, marks the right one and the wrong
 * pick. Answers to her clues name no side: the clue doesn't say which.
 */
export function IdentifyOptions({
  question,
  answered,
  feedback,
  onChoose,
}: IdentifyOptionsProps) {
  const chosenWrong = feedback?.kind === "incorrect" ? feedback.chosenId : null;

  return (
    <ol className="divide-rule border-rule divide-y border-y">
      {question.optionIds.map((id, index) => {
        const isAnswer = answered && id === question.structureId;
        const isWrongPick = answered && id === chosenWrong;
        return (
          <li key={id}>
            <button
              type="button"
              disabled={answered}
              onClick={() => onChoose(id)}
              className={clsx(
                "flex w-full items-center gap-3 px-1 py-3 text-start transition-colors",
                !answered && "hover:bg-wash rounded-lg",
                isAnswer && "bg-correct-soft rounded-lg",
                isWrongPick && "bg-wrong-soft rounded-lg",
                answered && !isAnswer && !isWrongPick && "opacity-45",
              )}
            >
              <Kbd>{index + 1}</Kbd>
              <StructureLabel
                structureId={id}
                withSide={question.type === "identify"}
                className="font-title flex-1 text-[17px]"
              />
              {isAnswer && (
                <Check className="text-correct size-4" aria-hidden />
              )}
              {isWrongPick && <X className="text-wrong size-4" aria-hidden />}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

"use client";

import { clsx } from "clsx";
import { Check, X } from "lucide-react";
import { StructureLabel } from "@/components/anatomy/StructureLabel";
import { Kbd } from "@/components/ui/Kbd";
import type { QuizFeedback } from "@/lib/quiz/quizEngine";
import type { IdentifyQuestion } from "@/types/quiz";

interface IdentifyOptionsProps {
  question: IdentifyQuestion;
  answered: boolean;
  feedback: QuizFeedback | null;
  onChoose: (structureId: string) => void;
}

/** Multiple-choice answers; after answering, marks the right one and the wrong pick. */
export function IdentifyOptions({
  question,
  answered,
  feedback,
  onChoose,
}: IdentifyOptionsProps) {
  const chosenWrong = feedback?.kind === "incorrect" ? feedback.chosenId : null;

  return (
    <ol className="flex flex-col gap-2">
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
                "flex w-full items-center gap-3 rounded-[10px] border p-3 text-start transition-colors",
                !answered && "border-line bg-raised hover:border-accent/50",
                isAnswer && "border-emerald-400/50 bg-emerald-400/10",
                isWrongPick && "border-rose-400/50 bg-rose-400/10",
                answered &&
                  !isAnswer &&
                  !isWrongPick &&
                  "border-line opacity-50",
              )}
            >
              <Kbd>{index + 1}</Kbd>
              <StructureLabel structureId={id} className="flex-1 text-sm" />
              {isAnswer && (
                <Check className="size-4 text-emerald-300" aria-hidden />
              )}
              {isWrongPick && (
                <X className="size-4 text-rose-300" aria-hidden />
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

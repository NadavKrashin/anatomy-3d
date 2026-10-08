"use client";

import { StructureLabel } from "@/components/anatomy/StructureLabel";
import { useMessages } from "@/hooks/useMessages";
import type { QuizQuestion } from "@/types/quiz";

/** Her description of the structure, as she wrote it (Hebrew). */
function Clue({ text }: { text: string }) {
  return (
    <blockquote
      lang="he"
      dir="rtl"
      className="border-scrub text-ink border-s-2 ps-3 text-[18px] leading-relaxed"
    >
      {text}
    </blockquote>
  );
}

/** What the current question asks: a name to find, her clue, or "what is highlighted?". */
export function QuizPrompt({ question }: { question: QuizQuestion }) {
  const t = useMessages();
  switch (question.type) {
    case "find":
      return question.clue ? (
        <div className="flex flex-col gap-2">
          <p className="text-graphite text-[14px]">{t.quiz.findCluePrompt}</p>
          <Clue text={question.clue} />
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-graphite text-[14px]">{t.quiz.findPrompt}</p>
          <h2 className="font-title text-[26px] leading-tight font-medium">
            <StructureLabel structureId={question.structureId} />
          </h2>
        </div>
      );
    case "describe":
      return (
        <div className="flex flex-col gap-2">
          <h2 className="font-title text-[22px] leading-tight font-medium">
            {t.quiz.describePrompt}
          </h2>
          <Clue text={question.clue} />
        </div>
      );
    case "identify":
      return (
        <h2 className="font-title text-[24px] leading-tight font-medium">
          {t.quiz.identifyPrompt}
        </h2>
      );
  }
}

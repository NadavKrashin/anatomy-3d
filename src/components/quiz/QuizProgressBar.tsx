"use client";

import { X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { useMessages } from "@/hooks/useMessages";
import { useQuizStore } from "@/store/quizStore";

/** "Question 3 of 10" with a thin progress bar and an exit button, for the viewer top bar. */
export function QuizProgressBar({ onExit }: { onExit: () => void }) {
  const t = useMessages();
  const run = useQuizStore((s) => s.run);
  const total = run?.session.totalQuestions ?? 0;
  const done = run?.session.attempts.length ?? 0;
  const current = Math.min((run?.index ?? 0) + 1, total);

  return (
    <div className="bg-sheet/95 flex h-11 items-center gap-3 rounded-full ps-5 pe-1 shadow-[var(--shadow-float)] backdrop-blur">
      <span className="text-ink shrink-0 text-[14px] tabular-nums">
        {total > 0 ? t.quiz.questionOf(current, total) : t.quiz.preparing}
      </span>
      <div
        className="bg-rule h-0.5 flex-1 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <div
          className="bg-scrub h-full transition-[width] duration-300"
          style={{ width: total ? `${(done / total) * 100}%` : 0 }}
        />
      </div>
      <IconButton label={t.quiz.exit} icon={<X />} onClick={onExit} />
    </div>
  );
}

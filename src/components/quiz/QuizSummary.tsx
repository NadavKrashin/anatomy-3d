"use client";

import Link from "next/link";
import { StructureLabel } from "@/components/anatomy/StructureLabel";
import { ViewerPanel } from "@/components/anatomy/ViewerPanel";
import { useMessages } from "@/hooks/useMessages";
import { summarizeSession } from "@/lib/quiz/summary";
import { useQuizStore } from "@/store/quizStore";

interface QuizSummaryProps {
  onReviewMistakes: (structureIds: string[]) => void;
  onQuizAgain: () => void;
}

const action =
  "inline-flex h-10 items-center rounded-[10px] px-4 text-sm font-medium transition-colors";

/** End-of-quiz results (§22). */
export function QuizSummary({
  onReviewMistakes,
  onQuizAgain,
}: QuizSummaryProps) {
  const t = useMessages();
  const session = useQuizStore((s) => s.run?.session);
  if (!session) return null;
  const summary = summarizeSession(session);
  const reviewIds = [...new Set(summary.reviewStructureIds)];

  return (
    <ViewerPanel label={t.quiz.complete}>
      <div className="flex min-h-0 flex-col gap-5 overflow-y-auto p-5">
        <h2 className="text-muted text-sm font-medium">{t.quiz.complete}</h2>

        {summary.total === 0 ? (
          <p className="text-sm">{t.quiz.noEligible}</p>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <p className="text-5xl font-semibold tabular-nums" dir="ltr">
                {summary.percent}%
              </p>
              <p className="text-ink">
                {t.quiz.scoreLine(summary.correctFirstTry, summary.total)}
              </p>
              {summary.correctAfterRetry > 0 && (
                <p className="text-muted text-sm">
                  {t.quiz.afterRetry(summary.correctAfterRetry)}
                </p>
              )}
              <p className="text-muted text-sm">
                {t.quiz.averageTime}:{" "}
                {t.quiz.seconds((summary.averageResponseMs / 1000).toFixed(1))}
              </p>
            </div>

            <section className="flex flex-col gap-2">
              <h3 className="text-muted text-[11px] font-semibold tracking-[0.08em] uppercase">
                {t.quiz.toReview}
              </h3>
              {reviewIds.length === 0 ? (
                <p className="text-sm">{t.quiz.nothingToReview}</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {reviewIds.map((id) => (
                    <li key={id}>
                      <Link
                        href={`/explore?structure=${id}`}
                        className="hover:bg-raised block rounded-[8px] px-2 py-1.5 text-sm"
                      >
                        <StructureLabel structureId={id} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
      <footer className="border-line border-t p-3">
        <div className="flex flex-wrap gap-2">
          {reviewIds.length > 0 && (
            <button
              type="button"
              onClick={() => onReviewMistakes(reviewIds)}
              className={`${action} bg-accent text-accent-ink hover:opacity-90`}
            >
              {t.quiz.reviewMistakes}
            </button>
          )}
          <button
            type="button"
            onClick={onQuizAgain}
            className={`${action} border-line bg-raised hover:border-accent/50 border`}
          >
            {t.quiz.quizAgain}
          </button>
          <Link
            href="/explore"
            className={`${action} text-muted hover:text-ink`}
          >
            {t.quiz.returnToExplore}
          </Link>
        </div>
      </footer>
    </ViewerPanel>
  );
}

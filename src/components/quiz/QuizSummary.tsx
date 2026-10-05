"use client";

import Link from "next/link";
import { StructureLabel } from "@/components/anatomy/StructureLabel";
import { ViewerPanel } from "@/components/anatomy/ViewerPanel";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useMessages } from "@/hooks/useMessages";
import { summarizeSession } from "@/lib/quiz/summary";
import { useQuizStore } from "@/store/quizStore";

interface QuizSummaryProps {
  onReviewMistakes: (structureIds: string[]) => void;
  onQuizAgain: () => void;
}

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
      <div className="flex min-h-0 flex-col gap-6 overflow-y-auto p-5">
        <p className="text-graphite text-[14px]">{t.quiz.complete}</p>

        {summary.total === 0 ? (
          <p className="text-[15px]">{t.quiz.noEligible}</p>
        ) : (
          <>
            <div className="-mt-3 flex flex-col gap-1.5">
              <h2 className="text-ink font-serif text-[28px] leading-tight font-medium">
                {t.quiz.scoreLine(summary.correctFirstTry, summary.total)}
              </h2>
              {summary.correctAfterRetry > 0 && (
                <p className="text-graphite text-[14px]">
                  {t.quiz.afterRetry(summary.correctAfterRetry)}
                </p>
              )}
              <p className="text-graphite text-[14px]">
                {t.quiz.averageTime}:{" "}
                {t.quiz.seconds((summary.averageResponseMs / 1000).toFixed(1))}
              </p>
            </div>

            <section>
              <h3 className="text-ink mb-1.5 text-[14px] font-semibold">
                {t.quiz.toReview}
              </h3>
              {reviewIds.length === 0 ? (
                <p className="text-graphite text-[15px]">
                  {t.quiz.nothingToReview}
                </p>
              ) : (
                <ul className="divide-rule border-rule divide-y border-y">
                  {reviewIds.map((id) => (
                    <li key={id}>
                      <Link
                        href={`/explore?structure=${id}`}
                        className="hover:bg-wash block rounded-lg px-1 py-2.5 font-serif text-[16px]"
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
      <footer className="flex flex-wrap gap-2 px-5 pt-2 pb-5">
        {reviewIds.length > 0 && (
          <Button size="sm" onClick={() => onReviewMistakes(reviewIds)}>
            {t.quiz.reviewMistakes}
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={onQuizAgain}>
          {t.quiz.quizAgain}
        </Button>
        <ButtonLink variant="quiet" href="/explore">
          {t.quiz.returnToExplore}
        </ButtonLink>
      </footer>
    </ViewerPanel>
  );
}

"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { ButtonLink } from "@/components/ui/Button";
import { useMessages } from "@/hooks/useMessages";
import { DUE_SCOPE_ID } from "@/hooks/useStudyScopes";
import {
  dueForReview,
  progressOverview,
  recentlyStudied,
  weakestStructures,
} from "@/lib/progress/progressStats";
import { useProgressStore } from "@/store/progressStore";
import { StructureProgressList } from "./StructureProgressList";

/** /progress — a ruled summary, then due, weakest and recent structures (§24). */
export function ProgressView() {
  const t = useMessages();
  const { registry } = useAnatomyData();
  const { data, status } = useProgressStore();
  const [now] = useState(() => Date.now());
  const ids = useMemo(() => registry.all.map((s) => s.id), [registry]);

  const overview = progressOverview(data, ids);
  const due = dueForReview(data, ids, now);
  const summary = [
    { label: t.progress.mastery, value: `${overview.masteryPercent}%` },
    {
      label: t.progress.learned,
      value: t.progress.ofTotal(overview.mastered, overview.totalStructures),
    },
    {
      label: t.progress.accuracy,
      value:
        overview.accuracyPercent === null
          ? "—"
          : `${overview.accuracyPercent}%`,
    },
    { label: t.progress.quizzesTaken, value: String(data.sessions.length) },
  ];

  return (
    <PageShell>
      <h1 className="text-ink font-title text-[40px] leading-tight font-medium">
        {t.progress.title}
      </h1>
      {status === "error" && (
        <p className="text-caution text-[14px]">{t.progress.saveFailed}</p>
      )}

      {data.sessions.length === 0 ? (
        <div className="-mt-4 flex flex-col items-start gap-5">
          <p className="text-graphite max-w-[52ch] text-[17px]">
            {t.progress.empty}
          </p>
          <ButtonLink href="/quiz">{t.progress.startQuiz}</ButtonLink>
        </div>
      ) : (
        <div className="grid items-start gap-12 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <dl className="divide-rule border-rule divide-y border-y">
            {summary.map(({ label, value }) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-4 py-3"
              >
                <dt className="text-graphite text-[15px]">{label}</dt>
                <dd
                  className="text-ink font-title text-[22px] tabular-nums"
                  dir="ltr"
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-10">
            <StructureProgressList
              title={t.progress.due}
              items={due}
              empty={t.progress.dueEmpty}
              action={
                due.length > 0 && (
                  <ButtonLink href={`/quiz?scope=${DUE_SCOPE_ID}`} size="sm">
                    {t.progress.quizDue}
                  </ButtonLink>
                )
              }
            />
            <StructureProgressList
              title={t.progress.weakest}
              items={weakestStructures(data, ids)}
            />
            <StructureProgressList
              title={t.progress.recent}
              items={recentlyStudied(data, ids)}
            />
          </div>
        </div>
      )}
    </PageShell>
  );
}

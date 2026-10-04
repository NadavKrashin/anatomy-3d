"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { useMessages } from "@/hooks/useMessages";
import { DUE_SCOPE_ID } from "@/hooks/useStudyScopes";
import {
  dueForReview,
  progressOverview,
  recentlyStudied,
  weakestStructures,
} from "@/lib/progress/progressStats";
import { useProgressStore } from "@/store/progressStore";
import { StatTile } from "./StatTile";
import { StructureProgressList } from "./StructureProgressList";

const primaryLink =
  "bg-accent text-accent-ink inline-flex h-10 items-center rounded-[10px] px-4 text-sm font-medium hover:opacity-90";

/** /progress — mastery overview, due reviews, weakest and recent structures (§24). */
export function ProgressView() {
  const t = useMessages();
  const { registry } = useAnatomyData();
  const { data, status } = useProgressStore();
  const [now] = useState(() => Date.now());
  const ids = useMemo(() => registry.structures.map((s) => s.id), [registry]);

  const overview = progressOverview(data, ids);
  const due = dueForReview(data, ids, now);

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold tracking-tight">
        {t.progress.title}
      </h1>
      {status === "error" && (
        <p className="text-warn text-sm">{t.progress.saveFailed}</p>
      )}

      {data.sessions.length === 0 ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-muted max-w-prose">{t.progress.empty}</p>
          <Link href="/quiz" className={primaryLink}>
            {t.progress.startQuiz}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <StatTile
              label={t.progress.mastery}
              value={`${overview.masteryPercent}%`}
            />
            <StatTile
              label={t.progress.learned}
              value={t.progress.ofTotal(
                overview.mastered,
                overview.totalStructures,
              )}
            />
            <StatTile
              label={t.progress.accuracy}
              value={
                overview.accuracyPercent === null
                  ? "—"
                  : `${overview.accuracyPercent}%`
              }
            />
            <StatTile
              label={t.progress.quizzesTaken}
              value={String(data.sessions.length)}
            />
          </div>

          <StructureProgressList
            title={t.progress.due}
            items={due}
            empty={t.progress.dueEmpty}
            action={
              due.length > 0 && (
                <Link
                  href={`/quiz?scope=${DUE_SCOPE_ID}`}
                  className={primaryLink}
                >
                  {t.progress.quizDue}
                </Link>
              )
            }
          />
          <div className="grid gap-8 md:grid-cols-2">
            <StructureProgressList
              title={t.progress.weakest}
              items={weakestStructures(data, ids)}
            />
            <StructureProgressList
              title={t.progress.recent}
              items={recentlyStudied(data, ids)}
            />
          </div>
        </>
      )}
    </PageShell>
  );
}

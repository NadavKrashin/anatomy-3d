"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { ButtonLink } from "@/components/ui/Button";
import { useMessages } from "@/hooks/useMessages";
import { DUE_SCOPE_ID, useStudyScopes } from "@/hooks/useStudyScopes";
import { ANATOMY_REGIONS, type AnatomyRegion } from "@/types/anatomy";

/** Home as an atlas contents page: a short introduction and the regions to open. */
export function HomeView() {
  const t = useMessages();
  const { registry, dataset } = useAnatomyData();
  const dueScope = useStudyScopes().find((s) => s.id === DUE_SCOPE_ID);

  // Contents order: whole body first, then regions in anatomical order.
  // Structures without a region ("other") aren't a useful place to start.
  const regionOrder: AnatomyRegion[] = [
    "whole-body",
    ...ANATOMY_REGIONS.filter((r) => r !== "whole-body" && r !== "other"),
  ];
  const regions = regionOrder
    .map((region) => ({
      region,
      count:
        region === "whole-body"
          ? registry.structures.length
          : registry.structures.filter((s) => s.region === region).length,
    }))
    .filter(({ count }) => count > 0);

  return (
    <PageShell
      footer={
        <footer className="border-rule text-faint flex flex-col gap-1 border-t py-6 text-[13px]">
          <p>{t.disclaimer}</p>
          <p>
            {dataset.info.isDemo ? t.demoModelNotice : dataset.info.attribution}
          </p>
        </footer>
      }
    >
      <div className="grid items-start gap-12 pt-4 md:grid-cols-[1.15fr_1fr] md:gap-16 md:pt-12">
        <section className="flex flex-col gap-6">
          <h1 className="text-ink font-serif text-[40px] leading-[1.1] font-medium md:text-[48px]">
            {t.home.welcomeTitle}
          </h1>
          <p className="text-graphite max-w-[46ch] text-[17px] leading-relaxed">
            {t.home.welcomeBody}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <ButtonLink href="/explore">{t.home.startExploring}</ButtonLink>
            <ButtonLink href="/quiz" variant="secondary">
              {t.home.startQuiz}
            </ButtonLink>
          </div>
          {dueScope && (
            <Link
              href={`/quiz?scope=${DUE_SCOPE_ID}`}
              className="text-scrub w-fit text-[15px] underline-offset-4 hover:underline"
            >
              {t.home.dueCount(dueScope.structureIds.length)}
            </Link>
          )}
        </section>

        <section aria-labelledby="contents-heading">
          <h2
            id="contents-heading"
            className="text-graphite mb-3 font-serif text-[19px]"
          >
            {t.home.whatToStudy}
          </h2>
          <ul className="divide-rule border-rule divide-y border-y">
            {regions.map(({ region, count }) => (
              <li key={region}>
                <Link
                  href={
                    region === "whole-body"
                      ? "/explore"
                      : `/explore?region=${region}`
                  }
                  className="group flex items-baseline justify-between gap-4 py-3.5"
                >
                  <span className="text-ink group-hover:text-scrub font-serif text-[20px] transition-colors">
                    {t.regions[region]}
                  </span>
                  <span className="text-faint text-[14px] tabular-nums">
                    {t.home.structuresCount(count)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}

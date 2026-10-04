"use client";

import { ArrowLeft, ArrowRight, Box, Brain, Target } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { useMessages } from "@/hooks/useMessages";
import { DUE_SCOPE_ID, useStudyScopes } from "@/hooks/useStudyScopes";
import { useSettingsStore } from "@/store/settingsStore";
import { ANATOMY_REGIONS } from "@/types/anatomy";

const primary =
  "bg-accent text-accent-ink inline-flex h-12 items-center gap-2 rounded-[12px] px-6 font-medium transition-opacity hover:opacity-90";
const secondary =
  "border-line bg-raised hover:border-accent/50 inline-flex h-12 items-center gap-2 rounded-[12px] border px-6 font-medium transition-colors";

export function HomeView() {
  const t = useMessages();
  const { registry, dataset } = useAnatomyData();
  const rtl = useSettingsStore((s) => s.locale === "he");
  const dueScope = useStudyScopes().find((s) => s.id === DUE_SCOPE_ID);
  const Forward = rtl ? ArrowLeft : ArrowRight;

  const regions = ANATOMY_REGIONS.map((region) => ({
    region,
    count:
      region === "whole-body"
        ? registry.structures.length
        : registry.structures.filter((s) => s.region === region).length,
  })).filter(({ count }) => count > 0);

  const features = [
    { icon: Box, ...t.home.features.explore },
    { icon: Target, ...t.home.features.identify },
    { icon: Brain, ...t.home.features.quiz },
  ];

  return (
    <PageShell
      footer={
        <footer className="border-line text-faint flex flex-col gap-1 border-t py-6 text-xs">
          <p>{t.disclaimer}</p>
          {dataset.info.isDemo && <p>{t.demoModelNotice}</p>}
        </footer>
      }
    >
      <section className="flex max-w-2xl flex-col gap-5 pt-4 md:pt-8">
        <p className="text-accent text-sm">{t.tagline}</p>
        <h1 className="text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
          {t.home.welcomeTitle}
        </h1>
        <p className="text-muted text-lg leading-relaxed">
          {t.home.welcomeBody}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/explore" className={primary}>
            {t.home.startExploring}
            <Forward className="size-4" aria-hidden />
          </Link>
          <Link href="/quiz" className={secondary}>
            {t.home.startQuiz}
          </Link>
        </div>
        {dueScope && (
          <Link
            href={`/quiz?scope=${DUE_SCOPE_ID}`}
            className="text-accent text-sm hover:underline"
          >
            {t.home.dueCount(dueScope.structureIds.length)}
          </Link>
        )}
      </section>

      <section aria-labelledby="study-heading" className="flex flex-col gap-4">
        <h2 id="study-heading" className="text-muted text-sm font-medium">
          {t.home.whatToStudy}
        </h2>
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {regions.map(({ region, count }) => (
            <li key={region}>
              <Link
                href={
                  region === "whole-body"
                    ? "/explore"
                    : `/explore?region=${region}`
                }
                className="border-line bg-raised hover:border-accent/50 flex h-full flex-col gap-1 rounded-[12px] border p-4 transition-colors"
              >
                <span className="text-ink font-medium">
                  {t.regions[region]}
                </span>
                <span className="text-muted text-xs">
                  {t.home.structuresCount(count)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-line grid gap-6 border-t pt-10 md:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex flex-col gap-2">
            <Icon className="text-accent size-5" aria-hidden />
            <h3 className="text-ink font-medium">{title}</h3>
            <p className="text-muted text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </section>
    </PageShell>
  );
}

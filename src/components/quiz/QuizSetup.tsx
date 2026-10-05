"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { useMessages } from "@/hooks/useMessages";
import { useStudyScopes } from "@/hooks/useStudyScopes";
import { QUIZ_MODES, type QuizMode } from "@/types/quiz";
import type { QuizConfig } from "@/types/quizConfig";
import { ScopeList } from "./ScopeList";

const LENGTHS = [5, 10, 20] as const;
const DEFAULT_LENGTH = 10;

/** Choose what to practise: a ruled list of scopes, then question type and length. */
export function QuizSetup({
  initialScopeId,
  onStart,
}: {
  initialScopeId?: string;
  onStart: (config: QuizConfig) => void;
}) {
  const t = useMessages();
  const scopes = useStudyScopes();
  const [scopeId, setScopeId] = useState(initialScopeId);
  const [mode, setMode] = useState<QuizMode>("find");
  const [count, setCount] = useState<number>(DEFAULT_LENGTH);
  const scope =
    scopes.find((s) => s.id === scopeId) ??
    scopes.find((s) => s.kind === "all");

  return (
    <form
      className="grid items-start gap-12 md:grid-cols-[1fr_1fr] md:gap-16"
      onSubmit={(event) => {
        event.preventDefault();
        if (scope) onStart({ scope, mode, count });
      }}
    >
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <h1 className="text-ink font-serif text-[40px] leading-tight font-medium">
            {t.quiz.setupTitle}
          </h1>
          <p className="text-graphite max-w-[44ch] text-[16px]">
            {t.quiz.setupIntro}
          </p>
        </header>

        <Segmented
          name="mode"
          legend={t.quiz.mode}
          value={mode}
          onChange={setMode}
          options={QUIZ_MODES.map((m) => ({
            value: m,
            label: t.quiz.modes[m].title,
          }))}
        />
        <p className="text-graphite -mt-3 text-[14px]">
          {t.quiz.modes[mode].body}
        </p>

        <Segmented
          name="length"
          legend={t.quiz.length}
          value={count}
          onChange={setCount}
          options={LENGTHS.map((n) => ({ value: n, label: String(n) }))}
        />

        <div className="pt-2">
          <Button type="submit">{t.quiz.start}</Button>
        </div>
      </div>

      <ScopeList scopes={scopes} selectedId={scope?.id} onSelect={setScopeId} />
    </form>
  );
}

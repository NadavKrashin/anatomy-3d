"use client";

import { clsx } from "clsx";
import { Play } from "lucide-react";
import { useState } from "react";
import { useMessages } from "@/hooks/useMessages";
import { useScopeLabel, useStudyScopes } from "@/hooks/useStudyScopes";
import { QUIZ_MODES, type QuizMode } from "@/types/quiz";
import type { QuizConfig } from "@/types/quizConfig";

const LENGTHS = [5, 10, 20] as const;
const DEFAULT_LENGTH = 10;

const optionClass = (selected: boolean) =>
  clsx(
    "rounded-[12px] border p-3 text-start transition-colors",
    selected
      ? "border-accent bg-accent/10"
      : "border-line bg-raised hover:border-accent/40",
  );

export function QuizSetup({
  initialScopeId,
  onStart,
}: {
  initialScopeId?: string;
  onStart: (config: QuizConfig) => void;
}) {
  const t = useMessages();
  const scopes = useStudyScopes();
  const scopeLabel = useScopeLabel();
  const [scopeId, setScopeId] = useState(initialScopeId);
  const [mode, setMode] = useState<QuizMode>("find");
  const [count, setCount] = useState<number>(DEFAULT_LENGTH);
  const scope =
    scopes.find((s) => s.id === scopeId) ??
    scopes.find((s) => s.kind === "all");

  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (scope) onStart({ scope, mode, count });
      }}
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t.quiz.setupTitle}
        </h1>
        <p className="text-muted">{t.quiz.setupIntro}</p>
      </header>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-muted mb-3 text-sm font-medium">
          {t.quiz.scope}
        </legend>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {scopes.map((s) => (
            <label
              key={s.id}
              className={clsx(
                optionClass(s.id === scope?.id),
                "cursor-pointer",
              )}
            >
              <input
                type="radio"
                name="scope"
                value={s.id}
                checked={s.id === scope?.id}
                onChange={() => setScopeId(s.id)}
                className="sr-only"
              />
              <span className="text-ink block font-medium">
                {scopeLabel(s)}
              </span>
              <span className="text-muted text-xs">
                {t.home.structuresCount(s.structureIds.length)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-muted mb-3 text-sm font-medium">
          {t.quiz.mode}
        </legend>
        <div className="grid gap-2 md:grid-cols-3">
          {QUIZ_MODES.map((m) => (
            <label
              key={m}
              className={clsx(optionClass(m === mode), "cursor-pointer")}
            >
              <input
                type="radio"
                name="mode"
                value={m}
                checked={m === mode}
                onChange={() => setMode(m)}
                className="sr-only"
              />
              <span className="text-ink block font-medium">
                {t.quiz.modes[m].title}
              </span>
              <span className="text-muted text-xs">{t.quiz.modes[m].body}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-muted mb-3 text-sm font-medium">
          {t.quiz.length}
        </legend>
        <div className="flex gap-2">
          {LENGTHS.map((n) => (
            <label
              key={n}
              className={clsx(
                optionClass(n === count),
                "min-w-16 cursor-pointer text-center",
              )}
            >
              <input
                type="radio"
                name="length"
                value={n}
                checked={n === count}
                onChange={() => setCount(n)}
                className="sr-only"
              />
              <span className="text-ink font-medium tabular-nums">{n}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <button
          type="submit"
          className="bg-accent text-accent-ink inline-flex h-12 items-center gap-2 rounded-[12px] px-6 font-medium transition-opacity hover:opacity-90"
        >
          <Play className="size-4" aria-hidden />
          {t.quiz.start}
        </button>
      </div>
    </form>
  );
}

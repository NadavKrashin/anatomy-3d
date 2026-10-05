"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import type { QuizConfig } from "@/types/quizConfig";
import { QuizRunView } from "./QuizRunView";
import { QuizSetup } from "./QuizSetup";

/**
 * /quiz — setup screen, then the quiz in the viewer. `?scope=<id>` preselects
 * a scope (e.g. `due`, `region:upper-limb`). Each run gets a fresh key so
 * restarting remounts with clean state.
 */
export function QuizView() {
  const initialScopeId = useSearchParams().get("scope") ?? undefined;
  const [active, setActive] = useState<{
    config: QuizConfig;
    key: number;
  } | null>(null);

  if (!active) {
    return (
      <PageShell>
        <QuizSetup
          initialScopeId={initialScopeId}
          onStart={(config) => setActive({ config, key: 0 })}
        />
      </PageShell>
    );
  }

  return (
    <QuizRunView
      key={active.key}
      config={active.config}
      onRestart={(config) => setActive({ config, key: active.key + 1 })}
      onExit={() => setActive(null)}
    />
  );
}

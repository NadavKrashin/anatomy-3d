import { useMemo, useState } from "react";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { dueForReview } from "@/lib/progress/progressStats";
import {
  DISTINCTIONS_HEADING,
  SUMMARY_DISTINCTIONS,
} from "@/data/anatomy/z-anatomy/summaryDistinctions";
import summarySections from "@/data/anatomy/z-anatomy/summarySections.json";
import { distinctionStructureIds } from "@/lib/quiz/clues";
import { builtInScopes, summaryScopes } from "@/lib/study/scopes";
import { useProgressStore } from "@/store/progressStore";
import type { StudyScope } from "@/types/study";
import { useMessages } from "./useMessages";

export const DUE_SCOPE_ID = "due";

/**
 * Built-in scopes, a "due for review" scope when anything is due, and the
 * sections of her summary.
 */
export function useStudyScopes(): StudyScope[] {
  const t = useMessages();
  const { registry } = useAnatomyData();
  const progress = useProgressStore((s) => s.data);
  // Captured once per mount: "due" shouldn't flicker while the page is open.
  const [now] = useState(() => Date.now());

  return useMemo(() => {
    const due = dueForReview(
      progress,
      registry.all.map((s) => s.id),
      now,
    );
    const dueScope: StudyScope[] =
      due.length > 0
        ? [
            {
              id: DUE_SCOPE_ID,
              kind: "custom",
              name: t.quiz.dueForReview,
              structureIds: due.map((p) => p.structureId),
            },
          ]
        : [];
    const fromSummary = summaryScopes(registry, summarySections, {
      heading: DISTINCTIONS_HEADING,
      structureIds: distinctionStructureIds(SUMMARY_DISTINCTIONS, registry.all),
    });
    return [...dueScope, ...builtInScopes(registry), ...fromSummary];
  }, [progress, registry, now, t]);
}

/** Display name of a scope in the current UI language. */
export function useScopeLabel() {
  const t = useMessages();
  return (scope: StudyScope): string => {
    switch (scope.kind) {
      case "all":
        return t.quiz.wholeBody;
      case "region":
        return t.regions[scope.region];
      case "system":
        return t.systems[scope.system];
      case "custom":
        return scope.name;
      case "summary":
        // Her own heading, as she wrote it (Hebrew).
        return scope.section;
    }
  };
}

"use client";

import { clsx } from "clsx";
import { useMessages } from "@/hooks/useMessages";
import { useScopeLabel } from "@/hooks/useStudyScopes";
import type { StudyScope } from "@/types/study";

interface ScopeListProps {
  scopes: StudyScope[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  /** Her summary's sections right after the whole body (summary mode). */
  summaryFirst?: boolean;
}

function ScopeOption({
  scope,
  selected,
  onSelect,
}: {
  scope: StudyScope;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useMessages();
  const label = useScopeLabel();
  return (
    <label className="group has-[:focus-visible]:bg-wash relative flex cursor-pointer items-center gap-3 py-3">
      <input
        type="radio"
        name="scope"
        value={scope.id}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        aria-hidden
        className={clsx(
          "size-4 shrink-0 rounded-full transition-all",
          selected
            ? "border-scrub border-[5px]"
            : "border-rule group-hover:border-graphite border-[1.5px]",
        )}
      />
      <span
        className={clsx(
          "font-title flex-1 text-[18px]",
          selected ? "text-ink" : "text-graphite",
        )}
      >
        {label(scope)}
      </span>
      <span className="text-faint text-[13px] tabular-nums">
        {t.home.structuresCount(scope.structureIds.length)}
      </span>
    </label>
  );
}

/**
 * Quiz scopes as ruled radio rows, grouped: general, by region, by system,
 * her summary (second when quizzing from her summary).
 */
export function ScopeList({
  scopes,
  selectedId,
  onSelect,
  summaryFirst = false,
}: ScopeListProps) {
  const t = useMessages();
  const general = {
    title: null,
    items: scopes.filter((s) => s.kind === "all" || s.kind === "custom"),
  };
  const summary = {
    title: t.quiz.fromSummary,
    items: scopes.filter((s) => s.kind === "summary"),
  };
  const byMetadata = [
    {
      title: t.quiz.byRegion,
      items: scopes.filter((s) => s.kind === "region"),
    },
    {
      title: t.quiz.bySystem,
      items: scopes.filter((s) => s.kind === "system"),
    },
  ];
  const groups = [
    general,
    ...(summaryFirst ? [summary, ...byMetadata] : [...byMetadata, summary]),
  ].filter((group) => group.items.length > 0);

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-graphite font-title mb-3 text-[19px]">
        {t.quiz.scope}
      </legend>
      {groups.map((group) => (
        <div key={group.title ?? "general"}>
          {group.title && (
            <p className="text-graphite mb-1 text-[14px]">{group.title}</p>
          )}
          <div className="divide-rule border-rule divide-y border-y">
            {group.items.map((scope) => (
              <ScopeOption
                key={scope.id}
                scope={scope}
                selected={scope.id === selectedId}
                onSelect={() => onSelect(scope.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  );
}

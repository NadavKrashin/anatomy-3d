"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { StructureLabel } from "@/components/anatomy/StructureLabel";
import { useMessages } from "@/hooks/useMessages";
import type { StructureProgress } from "@/types/progress";

interface StructureProgressListProps {
  title: string;
  items: StructureProgress[];
  empty?: string;
  action?: ReactNode;
}

/** Structures with a confidence bar; each opens the structure in the viewer. */
export function StructureProgressList({
  title,
  items,
  empty,
  action,
}: StructureProgressListProps) {
  const t = useMessages();
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-muted text-sm font-medium">{title}</h2>
        {action}
      </div>
      {items.length === 0 ? (
        <p className="text-faint text-sm">{empty}</p>
      ) : (
        <ul className="border-line divide-line divide-y rounded-[12px] border">
          {items.map((item) => {
            const percent = Math.round(item.confidence * 100);
            return (
              <li key={item.structureId}>
                <Link
                  href={`/explore?structure=${item.structureId}`}
                  className="hover:bg-raised flex items-center gap-4 px-4 py-3 transition-colors"
                >
                  <StructureLabel
                    structureId={item.structureId}
                    className="flex-1 text-sm"
                  />
                  <div
                    className="flex w-28 items-center gap-2"
                    title={t.progress.confidence}
                  >
                    <div
                      className="bg-raised h-1.5 flex-1 overflow-hidden rounded-full"
                      dir="ltr"
                    >
                      <div
                        className="bg-accent h-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span
                      className="text-muted w-9 text-end text-xs tabular-nums"
                      dir="ltr"
                    >
                      {percent}%
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

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
        <h2 className="text-ink font-title text-[20px]">{title}</h2>
        {action}
      </div>
      {items.length === 0 ? (
        <p className="text-graphite text-[15px]">{empty}</p>
      ) : (
        <ul className="divide-rule border-rule divide-y border-y">
          {items.map((item) => {
            const percent = Math.round(item.confidence * 100);
            return (
              <li key={item.structureId}>
                <Link
                  href={`/explore?structure=${item.structureId}`}
                  className="group flex items-center gap-4 py-3"
                >
                  <StructureLabel
                    structureId={item.structureId}
                    className="group-hover:[&_bdi]:text-scrub font-title flex-1 text-[17px]"
                  />
                  <div
                    className="flex w-28 items-center gap-2"
                    title={t.progress.confidence}
                  >
                    <div
                      className="bg-rule h-1 flex-1 overflow-hidden rounded-full"
                      dir="ltr"
                    >
                      <div
                        className="bg-scrub h-full rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span
                      className="text-graphite w-10 text-end text-[13px] tabular-nums"
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

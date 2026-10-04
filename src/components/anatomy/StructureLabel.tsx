"use client";

import { clsx } from "clsx";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { useStructureNames } from "@/hooks/useStructureNames";
import type { AnatomicalStructure } from "@/types/anatomy";
import { TermText } from "./TermText";

function Label({
  structure,
  className,
}: {
  structure: AnatomicalStructure;
  className?: string;
}) {
  const { primary, secondary } = useStructureNames(structure);
  return (
    <span className={clsx("inline-flex min-w-0 flex-col", className)}>
      <TermText name={primary} className="text-ink" showVerification={false} />
      {secondary && (
        <TermText
          name={secondary}
          className="text-muted text-[0.85em]"
          showVerification={false}
        />
      )}
    </span>
  );
}

/** A structure's primary name with its secondary-language name underneath. */
export function StructureLabel({
  structureId,
  className,
}: {
  structureId: string;
  className?: string;
}) {
  const { registry } = useAnatomyData();
  const structure = registry.get(structureId);
  return structure ? (
    <Label structure={structure} className={className} />
  ) : null;
}

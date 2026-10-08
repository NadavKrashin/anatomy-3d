"use client";

import { clsx } from "clsx";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { useStructureNames } from "@/hooks/useStructureNames";
import type { AnatomicalStructure } from "@/types/anatomy";
import { TermText } from "./TermText";

function Label({
  structure,
  withSide,
  className,
}: {
  structure: AnatomicalStructure;
  withSide: boolean;
  className?: string;
}) {
  const { primary, secondary } = useStructureNames(structure, withSide);
  return (
    <span className={clsx("inline-flex min-w-0 flex-col", className)}>
      <TermText name={primary} className="text-ink" showVerification={false} />
      {secondary && (
        <TermText
          name={secondary}
          className="text-graphite text-[0.85em]"
          showVerification={false}
        />
      )}
    </span>
  );
}

/**
 * A structure's primary name with its secondary-language name underneath;
 * "Humerus (left)" unless `withSide` is false.
 */
export function StructureLabel({
  structureId,
  withSide = true,
  className,
}: {
  structureId: string;
  withSide?: boolean;
  className?: string;
}) {
  const { registry } = useAnatomyData();
  const structure = registry.get(structureId);
  return structure ? (
    <Label structure={structure} withSide={withSide} className={className} />
  ) : null;
}

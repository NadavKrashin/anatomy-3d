import type {
  AnatomicalStructure,
  AnatomyDataset,
  LocalizedText,
} from "@/types/anatomy";
import { DETAIL_SECTIONS } from "@/types/anatomy";
import { findMeshMapIssues } from "./modelAdapter";
import { createRegistry } from "./registry";

export interface DatasetIssue {
  severity: "error" | "warning";
  structureId?: string;
  message: string;
}

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateStructure(structure: AnatomicalStructure): DatasetIssue[] {
  const issues: DatasetIssue[] = [];
  const error = (message: string) =>
    issues.push({ severity: "error", structureId: structure.id, message });
  const warn = (message: string) =>
    issues.push({ severity: "warning", structureId: structure.id, message });

  if (!KEBAB_CASE.test(structure.id)) error("id must be kebab-case");
  if (structure.names.en.text.trim() === "") error("English name is empty");
  if (!structure.names.he) warn("missing Hebrew name");

  if (structure.side === "left" || structure.side === "right") {
    if (!structure.id.endsWith(`-${structure.side}`))
      error(`id should end with "-${structure.side}"`);
    if (!structure.bilateralGroupId)
      error("paired structure needs a bilateralGroupId");
  }

  const texts: LocalizedText[] = [
    ...(structure.details?.description ? [structure.details.description] : []),
    ...(structure.details?.clinicalNote
      ? [structure.details.clinicalNote]
      : []),
    ...DETAIL_SECTIONS.flatMap((key) => structure.details?.[key] ?? []),
  ];
  if (texts.some((text) => text.en.trim() === ""))
    error("details contain an empty English text");

  return issues;
}

function validateBilateralGroups(
  structures: readonly AnatomicalStructure[],
): DatasetIssue[] {
  const groups = new Map<string, AnatomicalStructure[]>();
  for (const structure of structures) {
    if (!structure.bilateralGroupId) continue;
    groups.set(structure.bilateralGroupId, [
      ...(groups.get(structure.bilateralGroupId) ?? []),
      structure,
    ]);
  }

  const issues: DatasetIssue[] = [];
  for (const [groupId, members] of groups) {
    const [first, ...rest] = members;
    if (!first) continue;
    const consistent = rest.every(
      (m) =>
        m.system === first.system &&
        m.region === first.region &&
        m.names.en.text === first.names.en.text,
    );
    if (!consistent) {
      issues.push({
        severity: "error",
        message: `bilateral group "${groupId}" mixes systems, regions or names`,
      });
    }
    const sides = members.map((m) => m.side);
    if (new Set(sides).size !== sides.length) {
      issues.push({
        severity: "error",
        message: `bilateral group "${groupId}" repeats a side`,
      });
    }
  }
  return issues;
}

/**
 * Data-quality checks for an anatomy dataset. Errors break the app's
 * assumptions; warnings are gaps (e.g. a missing Hebrew name).
 * Used by unit tests and by `npm run anatomy:validate`.
 */
export function validateDataset(dataset: AnatomyDataset): DatasetIssue[] {
  const ids = dataset.structures.map((s) => s.id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length > 0) {
    return [...new Set(duplicates)].map((id) => ({
      severity: "error" as const,
      structureId: id,
      message: "duplicate structure id",
    }));
  }

  const meshIssues = findMeshMapIssues(
    createRegistry(dataset.structures),
    dataset.meshMap,
  );
  return [
    ...dataset.structures.flatMap(validateStructure),
    ...validateBilateralGroups(dataset.structures),
    ...meshIssues.unknownStructureIds.map((id) => ({
      severity: "error" as const,
      structureId: id,
      message: "mesh map points at an unknown structure id",
    })),
    ...meshIssues.unmappedStructureIds.map((id) => ({
      severity: "warning" as const,
      structureId: id,
      message:
        "no mesh maps to this structure (it can't be selected or quizzed)",
    })),
  ];
}

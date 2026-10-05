import type { AnatomySystem } from "@/types/anatomy";

export type StructureVisibility = "visible" | "ghosted" | "hidden";

export interface VisibilityState {
  hiddenStructureIds: ReadonlySet<string>;
  hiddenSystems: ReadonlySet<AnatomySystem>;
  isolatedStructureId: string | null;
}

/**
 * Single source of truth for how a structure is drawn. Isolation wins over
 * hide/system filters so the isolated structure is always visible; everything
 * else is ghosted only if it would otherwise be visible.
 */
export function getStructureVisibility(
  structureId: string,
  system: AnatomySystem,
  state: VisibilityState,
): StructureVisibility {
  if (state.isolatedStructureId === structureId) return "visible";
  const filteredOut =
    state.hiddenStructureIds.has(structureId) ||
    state.hiddenSystems.has(system);
  if (filteredOut) return "hidden";
  return state.isolatedStructureId === null ? "visible" : "ghosted";
}

export function isInteractive(visibility: StructureVisibility): boolean {
  return visibility === "visible";
}

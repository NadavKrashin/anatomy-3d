import type { AnatomyRegistry } from "@/lib/anatomy/registry";
import { ANATOMY_REGIONS } from "@/types/anatomy";
import type { StudyScope } from "@/types/study";

export const WHOLE_BODY_SCOPE_ID = "all";

/**
 * Scopes derived from dataset metadata: whole body, each region, each system.
 * "Other" region/system buckets are left out — they are leftovers, not
 * something a student chooses to study.
 */
export function builtInScopes(registry: AnatomyRegistry): StudyScope[] {
  const ids = (
    predicate: (s: AnatomyRegistry["structures"][number]) => boolean,
  ) => registry.all.filter(predicate).map((s) => s.id);

  const regionScopes = ANATOMY_REGIONS.filter(
    (r) => r !== "whole-body" && r !== "other",
  )
    .map((region): StudyScope => ({
      id: `region:${region}`,
      kind: "region",
      region,
      structureIds: ids((s) => s.region === region),
    }))
    .filter((scope) => scope.structureIds.length > 0);

  const systemScopes = registry
    .presentSystems()
    .filter((system) => system !== "other")
    .map((system): StudyScope => ({
      id: `system:${system}`,
      kind: "system",
      system,
      structureIds: ids((s) => s.system === system),
    }));

  return [
    { id: WHOLE_BODY_SCOPE_ID, kind: "all", structureIds: ids(() => true) },
    ...regionScopes,
    ...systemScopes,
  ];
}

export function findScope(
  scopes: readonly StudyScope[],
  id: string,
): StudyScope | undefined {
  return scopes.find((scope) => scope.id === id);
}

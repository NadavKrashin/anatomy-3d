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

export const DISTINCTIONS_SCOPE_ID = "summary:distinctions";
/** A section of her summary with fewer structures isn't worth a quiz. */
export const MIN_SUMMARY_SCOPE_SIZE = 5;
/** Her "supplement" sections join the section they supplement. */
const SUPPLEMENT = /^השלמות /;

/**
 * Quiz scopes from her summary: her distinctions first (`distinctionIds`,
 * labelled with her heading), then each of her sections (`sections`, in her
 * order) with the structures her notes there are about. "השלמות גפה עליונה"
 * (supplement) joins "גפה עליונה"; a supplement with no section of its own
 * stays a scope.
 */
export function summaryScopes(
  registry: AnatomyRegistry,
  sections: readonly string[],
  distinctions: { heading: string; structureIds: readonly string[] },
): StudyScope[] {
  const scopeOf = (section: string) => {
    const base = section.replace(SUPPLEMENT, "");
    return base !== section && sections.includes(base) ? base : section;
  };
  const members = new Map<string, string[]>();
  for (const s of registry.all) {
    const own = new Set((s.studyNotes ?? []).map((n) => scopeOf(n.section)));
    for (const section of own)
      members.set(section, [...(members.get(section) ?? []), s.id]);
  }
  const sectionScopes = [...new Set(sections.map(scopeOf))]
    .map((section): StudyScope => ({
      id: `summary:${section}`,
      kind: "summary",
      section,
      structureIds: members.get(section) ?? [],
    }))
    .filter((scope) => scope.structureIds.length >= MIN_SUMMARY_SCOPE_SIZE);
  const distinctionScope: StudyScope[] =
    distinctions.structureIds.length > 0
      ? [
          {
            id: DISTINCTIONS_SCOPE_ID,
            kind: "summary",
            section: distinctions.heading,
            structureIds: [...distinctions.structureIds],
          },
        ]
      : [];
  return [...distinctionScope, ...sectionScopes];
}

export function findScope(
  scopes: readonly StudyScope[],
  id: string,
): StudyScope | undefined {
  return scopes.find((scope) => scope.id === id);
}

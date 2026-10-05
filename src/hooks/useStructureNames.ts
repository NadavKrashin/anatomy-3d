import { resolveDisplayNames } from "@/lib/anatomy/names";
import { useSettingsStore } from "@/store/settingsStore";
import type { AnatomicalStructure } from "@/types/anatomy";

export function useStructureNames(structure: AnatomicalStructure) {
  const preference = useSettingsStore((s) => s.termPreference);
  return resolveDisplayNames(structure, preference);
}

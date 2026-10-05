import { useCallback } from "react";
import type { AnatomicalStructure } from "@/types/anatomy";
import { useViewerStore } from "@/store/viewerStore";

/**
 * Bring a structure into view: unhide it (and the whole it is part of) and
 * its system, select it, focus the camera.
 */
export function useRevealStructure() {
  return useCallback((structure: AnatomicalStructure) => {
    const { reveal, select, focus } = useViewerStore.getState();
    if (structure.parentId) reveal(structure.parentId, structure.system);
    reveal(structure.id, structure.system);
    select(structure.id);
    focus(structure.id);
  }, []);
}

import { useCallback } from "react";
import type { AnatomicalStructure } from "@/types/anatomy";
import { useViewerStore } from "@/store/viewerStore";

/** Bring a structure into view: unhide it and its system, select it, focus the camera. */
export function useRevealStructure() {
  return useCallback((structure: AnatomicalStructure) => {
    const { reveal, select, focus } = useViewerStore.getState();
    reveal(structure.id, structure.system);
    select(structure.id);
    focus(structure.id);
  }, []);
}

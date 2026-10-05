import { useCallback } from "react";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { useViewerStore } from "@/store/viewerStore";

/** Show only the given structures and frame them. */
export function useShowScope() {
  const { registry } = useAnatomyData();
  return useCallback(
    (structureIds: readonly string[]) => {
      const { showOnly, resetCamera } = useViewerStore.getState();
      showOnly(
        structureIds,
        registry.structures.map((s) => s.id),
      );
      resetCamera();
    },
    [registry],
  );
}

import { EyeOff, Focus, Layers } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { useMessages } from "@/hooks/useMessages";
import { useViewerStore } from "@/store/viewerStore";

/** Focus / isolate / hide for the selected structure — quiet controls, no boxes. */
export function StructureActions({ structureId }: { structureId: string }) {
  const t = useMessages();
  const isIsolated = useViewerStore(
    (s) => s.isolatedStructureId === structureId,
  );
  const { focus, hide, isolate, exitIsolate } = useViewerStore.getState();

  return (
    <div className="border-rule flex flex-wrap gap-1 border-y px-3 py-1.5">
      <IconButton
        showLabel
        label={t.structure.focus}
        icon={<Focus />}
        onClick={() => focus(structureId)}
      />
      <IconButton
        showLabel
        label={isIsolated ? t.viewer.exitIsolate : t.structure.isolate}
        icon={<Layers />}
        active={isIsolated}
        onClick={() => (isIsolated ? exitIsolate() : isolate(structureId))}
      />
      <IconButton
        showLabel
        label={t.structure.hide}
        icon={<EyeOff />}
        onClick={() => hide(structureId)}
      />
    </div>
  );
}

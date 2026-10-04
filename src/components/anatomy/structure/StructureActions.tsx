import { BookOpen, EyeOff, Focus, Layers } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { useMessages } from "@/hooks/useMessages";
import { useViewerStore } from "@/store/viewerStore";

/** Focus / isolate / hide / study actions for the selected structure. */
export function StructureActions({ structureId }: { structureId: string }) {
  const t = useMessages();
  const isIsolated = useViewerStore(
    (s) => s.isolatedStructureId === structureId,
  );
  const { focus, hide, isolate, exitIsolate } = useViewerStore.getState();

  return (
    <div className="border-line flex flex-wrap gap-1 border-b px-2 py-2">
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
      <IconButton
        showLabel
        label={`${t.structure.studyThis} · ${t.nav.comingSoon}`}
        icon={<BookOpen />}
        disabled
      />
    </div>
  );
}

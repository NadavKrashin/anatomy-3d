import { useEffect } from "react";
import { STRUCTURE_SEARCH_INPUT_ID } from "@/components/anatomy/StructureSearch";
import { useViewerStore } from "@/store/viewerStore";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

/**
 * Viewer keyboard shortcuts. Matched on `event.code` (physical key) rather
 * than `event.key`, so they keep working when the keyboard layout is Hebrew.
 */
export function useViewerShortcuts({
  onToggleHelp,
}: {
  onToggleHelp: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat)
        return;
      if (isTypingTarget(event.target)) return;
      const viewer = useViewerStore.getState();
      const selected = viewer.selectedStructureId;

      switch (event.code) {
        case "Slash":
          event.preventDefault();
          if (event.shiftKey) onToggleHelp();
          else document.getElementById(STRUCTURE_SEARCH_INPUT_ID)?.focus();
          break;
        case "Escape":
          if (viewer.isolatedStructureId && !selected) viewer.exitIsolate();
          else viewer.select(null);
          break;
        case "KeyF":
          if (selected) viewer.focus(selected);
          break;
        case "KeyI":
          if (selected) {
            if (viewer.isolatedStructureId === selected) viewer.exitIsolate();
            else viewer.isolate(selected);
          }
          break;
        case "KeyH":
          if (selected) viewer.hide(selected);
          break;
        case "KeyR":
          viewer.resetCamera();
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onToggleHelp]);
}

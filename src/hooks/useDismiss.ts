import { type RefObject, useEffect } from "react";

/**
 * While `open`, closes on Escape or on a pointer-down outside `rootRef`
 * (popover menus in the top strip).
 */
export function useDismiss(
  open: boolean,
  rootRef: RefObject<HTMLElement | null>,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const onEvent = (event: PointerEvent | KeyboardEvent) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === "Escape"
          : !rootRef.current?.contains(event.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener("pointerdown", onEvent);
    document.addEventListener("keydown", onEvent);
    return () => {
      document.removeEventListener("pointerdown", onEvent);
      document.removeEventListener("keydown", onEvent);
    };
  }, [open, rootRef, close]);
}

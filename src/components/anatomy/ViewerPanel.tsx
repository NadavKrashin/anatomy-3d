import type { ReactNode } from "react";
import { VIEWER_OBSTRUCTION_ATTRIBUTE } from "@/lib/anatomy/viewerDom";

/**
 * Floating sheet over the viewer: a side panel on tablet/desktop, a bottom
 * sheet on phones. Marked as a viewer obstruction so camera focus frames
 * structures in the area it leaves uncovered.
 */
export function ViewerPanel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <aside
      {...{ [VIEWER_OBSTRUCTION_ATTRIBUTE]: "" }}
      aria-label={label}
      className="sheet absolute inset-x-2 bottom-2 z-20 flex max-h-[50dvh] flex-col md:inset-x-auto md:end-5 md:top-[76px] md:bottom-auto md:max-h-[calc(100dvh-7.5rem)] md:w-[368px]"
    >
      {children}
    </aside>
  );
}

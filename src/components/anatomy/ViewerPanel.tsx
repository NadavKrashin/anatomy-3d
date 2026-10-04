import type { ReactNode } from "react";
import { VIEWER_OBSTRUCTION_ATTRIBUTE } from "@/lib/anatomy/viewerDom";

/**
 * Floating panel over the viewer: a side card on tablet/desktop, a bottom
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
      className="panel absolute inset-x-2 bottom-2 z-20 flex max-h-[48dvh] flex-col md:inset-x-auto md:end-4 md:top-20 md:bottom-auto md:max-h-[calc(100dvh-7rem)] md:w-[360px]"
    >
      {children}
    </aside>
  );
}

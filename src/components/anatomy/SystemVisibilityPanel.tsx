"use client";

import { clsx } from "clsx";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { useMessages } from "@/hooks/useMessages";
import { useViewerStore } from "@/store/viewerStore";
import { SYSTEM_COLORS } from "./systemColors";

/**
 * The plate's colour legend. Each entry explains a tissue colour and toggles
 * that system's visibility; hidden entries fade and lose their swatch fill.
 */
export function SystemVisibilityPanel({ className }: { className?: string }) {
  const t = useMessages();
  const { registry } = useAnatomyData();
  const hiddenSystems = useViewerStore((s) => s.hiddenSystems);
  const toggleSystem = useViewerStore((s) => s.toggleSystem);

  return (
    <nav aria-label={t.viewer.systems} className={clsx("w-52", className)}>
      <h2 className="text-graphite mb-2 px-3 font-serif text-[15px]">
        {t.viewer.legend}
      </h2>
      <ul>
        {registry.presentSystems().map((system) => {
          const visible = !hiddenSystems.has(system);
          const color = SYSTEM_COLORS[system];
          return (
            <li key={system}>
              <button
                type="button"
                role="switch"
                aria-checked={visible}
                onClick={() => toggleSystem(system)}
                className="hover:bg-sheet/70 flex h-10 w-full items-center gap-3 rounded-full px-3 text-start transition-colors"
              >
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full transition-colors"
                  // The hairline keeps pale swatches (bone) visible on the pale plate.
                  style={
                    visible
                      ? {
                          backgroundColor: color,
                          boxShadow: "inset 0 0 0 1px rgb(24 34 45 / 0.18)",
                        }
                      : { boxShadow: `inset 0 0 0 1.5px ${color}` }
                  }
                />
                <span
                  className={clsx(
                    "flex-1 text-[15px] transition-colors",
                    visible
                      ? "text-ink"
                      : "text-faint line-through decoration-1",
                  )}
                >
                  {t.systems[system]}
                </span>
                <span className="text-faint text-[13px] tabular-nums">
                  {registry.bySystem(system).length}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

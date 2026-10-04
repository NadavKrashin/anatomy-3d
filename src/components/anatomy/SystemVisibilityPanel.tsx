"use client";

import { clsx } from "clsx";
import { Check } from "lucide-react";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import { useMessages } from "@/hooks/useMessages";
import { useViewerStore } from "@/store/viewerStore";
import { SYSTEM_COLORS } from "./systemColors";

export function SystemVisibilityPanel({ className }: { className?: string }) {
  const t = useMessages();
  const { registry } = useAnatomyData();
  const hiddenSystems = useViewerStore((s) => s.hiddenSystems);
  const toggleSystem = useViewerStore((s) => s.toggleSystem);

  return (
    <nav
      aria-label={t.viewer.systems}
      className={clsx("panel w-56 p-2", className)}
    >
      <h2 className="text-muted px-2 pt-1 pb-2 text-[11px] font-semibold tracking-[0.08em] uppercase">
        {t.viewer.systems}
      </h2>
      <ul className="flex flex-col">
        {registry.presentSystems().map((system) => {
          const visible = !hiddenSystems.has(system);
          return (
            <li key={system}>
              <button
                type="button"
                role="switch"
                aria-checked={visible}
                onClick={() => toggleSystem(system)}
                className="hover:bg-raised flex h-10 w-full items-center gap-3 rounded-[9px] px-2 text-start text-sm transition-colors"
              >
                <span
                  aria-hidden
                  className={clsx(
                    "flex size-[18px] items-center justify-center rounded-[5px] border transition-colors",
                    visible
                      ? "border-transparent"
                      : "border-line bg-transparent",
                  )}
                  style={
                    visible
                      ? { backgroundColor: SYSTEM_COLORS[system] }
                      : undefined
                  }
                >
                  {visible && (
                    <Check className="size-3 text-black/70" strokeWidth={3} />
                  )}
                </span>
                <span
                  className={clsx(
                    "flex-1",
                    visible ? "text-ink" : "text-faint",
                  )}
                >
                  {t.systems[system]}
                </span>
                <span className="text-faint text-xs tabular-nums">
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

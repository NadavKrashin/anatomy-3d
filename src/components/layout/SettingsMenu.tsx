"use client";

import { Settings2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { useDismiss } from "@/hooks/useDismiss";
import { useMessages } from "@/hooks/useMessages";
import { SettingsFields } from "./SettingsFields";

export function SettingsMenu() {
  const t = useMessages();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useDismiss(
    open,
    rootRef,
    useCallback(() => setOpen(false), []),
  );

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        label={t.viewer.settings}
        icon={<Settings2 />}
        active={open}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <div className="sheet absolute end-0 top-12 z-40 flex w-64 flex-col gap-4 p-5 shadow-[var(--shadow-pop)]">
          <SettingsFields />
        </div>
      )}
    </div>
  );
}

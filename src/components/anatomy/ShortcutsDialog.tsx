"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { Kbd } from "@/components/ui/Kbd";
import { useMessages } from "@/hooks/useMessages";

export function ShortcutsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useMessages();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const rows: [string, string][] = [
    ["/", t.shortcuts.search],
    ["Esc", t.shortcuts.escape],
    ["F", t.shortcuts.focus],
    ["I", t.shortcuts.isolate],
    ["H", t.shortcuts.hide],
    ["R", t.shortcuts.reset],
    ["Q", t.shortcuts.quiz],
    ["?", t.shortcuts.help],
  ];

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      className="panel text-ink m-auto w-[min(92vw,360px)] p-0 backdrop:bg-black/50"
    >
      <div className="border-line flex items-center justify-between border-b px-4 py-2">
        <h2 className="text-sm font-semibold">{t.viewer.shortcuts}</h2>
        <IconButton
          label={t.viewer.close}
          icon={<X />}
          onClick={onClose}
          className="-me-2"
        />
      </div>
      <ul className="flex flex-col gap-2 p-4 text-sm">
        {rows.map(([key, label]) => (
          <li key={key} className="flex items-center justify-between gap-4">
            <span className="text-muted">{label}</span>
            <Kbd>{key}</Kbd>
          </li>
        ))}
      </ul>
    </dialog>
  );
}

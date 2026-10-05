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
    ["P", t.shortcuts.peel],
    ["⇧P", t.shortcuts.restore],
    ["Q", t.shortcuts.quiz],
    ["?", t.shortcuts.help],
  ];

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      className="sheet text-ink m-auto w-[min(92vw,360px)] p-0 shadow-[var(--shadow-pop)] backdrop:bg-[#18222d]/30"
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-1">
        <h2 className="font-serif text-[19px]">{t.viewer.shortcuts}</h2>
        <IconButton
          label={t.viewer.close}
          icon={<X />}
          onClick={onClose}
          className="-me-2"
        />
      </div>
      <ul className="divide-rule flex flex-col divide-y px-5 pb-4 text-[14px]">
        {rows.map(([key, label]) => (
          <li
            key={key}
            className="flex items-center justify-between gap-4 py-2"
          >
            <span className="text-graphite">{label}</span>
            <Kbd>{key}</Kbd>
          </li>
        ))}
      </ul>
    </dialog>
  );
}

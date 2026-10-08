"use client";

import { clsx } from "clsx";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { useDismiss } from "@/hooks/useDismiss";
import { useMessages } from "@/hooks/useMessages";
import { MainNav } from "./MainNav";

/**
 * The page links behind a menu button, for screens too narrow for the text
 * links in the top strip (phones). `className` hides it where MainNav shows.
 */
export function NavMenu({ className }: { className?: string }) {
  const t = useMessages();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, rootRef, close);

  // Close once a link has taken us to another page.
  const pathname = usePathname();
  const [openedOn, setOpenedOn] = useState(pathname);
  if (openedOn !== pathname) {
    setOpenedOn(pathname);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <IconButton
        label={t.nav.menu}
        icon={<Menu />}
        active={open}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <div className="sheet absolute end-0 top-12 z-40 w-48 px-5 py-2 shadow-[var(--shadow-pop)]">
          <MainNav orientation="vertical" />
        </div>
      )}
    </div>
  );
}

"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMessages } from "@/hooks/useMessages";

export function MainNav({ className }: { className?: string }) {
  const t = useMessages();
  const pathname = usePathname();
  const item = "rounded-[9px] px-3 py-2 text-sm transition-colors";

  return (
    <nav className={clsx("flex items-center gap-1", className)}>
      <Link
        href="/explore"
        aria-current={pathname === "/explore" ? "page" : undefined}
        className={clsx(
          item,
          pathname === "/explore"
            ? "bg-raised text-ink"
            : "text-muted hover:text-ink",
        )}
      >
        {t.nav.explore}
      </Link>
      {[t.nav.quiz, t.nav.progress].map((label) => (
        <span
          key={label}
          aria-disabled
          className={clsx(item, "text-faint cursor-not-allowed")}
          title={t.nav.comingSoon}
        >
          {label}
          <span className="text-faint/80 ms-1.5 text-[10px]">
            {t.nav.comingSoon}
          </span>
        </span>
      ))}
    </nav>
  );
}

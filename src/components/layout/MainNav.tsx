"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMessages } from "@/hooks/useMessages";

export function MainNav({ className }: { className?: string }) {
  const t = useMessages();
  const pathname = usePathname();
  const items = [
    { href: "/explore", label: t.nav.explore },
    { href: "/quiz", label: t.nav.quiz },
    { href: "/progress", label: t.nav.progress },
  ] as const;

  return (
    <nav className={clsx("flex items-center gap-1", className)}>
      {items.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "rounded-[9px] px-3 py-2 text-sm transition-colors",
              active ? "bg-raised text-ink" : "text-muted hover:text-ink",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMessages } from "@/hooks/useMessages";

/** Text links; the current page is marked with a short teal rule beneath it. */
export function MainNav({ className }: { className?: string }) {
  const t = useMessages();
  const pathname = usePathname();
  const items = [
    { href: "/explore", label: t.nav.explore },
    { href: "/quiz", label: t.nav.quiz },
    { href: "/progress", label: t.nav.progress },
  ] as const;

  return (
    <nav className={clsx("flex items-center gap-5", className)}>
      {items.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "relative py-2 text-[15px] transition-colors",
              active
                ? "text-ink after:bg-scrub after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full"
                : "text-graphite hover:text-ink",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

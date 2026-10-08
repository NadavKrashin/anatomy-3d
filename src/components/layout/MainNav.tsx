"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMessages } from "@/hooks/useMessages";

/**
 * Text links; the current page is marked with a short teal rule beneath it
 * (in a row in the top strip) or a teal colour (stacked, in the phone menu).
 */
export function MainNav({
  className,
  orientation = "horizontal",
}: {
  className?: string;
  orientation?: "horizontal" | "vertical";
}) {
  const vertical = orientation === "vertical";
  const t = useMessages();
  const pathname = usePathname();
  const items = [
    { href: "/explore", label: t.nav.explore },
    { href: "/quiz", label: t.nav.quiz },
    { href: "/progress", label: t.nav.progress },
  ] as const;

  return (
    <nav
      className={clsx(
        "flex",
        vertical ? "divide-rule flex-col divide-y" : "items-center gap-5",
        className,
      )}
    >
      {items.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "relative text-[15px] transition-colors",
              vertical ? "flex min-h-11 items-center" : "py-2",
              active && vertical && "text-scrub font-medium",
              active &&
                !vertical &&
                "text-ink after:bg-scrub after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full",
              !active && "text-graphite hover:text-ink",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

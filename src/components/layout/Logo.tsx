"use client";

import Image from "next/image";
import Link from "next/link";
import { useMessages } from "@/hooks/useMessages";

/**
 * Serif wordmark, in the interface language. `compact` (the viewer's crowded
 * top strip) shows the app icon instead on phones.
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  const t = useMessages();
  return (
    <Link
      href="/"
      aria-label={t.appName}
      className="text-ink flex shrink-0 items-center font-serif text-[22px] leading-none font-medium"
    >
      {compact && (
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={40}
          height={40}
          className="size-10 rounded-[11px] sm:hidden"
        />
      )}
      <span aria-hidden className={compact ? "max-sm:hidden" : undefined}>
        {t.appName}
      </span>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { useMessages } from "@/hooks/useMessages";

/** Serif wordmark, in the interface language. */
export function Logo() {
  const t = useMessages();
  return (
    <Link
      href="/"
      className="text-ink shrink-0 font-serif text-[22px] leading-none font-medium"
    >
      {t.appName}
    </Link>
  );
}

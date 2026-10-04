import { clsx } from "clsx";
import type { ResolvedName } from "@/lib/anatomy/names";
import { useMessages } from "@/hooks/useMessages";

/**
 * Renders an anatomical name in its own language and direction, so English
 * terms inside Hebrew UI (and vice versa) never get their punctuation
 * reordered by the bidi algorithm.
 */
export function TermText({
  name,
  className,
}: {
  name: ResolvedName;
  className?: string;
}) {
  const t = useMessages();
  const showUnverified = !name.verified && name.language !== "en";
  return (
    <span
      className={clsx(
        "inline-flex flex-wrap items-baseline gap-x-2",
        className,
      )}
    >
      <bdi lang={name.language} dir={name.language === "he" ? "rtl" : "ltr"}>
        {name.text}
      </bdi>
      {showUnverified && (
        <span
          title={t.structure.unverifiedHint}
          className="border-warn/30 text-warn/90 rounded-full border px-1.5 text-[10px] leading-4 font-medium tracking-wide"
        >
          {t.structure.unverified}
        </span>
      )}
    </span>
  );
}

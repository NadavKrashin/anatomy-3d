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
  showVerification = true,
}: {
  name: ResolvedName;
  className?: string;
  /** Lists (quiz options, progress rows) hide the badge to reduce noise. */
  showVerification?: boolean;
}) {
  const t = useMessages();
  const showUnverified =
    showVerification && !name.verified && name.language !== "en";
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
          className="text-caution bg-caution/10 rounded-full px-2 font-sans text-[11px] leading-[18px] font-normal"
        >
          {t.structure.unverified}
        </span>
      )}
    </span>
  );
}

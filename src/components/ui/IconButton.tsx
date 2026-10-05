import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  /** Show the label next to the icon instead of only as a tooltip. */
  showLabel?: boolean;
  active?: boolean;
}

/**
 * Quiet control: no box at rest, a soft wash on hover, teal when active.
 * Fully rounded so it reads as a control, not a tile.
 */
export function IconButton({
  label,
  icon,
  showLabel = false,
  active = false,
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={showLabel ? undefined : label}
      title={label}
      aria-pressed={active || undefined}
      className={clsx(
        "inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-full text-[14px] transition-colors duration-150",
        "disabled:pointer-events-none disabled:opacity-40",
        showLabel && "ps-3 pe-4",
        active
          ? "bg-scrub-soft text-scrub"
          : "text-graphite hover:bg-wash hover:text-ink",
        className,
      )}
      {...rest}
    >
      <span aria-hidden className="[&>svg]:size-[18px] [&>svg]:stroke-[1.75]">
        {icon}
      </span>
      {showLabel && <span>{label}</span>}
    </button>
  );
}

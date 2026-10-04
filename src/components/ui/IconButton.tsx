import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  /** Show the label next to the icon instead of only as a tooltip. */
  showLabel?: boolean;
  active?: boolean;
}

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
        "text-ink inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-[10px] text-sm transition-colors duration-150",
        "hover:bg-raised disabled:pointer-events-none disabled:opacity-40",
        showLabel && "px-3",
        active && "bg-accent/15 text-accent",
        className,
      )}
      {...rest}
    >
      <span aria-hidden className="[&>svg]:size-[18px]">
        {icon}
      </span>
      {showLabel && <span>{label}</span>}
    </button>
  );
}

import { clsx } from "clsx";
import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

type Variant = "primary" | "secondary" | "quiet";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-scrub text-white hover:bg-[#086660]",
  secondary:
    "bg-sheet text-ink shadow-[inset_0_0_0_1px_var(--color-rule)] hover:bg-wash",
  quiet: "text-graphite hover:text-ink hover:bg-wash",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-6 text-[15px]",
  sm: "h-10 px-5 text-[14px]",
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
}

export function buttonClass(
  { variant = "primary", size = "md" }: StyleProps = {},
  className?: string,
) {
  return clsx(base, variants[variant], sizes[size], className);
}

export function Button({
  variant,
  size,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & StyleProps) {
  return (
    <button
      type="button"
      className={buttonClass({ variant, size }, className)}
      {...rest}
    />
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  ...rest
}: ComponentProps<typeof Link> & StyleProps) {
  return (
    <Link className={buttonClass({ variant, size }, className)} {...rest} />
  );
}

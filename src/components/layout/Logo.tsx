import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="text-ink flex shrink-0 items-center gap-2 text-sm font-semibold tracking-[0.22em]"
      dir="ltr"
    >
      <span
        aria-hidden
        className="bg-accent size-2.5 rounded-full shadow-[0_0_12px_var(--color-accent)]"
      />
      ANATOMY
    </Link>
  );
}

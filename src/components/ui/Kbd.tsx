import type { ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      dir="ltr"
      className="bg-wash text-graphite inline-flex min-w-6 items-center justify-center rounded-md px-1.5 py-0.5 font-sans text-[12px] shadow-[inset_0_-1px_0_var(--color-rule)]"
    >
      {children}
    </kbd>
  );
}

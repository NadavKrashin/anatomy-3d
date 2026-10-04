import type { ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      dir="ltr"
      className="border-line bg-raised text-muted inline-flex min-w-6 items-center justify-center rounded-md border px-1.5 py-0.5 font-sans text-xs"
    >
      {children}
    </kbd>
  );
}

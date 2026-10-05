import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";

/** Centred reading column with the top strip, for home / quiz setup / progress. */
export function PageShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 md:px-10">
      <PageHeader />
      <main className="flex flex-1 flex-col gap-12 py-8 md:py-10">
        {children}
      </main>
      {footer}
    </div>
  );
}

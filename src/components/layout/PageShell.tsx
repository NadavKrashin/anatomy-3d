import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";

/** Centered column layout with the top bar, for home / quiz setup / progress. */
export function PageShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 md:px-8">
      <PageHeader />
      <main className="flex flex-1 flex-col gap-10 py-8 md:py-12">
        {children}
      </main>
      {footer}
    </div>
  );
}

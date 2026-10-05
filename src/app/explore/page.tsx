import type { Metadata } from "next";
import { Suspense } from "react";
import { ExploreView } from "@/components/anatomy/ExploreView";

export const metadata: Metadata = { title: "Explore · Anatomy" };

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreView />
    </Suspense>
  );
}

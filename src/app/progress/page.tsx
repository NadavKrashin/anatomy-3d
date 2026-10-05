import type { Metadata } from "next";
import { ProgressView } from "@/components/progress/ProgressView";

export const metadata: Metadata = { title: "Progress · Anatomy" };

export default function ProgressPage() {
  return <ProgressView />;
}

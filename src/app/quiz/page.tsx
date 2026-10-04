import type { Metadata } from "next";
import { Suspense } from "react";
import { QuizView } from "@/components/quiz/QuizView";

export const metadata: Metadata = { title: "Quiz · Anatomy" };

export default function QuizPage() {
  return (
    <Suspense>
      <QuizView />
    </Suspense>
  );
}

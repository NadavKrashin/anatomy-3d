"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { ViewerFrame } from "@/components/anatomy/ViewerFrame";
import { useMessages } from "@/hooks/useMessages";
import { useQuizRun } from "@/hooks/useQuizRun";
import { useQuizShortcuts } from "@/hooks/useQuizShortcuts";
import { useQuizStore } from "@/store/quizStore";
import type { QuizConfig } from "@/types/quizConfig";
import { QuizProgressBar } from "./QuizProgressBar";
import { QuizQuestionPanel } from "./QuizQuestionPanel";
import { QuizSummary } from "./QuizSummary";

interface QuizRunViewProps {
  config: QuizConfig;
  onRestart: (config: QuizConfig) => void;
  onExit: () => void;
}

/** A quiz in progress, played inside the 3D viewer. */
export function QuizRunView({ config, onRestart, onExit }: QuizRunViewProps) {
  const t = useMessages();
  const router = useRouter();
  const complete = useQuizStore((s) => s.run?.phase === "complete");

  useQuizRun(config);
  useQuizShortcuts({
    onExitToExplore: useCallback(() => router.push("/explore"), [router]),
  });

  return (
    <ViewerFrame center={<QuizProgressBar onExit={onExit} />}>
      {complete ? (
        <QuizSummary
          onQuizAgain={() => onRestart(config)}
          onReviewMistakes={(structureIds) =>
            onRestart({
              ...config,
              count: structureIds.length,
              scope: {
                id: `review:${Date.now()}`,
                kind: "custom",
                name: t.quiz.reviewMistakes,
                structureIds,
              },
            })
          }
        />
      ) : (
        <QuizQuestionPanel />
      )}
    </ViewerFrame>
  );
}

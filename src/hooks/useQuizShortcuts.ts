import { useEffect } from "react";
import { currentQuestion } from "@/lib/quiz/quizEngine";
import { useQuizStore } from "@/store/quizStore";
import { useViewerStore } from "@/store/viewerStore";
import { isTypingTarget } from "./isTypingTarget";

const DIGITS = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6"];

/**
 * Quiz keys (physical codes, so a Hebrew layout works): 1–6 answer
 * multiple-choice questions, Enter moves on after an answer, R resets the camera, P toggles
 * peel mode, ⇧P restores the last peeled structure, Q exits.
 */
export function useQuizShortcuts({
  onExitToExplore,
}: {
  onExitToExplore: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.repeat ||
        isTypingTarget(event.target)
      )
        return;
      const { run, dispatch } = useQuizStore.getState();
      const question = run ? currentQuestion(run) : undefined;
      const now = Date.now();

      const digit = DIGITS.indexOf(event.code);
      if (
        digit >= 0 &&
        run?.phase === "answering" &&
        question &&
        question.type !== "find"
      ) {
        const optionId = question.optionIds[digit];
        if (optionId) dispatch({ type: "answer", structureId: optionId, now });
        return;
      }
      switch (event.code) {
        case "Enter":
          // Let a focused button handle Enter itself.
          if (
            run?.phase === "answered" &&
            !(event.target instanceof HTMLButtonElement)
          )
            dispatch({ type: "next", now });
          break;
        case "KeyR":
          useViewerStore.getState().resetCamera();
          break;
        case "KeyP":
          if (event.shiftKey) useViewerStore.getState().restoreLayer();
          else {
            const viewer = useViewerStore.getState();
            viewer.setPeelMode(!viewer.peelMode);
          }
          break;
        case "KeyQ":
          onExitToExplore();
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onExitToExplore]);
}

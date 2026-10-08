import { useEffect } from "react";
import { useAnatomyData } from "@/components/providers/AnatomyDataProvider";
import type { AnatomyRegistry } from "@/lib/anatomy/registry";
import { SUMMARY_DISTINCTIONS } from "@/data/anatomy/z-anatomy/summaryDistinctions";
import {
  distinctionClues,
  summaryClues,
  type QuizClue,
} from "@/lib/quiz/clues";
import { eligibleStructures } from "@/lib/quiz/eligibility";
import { generateQuiz } from "@/lib/quiz/questionGenerator";
import {
  currentQuestion,
  startQuiz,
  type QuizRun,
} from "@/lib/quiz/quizEngine";
import { systemsToHideFor } from "@/lib/quiz/questionView";
import { createRng } from "@/lib/quiz/random";
import { useProgressStore } from "@/store/progressStore";
import { useQuizStore } from "@/store/quizStore";
import { useSceneIndexStore } from "@/store/sceneIndexStore";
import { useViewerStore } from "@/store/viewerStore";
import { DISTINCTIONS_SCOPE_ID } from "@/lib/study/scopes";
import { DETAIL_TAG } from "@/types/anatomy";
import type { QuizConfig } from "@/types/quizConfig";

/** Pause after a correct answer before moving on (§18 "short delay"). */
export const AUTO_ADVANCE_MS = 1100;

/**
 * Identify questions, answered clue questions (which then show where the
 * structure is) and revealed answers focus the camera on a structure.
 */
function cameraWasMoved(run: QuizRun): boolean {
  const type = currentQuestion(run)?.type;
  return (
    type === "identify" ||
    type === "describe" ||
    run.feedback?.kind === "revealed"
  );
}

/**
 * Her descriptions to quiz from: her distinctions only in their own scope,
 * else her notes and her distinctions.
 */
function cluesFor(
  config: QuizConfig,
  registry: AnatomyRegistry,
): Map<string, QuizClue[]> {
  const distinctions = distinctionClues(SUMMARY_DISTINCTIONS, registry.all);
  if (config.scope.id === DISTINCTIONS_SCOPE_ID) return distinctions;
  const clues = summaryClues(registry.all);
  for (const [id, list] of distinctions)
    clues.set(id, [...(clues.get(id) ?? []), ...list]);
  return clues;
}

/** Viewer state each quiz moment needs: what's highlighted, what's clickable, where the camera is. */
function syncViewer(
  run: QuizRun,
  previous: QuizRun | null,
  registry: AnatomyRegistry,
) {
  const viewer = useViewerStore.getState();
  const question = currentQuestion(run);
  const questionChanged =
    run.index !== previous?.index || previous.phase === "complete";

  if (run.phase === "complete") {
    viewer.restoreAllLayers();
    viewer.setPickParts(false);
    viewer.setPeelMode(false);
    viewer.setSelectionLocked(false);
    viewer.select(null);
    viewer.setHiddenSystems([]);
    viewer.resetCamera();
    return;
  }
  if (!question) return;

  if (run.phase === "answering" && questionChanged) {
    const target = registry.get(question.structureId);
    // Structures peeled for the previous question would give this one away.
    viewer.restoreAllLayers();
    viewer.setPeelMode(false);
    viewer.setHiddenSystems(target ? systemsToHideFor(target) : []);
    // "Find the left ventricle" needs clicks to pick parts; "find the heart" wholes.
    viewer.setPickParts(Boolean(target?.parentId));
    if (question.type === "identify") {
      // Highlight the structure to identify and keep clicks from moving it.
      // (It is visible: the quiz shows exactly its scope, which contains it.)
      viewer.setSelectionLocked(true);
      viewer.select(question.structureId);
      viewer.focus(question.structureId);
    } else if (question.type === "describe") {
      // Answered from her clue alone: nothing highlighted, and clicks
      // mustn't name structures (the label would give the answer away).
      viewer.setSelectionLocked(true);
      viewer.select(null);
      if (previous && cameraWasMoved(previous)) viewer.resetCamera();
    } else {
      viewer.setSelectionLocked(false);
      viewer.select(null);
      // The previous question zoomed onto a structure; return to the scope
      // overview so the student searches from the whole view.
      if (previous && cameraWasMoved(previous)) viewer.resetCamera();
    }
  }

  if (run.phase === "answered") {
    viewer.setPeelMode(false);
    viewer.setSelectionLocked(true);
    if (run.feedback?.kind === "revealed" || question.type === "describe") {
      // Show where the answer is (it may have been peeled away; x-ray).
      viewer.restoreAllLayers();
      viewer.select(question.structureId);
      viewer.focus(question.structureId);
    }
  }
}

/**
 * Runs a quiz inside the 3D viewer: generates questions once the model is
 * loaded, turns clicks into answers, drives highlighting/camera per question,
 * auto-advances after correct answers and records the finished session.
 */
export function useQuizRun(config: QuizConfig) {
  const { registry } = useAnatomyData();

  // Start once every model file is indexed (only selectable structures are asked).
  useEffect(() => {
    const begin = (index: ReadonlyMap<string, unknown>) => {
      if (useQuizStore.getState().run) return;
      const selectable = new Set(index.keys());
      const now = Date.now();
      const questions = generateQuiz({
        structures: eligibleStructures(config.scope, registry, selectable),
        // Wrong options come from core structures only, never tiny branches.
        distractorPool: registry.all.filter(
          (s) => selectable.has(s.id) && !s.tags.includes(DETAIL_TAG),
        ),
        mode: config.mode,
        count: config.count,
        rng: createRng(now),
        clues:
          config.mode === "summary" ? cluesFor(config, registry) : undefined,
      });
      const viewer = useViewerStore.getState();
      viewer.showOnly(
        config.scope.structureIds,
        registry.structures.map((s) => s.id),
      );
      viewer.resetCamera();
      useQuizStore.getState().begin(
        startQuiz({
          id: crypto.randomUUID(),
          scopeId: config.scope.id,
          mode: config.mode,
          questions,
          now,
        }),
      );
    };

    // Every model file must be in, or structures still loading couldn't be asked.
    const { complete, objectsByStructure } = useSceneIndexStore.getState();
    if (complete && objectsByStructure) begin(objectsByStructure);
    const unsubscribe = useSceneIndexStore.subscribe((state) => {
      if (state.complete && state.objectsByStructure)
        begin(state.objectsByStructure);
    });
    return () => {
      unsubscribe();
      useQuizStore.getState().clear();
      useViewerStore.getState().reset();
    };
  }, [config, registry]);

  // Quiz state → viewer state, auto-advance, and persistence on completion.
  useEffect(() => {
    let advanceTimer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useQuizStore.subscribe((state, previous) => {
      const run = state.run;
      if (!run || run === previous.run) return;
      syncViewer(run, previous.run, registry);

      clearTimeout(advanceTimer);
      if (run.phase === "answered" && run.feedback?.kind === "correct") {
        advanceTimer = setTimeout(
          () =>
            useQuizStore.getState().dispatch({ type: "next", now: Date.now() }),
          AUTO_ADVANCE_MS,
        );
      }
      if (run.phase === "complete" && previous.run?.phase !== "complete") {
        void useProgressStore.getState().recordSession(run.session);
      }
    });
    return () => {
      clearTimeout(advanceTimer);
      unsubscribe();
    };
  }, [registry]);

  // A click on the model (selection change) answers a find question.
  useEffect(
    () =>
      useViewerStore.subscribe((state, previous) => {
        const clicked = state.selectedStructureId;
        if (!clicked || clicked === previous.selectedStructureId) return;
        const run = useQuizStore.getState().run;
        if (run?.phase !== "answering" || currentQuestion(run)?.type !== "find")
          return;
        useQuizStore
          .getState()
          .dispatch({ type: "answer", structureId: clicked, now: Date.now() });
      }),
    [],
  );
}

import { create } from "zustand";
import type { AnatomySystem } from "@/types/anatomy";

/**
 * Camera commands are events, not state: the nonce makes repeated requests
 * for the same structure (e.g. pressing F twice) observable.
 */
export type CameraCommand =
  | { type: "focus"; structureId: string; nonce: number }
  | { type: "reset"; nonce: number };

interface ViewerState {
  selectedStructureId: string | null;
  hoveredStructureId: string | null;
  hiddenStructureIds: ReadonlySet<string>;
  hiddenSystems: ReadonlySet<AnatomySystem>;
  isolatedStructureId: string | null;
  cameraCommand: CameraCommand | null;

  select: (structureId: string | null) => void;
  hover: (structureId: string | null) => void;
  hide: (structureId: string) => void;
  hideMany: (structureIds: Iterable<string>) => void;
  showAll: () => void;
  isolate: (structureId: string) => void;
  exitIsolate: () => void;
  toggleSystem: (system: AnatomySystem) => void;
  /** Make a structure visible regardless of hide/system/isolate filters. */
  reveal: (structureId: string, system: AnatomySystem) => void;
  focus: (structureId: string) => void;
  resetCamera: () => void;
}

let nonce = 0;

const without = <T>(set: ReadonlySet<T>, value: T): Set<T> => {
  const next = new Set(set);
  next.delete(value);
  return next;
};

export const useViewerStore = create<ViewerState>()((set) => ({
  selectedStructureId: null,
  hoveredStructureId: null,
  hiddenStructureIds: new Set(),
  hiddenSystems: new Set(),
  isolatedStructureId: null,
  cameraCommand: null,

  select: (selectedStructureId) => set({ selectedStructureId }),
  hover: (hoveredStructureId) => set({ hoveredStructureId }),

  hide: (structureId) =>
    set((state) => ({
      hiddenStructureIds: new Set(state.hiddenStructureIds).add(structureId),
      selectedStructureId:
        state.selectedStructureId === structureId
          ? null
          : state.selectedStructureId,
      hoveredStructureId:
        state.hoveredStructureId === structureId
          ? null
          : state.hoveredStructureId,
      isolatedStructureId:
        state.isolatedStructureId === structureId
          ? null
          : state.isolatedStructureId,
    })),

  hideMany: (structureIds) =>
    set((state) => ({
      hiddenStructureIds: new Set([
        ...state.hiddenStructureIds,
        ...structureIds,
      ]),
    })),

  showAll: () =>
    set({
      hiddenStructureIds: new Set(),
      hiddenSystems: new Set(),
      isolatedStructureId: null,
    }),

  isolate: (structureId) =>
    set({ isolatedStructureId: structureId, selectedStructureId: structureId }),
  exitIsolate: () => set({ isolatedStructureId: null }),

  toggleSystem: (system) =>
    set((state) => ({
      hiddenSystems: state.hiddenSystems.has(system)
        ? without(state.hiddenSystems, system)
        : new Set(state.hiddenSystems).add(system),
    })),

  reveal: (structureId, system) =>
    set((state) => ({
      hiddenStructureIds: without(state.hiddenStructureIds, structureId),
      hiddenSystems: without(state.hiddenSystems, system),
      isolatedStructureId:
        state.isolatedStructureId === null ||
        state.isolatedStructureId === structureId
          ? state.isolatedStructureId
          : structureId,
    })),

  focus: (structureId) =>
    set({ cameraCommand: { type: "focus", structureId, nonce: ++nonce } }),
  resetCamera: () => set({ cameraCommand: { type: "reset", nonce: ++nonce } }),
}));

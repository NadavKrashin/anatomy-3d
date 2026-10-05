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
  /** While true, clicks in the 3D view don't change the selection (quiz highlights). */
  selectionLocked: boolean;
  /** Clicks pick parts (heads of a muscle, lobes of a lung…) instead of wholes. */
  pickParts: boolean;
  /** Draw the selected muscle's origin/insertion patches (explore). */
  showAttachments: boolean;
  /**
   * Layer peeling: each entry is one peeled batch (the structures that were
   * outermost from the camera at the time), most recent last.
   */
  peeledLayers: readonly (readonly string[])[];
  /** Nonce of the latest peel request; the 3D scene answers with `applyPeel`. */
  peelRequest: number;

  select: (structureId: string | null) => void;
  /** Selection from a click in the 3D view; ignored while the selection is locked. */
  pick: (structureId: string | null) => void;
  setSelectionLocked: (locked: boolean) => void;
  setPickParts: (pickParts: boolean) => void;
  setShowAttachments: (show: boolean) => void;
  hover: (structureId: string | null) => void;
  hide: (structureId: string) => void;
  hideMany: (structureIds: Iterable<string>) => void;
  showAll: () => void;
  /** Show exactly `visibleIds` (of `allIds`), clearing every other filter and the selection. */
  showOnly: (visibleIds: Iterable<string>, allIds: Iterable<string>) => void;
  /** Back to the initial state (used when leaving a quiz). */
  reset: () => void;
  isolate: (structureId: string) => void;
  exitIsolate: () => void;
  toggleSystem: (system: AnatomySystem) => void;
  setHiddenSystems: (systems: Iterable<AnatomySystem>) => void;
  /** Make a structure visible regardless of hide/system/isolate filters. */
  reveal: (structureId: string, system: AnatomySystem) => void;
  focus: (structureId: string) => void;
  resetCamera: () => void;
  /** Ask the scene to peel the outer layer as seen from the camera (not while isolating). */
  requestPeel: () => void;
  /** Hide one peeled batch; the selected structure is always kept. */
  applyPeel: (structureIds: readonly string[]) => void;
  /** Show the most recently peeled batch again. */
  restoreLayer: () => void;
  /** Show every peeled batch again (e.g. on a new quiz question). */
  restoreAllLayers: () => void;
}

let nonce = 0;

const without = <T>(set: ReadonlySet<T>, value: T): Set<T> => {
  const next = new Set(set);
  next.delete(value);
  return next;
};

const initialState = {
  selectedStructureId: null,
  hoveredStructureId: null,
  hiddenStructureIds: new Set<string>(),
  hiddenSystems: new Set<AnatomySystem>(),
  isolatedStructureId: null,
  cameraCommand: null,
  selectionLocked: false,
  pickParts: false,
  showAttachments: true,
  peeledLayers: [],
  peelRequest: 0,
} satisfies Partial<ViewerState>;

export const useViewerStore = create<ViewerState>()((set, get) => ({
  ...initialState,

  select: (selectedStructureId) => set({ selectedStructureId }),
  pick: (structureId) => {
    if (!get().selectionLocked) set({ selectedStructureId: structureId });
  },
  setSelectionLocked: (selectionLocked) => set({ selectionLocked }),
  setPickParts: (pickParts) => set({ pickParts }),
  setShowAttachments: (showAttachments) => set({ showAttachments }),
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
      peeledLayers: [],
    }),

  showOnly: (visibleIds, allIds) => {
    const visible = new Set(visibleIds);
    set({
      hiddenStructureIds: new Set([...allIds].filter((id) => !visible.has(id))),
      hiddenSystems: new Set(),
      isolatedStructureId: null,
      selectedStructureId: null,
      peeledLayers: [],
      pickParts: false,
    });
  },

  reset: () =>
    set({
      ...initialState,
      hiddenStructureIds: new Set(),
      hiddenSystems: new Set(),
    }),

  isolate: (structureId) =>
    set({ isolatedStructureId: structureId, selectedStructureId: structureId }),
  exitIsolate: () => set({ isolatedStructureId: null }),

  setHiddenSystems: (systems) => set({ hiddenSystems: new Set(systems) }),

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

  requestPeel: () => {
    if (get().isolatedStructureId === null)
      set({ peelRequest: get().peelRequest + 1 });
  },

  applyPeel: (structureIds) =>
    set((state) => {
      const layer = structureIds.filter(
        (id) =>
          id !== state.selectedStructureId && !state.hiddenStructureIds.has(id),
      );
      if (layer.length === 0) return {};
      return {
        peeledLayers: [...state.peeledLayers, layer],
        hiddenStructureIds: new Set([...state.hiddenStructureIds, ...layer]),
        hoveredStructureId:
          state.hoveredStructureId && layer.includes(state.hoveredStructureId)
            ? null
            : state.hoveredStructureId,
      };
    }),

  restoreLayer: () =>
    set((state) => {
      const last = state.peeledLayers.at(-1);
      if (!last) return {};
      const hidden = new Set(state.hiddenStructureIds);
      for (const id of last) hidden.delete(id);
      return {
        peeledLayers: state.peeledLayers.slice(0, -1),
        hiddenStructureIds: hidden,
      };
    }),

  restoreAllLayers: () =>
    set((state) => {
      if (state.peeledLayers.length === 0) return {};
      const hidden = new Set(state.hiddenStructureIds);
      for (const id of state.peeledLayers.flat()) hidden.delete(id);
      return { peeledLayers: [], hiddenStructureIds: hidden };
    }),
}));

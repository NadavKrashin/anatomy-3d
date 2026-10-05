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
   * Peel mode: taps in the 3D view peel (hide) the tapped structure instead
   * of selecting it — a hands-on dissection, one structure at a time.
   */
  peelMode: boolean;
  /** Peeled structures, most recent last (an undo stack for "restore"). */
  peeledLayers: readonly (readonly string[])[];

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
  /** Turn peel mode on/off (not while isolating — everything else is ghosted then). */
  setPeelMode: (on: boolean) => void;
  /** Peel one structure: hide it and remember it so it can be restored. */
  peelStructure: (structureId: string) => void;
  /** Show the most recently peeled structure again. */
  restoreLayer: () => void;
  /** Show every peeled structure again (e.g. on a new quiz question). */
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
  peelMode: false,
  peeledLayers: [],
} satisfies Partial<ViewerState>;

export const useViewerStore = create<ViewerState>()((set, get) => ({
  ...initialState,

  select: (selectedStructureId) => set({ selectedStructureId }),
  pick: (structureId) => {
    const { peelMode, selectionLocked, peelStructure } = get();
    if (peelMode) {
      if (structureId) peelStructure(structureId);
    } else if (!selectionLocked) set({ selectedStructureId: structureId });
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
      peelMode: false,
    });
  },

  reset: () =>
    set({
      ...initialState,
      hiddenStructureIds: new Set(),
      hiddenSystems: new Set(),
    }),

  isolate: (structureId) =>
    set({
      isolatedStructureId: structureId,
      selectedStructureId: structureId,
      peelMode: false,
    }),
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

  setPeelMode: (on) =>
    set({ peelMode: on && get().isolatedStructureId === null }),

  peelStructure: (structureId) =>
    set((state) => {
      if (state.hiddenStructureIds.has(structureId)) return {};
      const clear = (id: string | null) => (id === structureId ? null : id);
      return {
        peeledLayers: [...state.peeledLayers, [structureId]],
        hiddenStructureIds: new Set(state.hiddenStructureIds).add(structureId),
        selectedStructureId: clear(state.selectedStructureId),
        hoveredStructureId: clear(state.hoveredStructureId),
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

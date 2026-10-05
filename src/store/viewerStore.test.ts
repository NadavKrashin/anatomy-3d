import { beforeEach, describe, expect, it } from "vitest";
import { useViewerStore } from "./viewerStore";

const initial = useViewerStore.getState();

describe("viewer store", () => {
  beforeEach(() => useViewerStore.setState(initial, true));

  it("hiding the selected structure clears the selection", () => {
    const { select, hide } = useViewerStore.getState();
    select("heart");
    hide("heart");
    const state = useViewerStore.getState();
    expect(state.selectedStructureId).toBeNull();
    expect(state.hiddenStructureIds.has("heart")).toBe(true);
  });

  it("reveal unhides the structure and its system", () => {
    const { hide, toggleSystem, reveal } = useViewerStore.getState();
    hide("heart");
    toggleSystem("cardiovascular");
    reveal("heart", "cardiovascular");
    const state = useViewerStore.getState();
    expect(state.hiddenStructureIds.has("heart")).toBe(false);
    expect(state.hiddenSystems.has("cardiovascular")).toBe(false);
  });

  it("reveal moves an active isolation to the revealed structure", () => {
    const { isolate, reveal } = useViewerStore.getState();
    isolate("heart");
    reveal("liver", "digestive");
    expect(useViewerStore.getState().isolatedStructureId).toBe("liver");
  });

  it("show all clears every filter", () => {
    const { hide, toggleSystem, isolate, showAll } = useViewerStore.getState();
    hide("liver");
    toggleSystem("skeletal");
    isolate("heart");
    showAll();
    const state = useViewerStore.getState();
    expect(state.hiddenStructureIds.size).toBe(0);
    expect(state.hiddenSystems.size).toBe(0);
    expect(state.isolatedStructureId).toBeNull();
  });

  it("issues a new camera command for every focus request", () => {
    const { focus } = useViewerStore.getState();
    focus("heart");
    const first = useViewerStore.getState().cameraCommand;
    focus("heart");
    expect(useViewerStore.getState().cameraCommand).not.toEqual(first);
  });

  it("pick changes the selection unless it is locked", () => {
    const { pick, setSelectionLocked, select } = useViewerStore.getState();
    pick("heart");
    expect(useViewerStore.getState().selectedStructureId).toBe("heart");
    setSelectionLocked(true);
    pick("liver");
    expect(useViewerStore.getState().selectedStructureId).toBe("heart");
    select("liver"); // programmatic selection still works
    expect(useViewerStore.getState().selectedStructureId).toBe("liver");
  });

  it("showOnly hides everything else and clears other filters", () => {
    const { toggleSystem, isolate, select, showOnly } =
      useViewerStore.getState();
    toggleSystem("skeletal");
    isolate("heart");
    select("heart");
    showOnly(["heart", "liver"], ["heart", "liver", "skull", "femur-left"]);
    const state = useViewerStore.getState();
    expect([...state.hiddenStructureIds].sort()).toEqual([
      "femur-left",
      "skull",
    ]);
    expect(state.hiddenSystems.size).toBe(0);
    expect(state.isolatedStructureId).toBeNull();
    expect(state.selectedStructureId).toBeNull();
  });

  it("reset returns to the initial state", () => {
    const { hide, setSelectionLocked, select, reset } =
      useViewerStore.getState();
    hide("heart");
    setSelectionLocked(true);
    select("liver");
    reset();
    const state = useViewerStore.getState();
    expect(state.hiddenStructureIds.size).toBe(0);
    expect(state.selectionLocked).toBe(false);
    expect(state.selectedStructureId).toBeNull();
  });
});

describe("viewer store — peel mode", () => {
  beforeEach(() => useViewerStore.setState(initial, true));

  it("in peel mode a tap peels the structure instead of selecting it", () => {
    const { setPeelMode, pick } = useViewerStore.getState();
    setPeelMode(true);
    pick("deltoid");
    pick(null); // a tap on empty space does nothing
    const state = useViewerStore.getState();
    expect(state.selectedStructureId).toBeNull();
    expect(state.peeledLayers).toEqual([["deltoid"]]);
    expect(state.hiddenStructureIds.has("deltoid")).toBe(true);
  });

  it("peeling the selected structure deselects it; peeling twice is a no-op", () => {
    const { select, peelStructure } = useViewerStore.getState();
    select("biceps");
    peelStructure("biceps");
    peelStructure("biceps");
    const state = useViewerStore.getState();
    expect(state.selectedStructureId).toBeNull();
    expect(state.peeledLayers).toEqual([["biceps"]]);
  });

  it("is not available while isolating, and isolating turns it off", () => {
    const { setPeelMode, isolate } = useViewerStore.getState();
    setPeelMode(true);
    isolate("heart");
    expect(useViewerStore.getState().peelMode).toBe(false);
    useViewerStore.getState().setPeelMode(true);
    expect(useViewerStore.getState().peelMode).toBe(false);
  });

  it("restoring brings back one peel at a time, not manual hides", () => {
    const { hide, peelStructure, restoreLayer } = useViewerStore.getState();
    hide("liver");
    peelStructure("deltoid");
    peelStructure("biceps");
    restoreLayer();
    let state = useViewerStore.getState();
    expect([...state.hiddenStructureIds].sort()).toEqual(["deltoid", "liver"]);
    useViewerStore.getState().restoreAllLayers();
    state = useViewerStore.getState();
    expect([...state.hiddenStructureIds]).toEqual(["liver"]);
    expect(state.peeledLayers).toEqual([]);
  });

  it("show all and show only forget peels; show only ends peel mode", () => {
    const { peelStructure, showAll, setPeelMode } = useViewerStore.getState();
    peelStructure("deltoid");
    showAll();
    expect(useViewerStore.getState().peeledLayers).toEqual([]);
    setPeelMode(true);
    useViewerStore.getState().showOnly(["biceps"], ["biceps", "deltoid"]);
    expect(useViewerStore.getState().peelMode).toBe(false);
  });
});

describe("viewer store — muscle parts", () => {
  beforeEach(() => useViewerStore.setState(initial, true));

  it("picking parts is off by default and switched off by show only (quiz start)", () => {
    const { setPickParts, showOnly } = useViewerStore.getState();
    expect(useViewerStore.getState().pickParts).toBe(false);
    setPickParts(true);
    expect(useViewerStore.getState().pickParts).toBe(true);
    showOnly(["biceps"], ["biceps"]);
    expect(useViewerStore.getState().pickParts).toBe(false);
  });
});

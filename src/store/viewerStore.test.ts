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

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
});

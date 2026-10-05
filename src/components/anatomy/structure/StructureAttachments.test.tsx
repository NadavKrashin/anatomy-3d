// @vitest-environment jsdom
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { zAnatomyDataset } from "@/data/anatomy/z-anatomy";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useViewerStore } from "@/store/viewerStore";
import { StructureInfoPanel } from "../StructureInfoPanel";

const show = (id: string) => {
  renderWithProviders(<StructureInfoPanel />, {
    dataset: zAnatomyDataset,
  });
  act(() => useViewerStore.getState().select(id));
};

describe("<StructureAttachments> (in the info panel)", () => {
  it("names the bones of a muscle's origin and insertion", () => {
    show("biceps-brachii-muscle-left");
    const section = within(
      screen
        .getByRole("heading", { name: "Origin and insertion" })
        .closest("section") as HTMLElement,
    );
    expect(section.getByText("Origin").nextElementSibling?.textContent).toBe(
      "Scapula (left)",
    );
    expect(section.getByText("Insertion").nextElementSibling?.textContent).toBe(
      "Radius (left)",
    );
  });

  it("toggles the patches on the model and links to a bone", async () => {
    const user = userEvent.setup();
    show("biceps-brachii-muscle-left");
    await user.click(screen.getByRole("button", { name: "Show on model" }));
    expect(useViewerStore.getState().showAttachments).toBe(false);
    await user.click(screen.getByRole("button", { name: "Radius (left)" }));
    expect(useViewerStore.getState().selectedStructureId).toBe("radius-left");
  });

  it("muscles under review show sites without claiming origin or insertion", () => {
    show("serratus-anterior-muscle-left");
    expect(screen.queryByText("Origin")).toBeNull();
    expect(
      screen.getByText("Attachment (origin or insertion not confirmed)"),
    ).toBeTruthy();
  });

  it("says so when the model has no attachment data for a muscle", () => {
    show("palmaris-longus-muscle-left");
    expect(
      screen.getByText("No attachment data for this muscle in the model."),
    ).toBeTruthy();
  });

  it("lists the muscles attached to a bone", () => {
    show("humerus-left");
    expect(
      screen.getByRole("heading", { name: "Muscles attached to this bone" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Brachialis muscle (left)" }),
    ).toBeTruthy();
  });
});

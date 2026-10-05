// @vitest-environment jsdom
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { useViewerStore } from "@/store/viewerStore";
import { StructureInfoPanel } from "./StructureInfoPanel";

const selectStructure = (id: string) =>
  act(() => useViewerStore.getState().select(id));

describe("<StructureInfoPanel>", () => {
  it("renders nothing without a selection", () => {
    const { container } = renderWithProviders(<StructureInfoPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows names in all languages and the known details", () => {
    renderWithProviders(<StructureInfoPanel />);
    selectStructure("biceps-brachii-left");

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Biceps brachii (left)",
    );
    expect(screen.getByText("השריר הדו־ראשי של הזרוע (שמאל)")).toBeDefined();
    expect(screen.getByText("Musculus biceps brachii (sin.)")).toBeDefined();
    expect(screen.getByText("Radial tuberosity")).toBeDefined();
    expect(screen.getByText("Musculocutaneous nerve (C5–C6)")).toBeDefined();
  });

  it("hide removes the structure and closes the panel", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StructureInfoPanel />);
    selectStructure("heart");

    await user.click(screen.getByRole("button", { name: "Hide" }));
    expect(useViewerStore.getState().hiddenStructureIds.has("heart")).toBe(
      true,
    );
    expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
  });

  it("isolate toggles into and out of isolate mode", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StructureInfoPanel />);
    selectStructure("liver");

    await user.click(screen.getByRole("button", { name: "Isolate" }));
    expect(useViewerStore.getState().isolatedStructureId).toBe("liver");
    await user.click(screen.getByRole("button", { name: "Exit isolate" }));
    expect(useViewerStore.getState().isolatedStructureId).toBeNull();
  });

  it("renders Hebrew UI labels when the locale is Hebrew", () => {
    renderWithProviders(<StructureInfoPanel />, { locale: "he" });
    selectStructure("heart");
    expect(screen.getByRole("button", { name: "הסתרה" })).toBeDefined();
    expect(screen.getByText("אספקת דם")).toBeDefined();
  });
});

// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { QuizConfig } from "@/types/quizConfig";
import { QuizSetup } from "./QuizSetup";

describe("<QuizSetup>", () => {
  it("defaults to a 10-question whole-body find quiz", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn<(config: QuizConfig) => void>();
    renderWithProviders(<QuizSetup onStart={onStart} />);
    await user.click(screen.getByRole("button", { name: "Start" }));
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "find",
        count: 10,
        scope: expect.objectContaining({ kind: "all" }) as unknown,
      }),
    );
  });

  it("uses the chosen scope, mode and length", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn<(config: QuizConfig) => void>();
    renderWithProviders(<QuizSetup onStart={onStart} />);
    await user.click(screen.getByRole("radio", { name: /Upper limb/ }));
    await user.click(
      screen.getByRole("radio", { name: /Identify the structure/ }),
    );
    await user.click(screen.getByRole("radio", { name: "5" }));
    await user.click(screen.getByRole("button", { name: "Start" }));
    const config = onStart.mock.calls[0]?.[0];
    expect(config?.scope.id).toBe("region:upper-limb");
    expect(config?.mode).toBe("identify");
    expect(config?.count).toBe(5);
  });

  it("preselects a scope from the URL", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn<(config: QuizConfig) => void>();
    renderWithProviders(
      <QuizSetup initialScopeId="system:nervous" onStart={onStart} />,
    );
    await user.click(screen.getByRole("button", { name: "Start" }));
    expect(onStart.mock.calls[0]?.[0].scope.id).toBe("system:nervous");
  });
});

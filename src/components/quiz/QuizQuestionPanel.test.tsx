// @vitest-environment jsdom
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { startQuiz } from "@/lib/quiz/quizEngine";
import { useQuizStore } from "@/store/quizStore";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { QuizQuestion } from "@/types/quiz";
import { QuizQuestionPanel } from "./QuizQuestionPanel";

const begin = (questions: QuizQuestion[]) =>
  act(() =>
    useQuizStore.getState().begin(
      startQuiz({
        id: "s",
        scopeId: "all",
        mode: "mixed",
        questions,
        now: 0,
      }),
    ),
  );

describe("<QuizQuestionPanel>", () => {
  beforeEach(() => useQuizStore.getState().clear());

  it("asks to find a structure by name", () => {
    renderWithProviders(<QuizQuestionPanel />);
    begin([
      {
        id: "q1",
        type: "find",
        structureId: "radial-nerve-left",
        acceptedStructureIds: ["radial-nerve-left"],
      },
    ]);
    expect(screen.getByText("Find the")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Radial nerve — left",
    );
  });

  it("shows retry feedback naming the wrong structure, then offers the answer after two misses", () => {
    renderWithProviders(<QuizQuestionPanel />);
    begin([
      {
        id: "q1",
        type: "find",
        structureId: "heart",
        acceptedStructureIds: ["heart"],
      },
    ]);
    act(() =>
      useQuizStore
        .getState()
        .dispatch({ type: "answer", structureId: "liver", now: 1 }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      /Incorrect.*Liver.*Try again/,
    );
    expect(screen.queryByRole("button", { name: "Show answer" })).toBeNull();

    act(() =>
      useQuizStore
        .getState()
        .dispatch({ type: "answer", structureId: "skull", now: 2 }),
    );
    expect(
      screen.getByRole("button", { name: "Show answer" }),
    ).toBeInTheDocument();
  });

  it("answers identify questions from the options and marks the result", async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuizQuestionPanel />);
    begin([
      {
        id: "q1",
        type: "identify",
        structureId: "ulnar-nerve-left",
        optionIds: ["median-nerve-left", "ulnar-nerve-left"],
      },
    ]);
    expect(
      screen.getByText("What structure is highlighted?"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Median nerve/ }));
    expect(screen.getByRole("status")).toHaveTextContent(
      /Incorrect.*Correct answer.*Ulnar nerve/,
    );
    expect(
      screen.getByRole("button", { name: /See results/ }),
    ).toBeInTheDocument();
  });
});

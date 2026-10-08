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
      "Radial nerve (left)",
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

  it("asks to find the structure her summary describes", () => {
    renderWithProviders(<QuizQuestionPanel />);
    begin([
      {
        id: "q1",
        type: "find",
        structureId: "radial-nerve-left",
        acceptedStructureIds: ["radial-nerve-left", "radial-nerve-right"],
        clue: "עצב הזרוע האחורי.",
      },
    ]);
    expect(
      screen.getByText("Find the structure described here:"),
    ).toBeInTheDocument();
    expect(screen.getByText("עצב הזרוע האחורי.")).toHaveAttribute("lang", "he");
    expect(screen.queryByText(/Radial nerve/)).toBeNull();
  });

  it("answers a description with names that don't give a side", async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuizQuestionPanel />);
    begin([
      {
        id: "q1",
        type: "describe",
        structureId: "ulnar-nerve-left",
        optionIds: ["median-nerve-left", "ulnar-nerve-left"],
        clue: "עובר מאחורי האפיקונדיל המדיאלי.",
      },
    ]);
    expect(
      screen.getByRole("heading", {
        name: "Which structure is described here?",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\(left\)/)).toBeNull();

    await user.click(screen.getByRole("button", { name: /Median nerve/ }));
    expect(screen.getByRole("status")).toHaveTextContent(
      /Incorrect.*Correct answer.*Ulnar nerve/,
    );
    expect(screen.getByRole("status")).not.toHaveTextContent("(left)");
  });
});

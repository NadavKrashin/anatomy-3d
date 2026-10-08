/**
 * Quiz + progress flow — MVP acceptance criteria 11–18: start a quiz, get
 * "Find the X", click a structure, get right/wrong feedback, finish 10
 * questions, see results, refresh, and find the progress retained.
 */
import type { Browser, Page } from "playwright";
import {
  DISTINCTIONS_HEADING,
  SUMMARY_DISTINCTIONS,
} from "../src/data/anatomy/z-anatomy/summaryDistinctions";
import { he } from "../src/lib/i18n/messages.he";
import { assert, BASE_URL, openPage, SHOTS, waitForModel } from "./helpers";

const QUESTIONS = 10;

async function phase(
  page: Page,
): Promise<"answering" | "answered" | "complete"> {
  if ((await page.getByText(he.quiz.complete).count()) > 0) return "complete";
  const next = page.getByRole("button", {
    name: new RegExp(`${he.quiz.next}|${he.quiz.finish}`),
  });
  return (await next.count()) > 0 ? "answered" : "answering";
}

/**
 * Answers the current find question without knowing where the target is:
 * click the middle of the body; if wrong, click empty space (deselect) and
 * click again until "Show answer" is offered, then reveal.
 */
async function answerFindQuestion(page: Page) {
  const box = await page.locator("canvas").boundingBox();
  if (!box) throw new Error("canvas not laid out");
  const body = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const empty = { x: box.x + box.width * 0.9, y: box.y + box.height * 0.85 };

  // Start each question from the overview, as a student would with R.
  await page.keyboard.press("KeyR");
  await page.waitForTimeout(600);

  for (
    let attempt = 0;
    attempt < 6 && (await phase(page)) === "answering";
    attempt++
  ) {
    const reveal = page.getByRole("button", { name: he.quiz.showAnswer });
    if ((await reveal.count()) > 0) {
      await reveal.click();
      return;
    }
    // Pause between clicks so the two aren't read as a double-click (which focuses).
    await page.mouse.click(empty.x, empty.y);
    await page.waitForTimeout(450);
    await page.mouse.click(body.x, body.y);
    await page.waitForTimeout(450);
  }
}

export async function quizFlow(browser: Browser, errors: string[]) {
  const page = await openPage(browser, errors);
  try {
    await runQuizFlow(page);
  } catch (error) {
    await page.screenshot({ path: "test-results/quiz-failure.png" });
    throw error;
  } finally {
    await page.close();
  }
}

async function runQuizFlow(page: Page) {
  await page.goto(`${BASE_URL}/quiz`);
  await page.screenshot({ path: `${SHOTS}/quiz-setup.png` });
  await page.getByRole("button", { name: he.quiz.start }).click();
  await waitForModel(page);
  assert(
    await page.getByText(he.quiz.questionOf(1, QUESTIONS)).isVisible(),
    "quiz starts at question 1 of 10",
  );
  assert(
    await page.getByText(he.quiz.findPrompt).isVisible(),
    'quiz asks "find the X"',
  );
  await page.screenshot({ path: `${SHOTS}/quiz-find.png` });

  // Peel mode is offered in find questions (deep muscles hide under others):
  // a tap then peels instead of answering.
  await page.getByRole("button", { name: he.viewer.peelMode }).click();
  const view = await page.locator("canvas").boundingBox();
  assert(view, "canvas is laid out");
  await page.mouse.click(view.x + view.width / 2, view.y + view.height / 2);
  await page
    .getByRole("button", { name: `${he.viewer.restoreLayer} (1)` })
    .waitFor({ timeout: 5000 });
  await page.screenshot({ path: `${SHOTS}/quiz-find-peeled.png` });
  await page.keyboard.press("Shift+KeyP");
  await page.keyboard.press("KeyP"); // peel mode off: taps answer again
  assert(
    (await page
      .getByRole("button", { name: new RegExp(he.viewer.restoreLayer) })
      .count()) === 0 && (await page.getByText(he.quiz.findPrompt).isVisible()),
    "a find question can peel a structure by tapping and restore it (⇧P)",
  );

  let sawFeedback = false;
  for (
    let guard = 0;
    guard < QUESTIONS * 2 && (await phase(page)) !== "complete";
    guard++
  ) {
    if ((await phase(page)) === "answering") await answerFindQuestion(page);
    if ((await page.getByRole("status").count()) > 0) sawFeedback = true;
    if (guard === 0)
      await page.screenshot({ path: `${SHOTS}/quiz-feedback.png` });
    // Correct answers auto-advance; otherwise press Next.
    await page.waitForTimeout(1300);
    if ((await phase(page)) === "answered") {
      await page
        .getByRole("button", {
          name: new RegExp(`${he.quiz.next}|${he.quiz.finish}`),
        })
        .click();
    }
  }
  assert(sawFeedback, "clicking a structure gives right/wrong feedback");

  await page.getByText(he.quiz.complete).first().waitFor({ timeout: 5000 });
  // The score is a sentence ("3 of 10 correct on the first try").
  const scoreLine = new RegExp(
    he.quiz.scoreLine(999, QUESTIONS).replace("999", "\\d+"),
  );
  assert(
    await page.getByText(scoreLine).isVisible(),
    "results show a score after 10 questions",
  );
  await page.waitForTimeout(1500); // let the camera glide back to the overview
  await page.screenshot({ path: `${SHOTS}/quiz-summary.png` });

  await page.goto(`${BASE_URL}/progress`);
  const quizzesTaken = page.getByText(he.progress.quizzesTaken);
  await quizzesTaken.waitFor();
  await page.reload();
  await quizzesTaken.waitFor();
  const tile = quizzesTaken.locator("..");
  assert(
    (await tile.innerText()).includes("1"),
    "progress survives a page refresh",
  );
  await page.screenshot({ path: `${SHOTS}/progress.png`, fullPage: true });

  // Identify mode: options are buttons; answer with the keyboard.
  await page.goto(`${BASE_URL}/quiz`);
  await page
    .getByRole("radio", { name: new RegExp(he.quiz.modes.identify.title) })
    .check({ force: true });
  await page
    .getByRole("radio", { name: "5", exact: true })
    .check({ force: true });
  await page.getByRole("button", { name: he.quiz.start }).click();
  await waitForModel(page);
  assert(
    await page.getByText(he.quiz.identifyPrompt).isVisible(),
    "identify mode highlights a structure and asks for its name",
  );
  await page.screenshot({ path: `${SHOTS}/quiz-identify.png` });
  await page.keyboard.press("Digit1");
  assert(
    (await page.getByRole("status").count()) > 0,
    "identify answers via keyboard and gets feedback",
  );

  // From her summary: her distinctions, answered from her own words.
  await page.goto(`${BASE_URL}/quiz`);
  await page
    .getByRole("radio", { name: new RegExp(he.quiz.modes.summary.title) })
    .check({ force: true });
  // (Click the row: a forced click on its visually hidden radio misses.)
  await page.locator("label", { hasText: DISTINCTIONS_HEADING }).click();
  await page.screenshot({
    path: `${SHOTS}/quiz-setup-from-summary.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: he.quiz.start }).click();
  await waitForModel(page);
  const describe = page.getByRole("heading", { name: he.quiz.describePrompt });
  const findClue = page.getByText(he.quiz.findCluePrompt);
  await describe.or(findClue).first().waitFor();
  const clue = (await page.locator("blockquote").innerText()).trim();
  assert(
    SUMMARY_DISTINCTIONS.some((d) => d.text === clue),
    `summary mode asks with one of her distinctions ("${clue}")`,
  );
  await page.screenshot({ path: `${SHOTS}/quiz-from-summary.png` });
  if (await describe.isVisible()) {
    await page.keyboard.press("Digit1");
    assert(
      (await page.getByRole("status").count()) > 0,
      "a description is answered by choosing a name",
    );
  } else {
    // (Only the distinctions' structures are shown; where the asked one is
    // depends on the random pick, so this just checks the question.)
    assert(
      await findClue.isVisible(),
      "a description can be answered by clicking in the model",
    );
  }

  await page.close();
}

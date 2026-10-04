/**
 * Quiz + progress flow — MVP acceptance criteria 11–18: start a quiz, get
 * "Find the X", click a structure, get right/wrong feedback, finish 10
 * questions, see results, refresh, and find the progress retained.
 */
import type { Browser, Page } from "playwright";
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
  assert(
    await page.getByText(/\d+%/).first().isVisible(),
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
  await page.getByRole("radio", { name: "5" }).check({ force: true });
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

  await page.close();
}

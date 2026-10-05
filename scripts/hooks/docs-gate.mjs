#!/usr/bin/env node
// Claude Code PreToolUse hook (Bash): blocks a `git commit` that changes code
// without touching any documentation, so docs stay current with every commit
// rather than being caught up at the end of a session (user request,
// 2026-10-05). Escape hatch for genuinely doc-free commits (formatting, a
// typo): put `[docs: none]` in the commit message.
// Exit 0 = allow; exit 2 = block, stderr is shown to Claude.
import { execSync } from "node:child_process";

const CODE = [
  /^src\//,
  /^scripts\//,
  /^e2e\//,
  /^public\/models\//,
  /^\.github\//,
  /^package\.json$/,
  /^eslint\.config\.mjs$/,
  /^next\.config\.ts$/,
  /^vitest\.config\.mts$/,
  /^tsconfig\.json$/,
];
const DOCS = [
  /^docs\/.*\.md$/,
  /^CLAUDE\.md$/,
  /^README\.md$/,
  /^THIRD_PARTY_ASSETS\.md$/,
  /^\.claude\/skills\//,
  /^scripts\/anatomy\/z-anatomy\/README\.md$/,
];

function readStdin() {
  try {
    return execSync("cat", {
      encoding: "utf8",
      stdio: ["inherit", "pipe", "ignore"],
    });
  } catch {
    return "";
  }
}

function git(args) {
  return execSync(`git ${args}`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

let command = "";
try {
  command = JSON.parse(readStdin())?.tool_input?.command ?? "";
} catch {
  process.exit(0);
}
if (!/\bgit\s+commit\b/.test(command) || command.includes("[docs: none]")) {
  process.exit(0);
}

let files;
try {
  // Staged files plus working-tree changes: `git add -A && git commit` arrives
  // as one command, so nothing is staged yet when this hook runs.
  const staged = git("diff --cached --name-only").split("\n");
  const porcelain = git("status --porcelain --untracked-files=all")
    .split("\n")
    .map((line) => line.slice(3).split(" -> ").pop());
  files = [...new Set([...staged, ...porcelain])].filter(Boolean);
} catch {
  process.exit(0); // not a git repo / git unavailable: don't get in the way
}

const isDoc = (f) => DOCS.some((re) => re.test(f));
const codeChanged = files.filter(
  (f) => !isDoc(f) && CODE.some((re) => re.test(f)),
);
const docsChanged = files.some(isDoc);

if (codeChanged.length > 0 && !docsChanged) {
  process.stderr.write(
    [
      "docs-gate: this commit changes code but no documentation.",
      `Changed: ${codeChanged.slice(0, 8).join(", ")}${codeChanged.length > 8 ? ", …" : ""}`,
      "Docs are updated with every commit in this repo (see CLAUDE.md). Before committing:",
      "- docs/STATUS.md: what exists / next steps / known issues / session log (always)",
      "- docs/DECISIONS.md for non-obvious choices; docs/ARCHITECTURE.md if a flow or boundary changed;",
      "  docs/DESIGN.md if the visual language changed; docs/CONTENT_REVIEW.md for new terms.",
      "If this commit truly needs no doc change (formatting, typo), add `[docs: none]` to the message.",
    ].join("\n") + "\n",
  );
  process.exit(2);
}
process.exit(0);

---
name: anatomy-workflow
description: How to plan, verify and hand off any change in this anatomy app repository. Use at the start of a task and before reporting work as done — covers required checks (verify, e2e, CI), docs to update, and commit rules.
---

# Anatomy app — workflow & definition of done

## Start

1. `docs/STATUS.md` → current state, **user decisions (don't re-ask)**, next
   steps. Then `docs/CONTRIBUTING.md`; `docs/DESIGN.md` for UI work.
2. Plan small, testable steps. Domain logic goes in `src/lib` (pure, inject
   `now`/`rng`), components orchestrate, stores hold intent-named actions.

## While working

- **Update docs continuously** (user requirement): each commit that changes
  code/data/tooling also updates `docs/STATUS.md` and any other affected doc
  (list below). Record new user decisions in STATUS's table immediately. The
  docs must be correct if the session ends right now. A hook
  (`scripts/hooks/docs-gate.mjs`) blocks code-only commits; `[docs: none]` in
  the message is only for formatting/typo commits.

- Write/extend tests at the lowest sensible level (lib → store → component →
  e2e). Component tests: `// @vitest-environment jsdom` + `renderWithProviders`
  (uses the stable demo dataset).
- Never silence ESLint/TS; fix the cause. No `any`, no `!` outside tests, no
  floating promises, `import type`.
- RTL-safe classes; strings in both dictionaries; names via `TermText`.
- Never invent medical facts/Hebrew terms (`verified: false` + CONTENT_REVIEW).

## Before saying "done"

1. `npm run verify` (format, typegen+tsc, lint, tests, dataset validation,
   build) — all green.
2. UI/viewer changes: start `npx next start -p 3100` as a background task
   (after the build), `npm run e2e:smoke`, then **look at
   `docs/screenshots/*.png`** (desktop, iPad, phone) and fix what looks off.
3. Check docs are current (they should already be, commit by commit):
   `docs/STATUS.md` (phase table, what exists, next steps, known
   issues, session log, new user decisions) · `docs/DECISIONS.md` (non-obvious
   choices) · `docs/ARCHITECTURE.md` (flows/boundaries) · `docs/DESIGN.md`
   (visual language) · `docs/CONTENT_REVIEW.md` (new terms).
4. Commit on `claude/<topic>` with a what-and-why message ending with the
   attribution lines the session provides; push; **check the GitHub CI run**
   for that commit. No PR unless the user asks.
5. Report honestly: what was verified and how; what wasn't.

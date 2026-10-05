@AGENTS.md

# Anatomy — working instructions for Claude sessions

3D anatomy study app (Next.js 16 App Router + React Three Fiber + Zustand +
Tailwind 4) for a Hebrew-speaking medical student in Israel. Hebrew/RTL UI
first, English/Latin terminology alongside. Real model: Z-Anatomy upper limb +
skeleton (CC BY-SA).

> **Keep the docs current as you go — not at the end of the session.** The
> user requires this (2026-10-05). Every commit that changes behaviour, code,
> data or tooling updates the docs in the **same commit**: at minimum
> `docs/STATUS.md` (what exists, next steps, known issues, session log), plus
> `docs/DECISIONS.md` / `docs/ARCHITECTURE.md` / `docs/DESIGN.md` /
> `docs/CONTENT_REVIEW.md` when relevant. A new user decision or preference
> goes into STATUS's decisions table the moment it is made. Assume the session
> can end at any time: the docs must always describe the code as it is now.
> A PreToolUse hook (`scripts/hooks/docs-gate.mjs`) blocks `git commit`s that
> touch code but no docs; use `[docs: none]` in the message only for commits
> that genuinely need no doc change (formatting, a typo).

## 1. Start of every session

1. Read **`docs/STATUS.md`** — current state, the user's decisions (don't
   re-ask them), ordered next steps, known issues.
2. Read **`docs/CONTRIBUTING.md`** (conventions + definition of done) and, for
   any UI work, **`docs/DESIGN.md`** (visual direction; supersedes SPEC §16/§42).
3. Look up the rest as needed: `docs/ARCHITECTURE.md` (layers, boundaries,
   recipes), `docs/DECISIONS.md` (rationale), `docs/SPEC.md` (product brief),
   `docs/DEPLOYMENT.md`, `docs/CONTENT_REVIEW.md`, `THIRD_PARTY_ASSETS.md`.
4. Project skills in `.claude/skills/` apply automatically:
   `anatomy-workflow` (definition of done), `anatomy-ui-style` (this app's
   design rules), `frontend-design` (Anthropic's general design guidance).
5. Next.js 16 differs from older versions — check
   `node_modules/next/dist/docs/` before using an unfamiliar API (see AGENTS.md).

## 2. Commands

| Command                                              | Use                                                                                                                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run verify`                                     | **Everything CI runs**: `format:check`, `typecheck` (`next typegen && tsc`), `lint`, `test`, `anatomy:validate`, `build`. Must pass before reporting work done.    |
| `npm run format`                                     | Prettier write (never hand-format).                                                                                                                                |
| `npm test` / `npm run test:watch`                    | Vitest (node; component tests opt into jsdom with a pragma).                                                                                                       |
| `npm run e2e:smoke`                                  | Playwright against `http://localhost:3100` (start `npx next start -p 3100` as a **background task** after a build). Writes `docs/screenshots/` — **look at them**. |
| `npm run anatomy:inspect <glb>` / `anatomy:validate` | Model / dataset checks.                                                                                                                                            |
| `npx tsx e2e/perf-probe.ts`                          | Load + hover-raycast timing.                                                                                                                                       |

## 3. Non-negotiables

**Code & lint** (enforced by ESLint/TS — never disable a rule to get green):

- TypeScript strict + `noUncheckedIndexedAccess`; no `any`; no non-null `!`
  outside tests; no floating/misused promises; `import type`/inline `type`
  imports; exhaustive `switch`; `eqeqeq`; no `console.log` in app code
  (`warn`/`error` only; scripts/e2e may log).
- Domain logic in `src/lib` as pure, unit-tested functions; inject `now`/`rng`.
  Components orchestrate; stores hold state + intent-named actions.
- Components ≲150 lines and single-purpose; split otherwise.
- Only `modelAdapter.ts`, `three/sceneIndex.ts` and dataset `meshMap.json` /
  manifest know raw model node names.

**UI style** (details: `docs/DESIGN.md`, skill `anatomy-ui-style`):

- Light "plate" theme with the tokens in `src/app/globals.css` (`plate`,
  `sheet`, `ink`, `graphite`, `faint`, `rule`, `wash`, `scrub`, `correct`,
  `wrong`). Never hard-code other colours in components; never go dark.
- `font-serif` (Frank Ruhl Libre) for structure names/titles; sans (IBM Plex
  Sans Hebrew) for UI. Sentence case. **No** all-caps/letter-spaced labels,
  "A · B" strings, "Name — fragment" labels, arrows on buttons, card grids,
  big-number stat tiles, gradients as decoration.
- Use the primitives: `Button`/`ButtonLink` (variant + size), `IconButton`,
  `Segmented`, `Kbd`, `ViewerPanel`, `PageShell`, `TermText`, `StructureLabel`.
  Lists with hairline rules (`divide-y divide-rule border-y border-rule`).
- RTL: logical utilities only (`ms-/me-/ps-/pe-/start-/end-/text-start`) — a
  test fails on physical ones. Every string in **both** `messages.he.ts` and
  `messages.en.ts`. Anatomical names through `TermText`/`StructureLabel`.
- Accessibility: touch targets ≥ 40px, visible focus, icon + text for
  right/wrong, respect reduced motion.
- Review every UI change from screenshots (desktop, iPad, phone) before done.

**Content & assets:**

- Never invent medical facts or Hebrew terms. New terms are `verified: false`;
  Hebrew ones go in `docs/CONTENT_REVIEW.md`.
- No third-party asset without a row in `THIRD_PARTY_ASSETS.md`; keep the
  CC BY-SA attribution visible in the UI.

## 4. Definition of done (every change)

1. Tests at the lowest sensible level; `npm run verify` green.
2. UI/viewer changes: fresh build → `next start -p 3100` (background) →
   `npm run e2e:smoke` green → screenshots reviewed.
3. Docs updated **in the same commit as the change** (not batched for later):
   `docs/STATUS.md` (always — phase table, next steps, session log, new user
   decisions), `docs/DECISIONS.md` for non-obvious choices,
   `docs/ARCHITECTURE.md` if a flow/boundary changed, `docs/DESIGN.md` if the
   visual language changed. The docs-gate hook enforces the minimum.
4. Commit on a `claude/<topic>` branch with a what-and-why message; push.
   Don't open PRs unless the user asks. After pushing, check the GitHub CI run
   for the commit — local green is not enough.
5. Never claim something works without having run it.

## 5. Pitfalls already hit (don't repeat)

- `LayoutProps`/route types live in `.next/types`; a clean checkout needs
  `next typegen` (the `typecheck` script does it) — that's why CI once failed.
- Don't kill servers with `pkill -f next` inside a compound shell command (it
  matches the shell). Run `next start` as a background task; stop it by id.
- After `next build`, restart `next start` — an old server serves stale chunks
  (500s).
- In a partial (`--filter=blob:none`) clone, `git ls-tree -l` downloads every
  blob. Use name-only listings.
- The Z-Anatomy pipeline needs Blender's Python module in a venv
  (`pip install "bpy==4.5.*"`, Python 3.11) — see its README.
- Mixing the teal highlight 50/50 with red tissue gives grey; selection uses a
  mostly-teal base colour (see `materialStates.ts`).

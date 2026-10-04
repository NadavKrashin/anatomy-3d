# Conventions

These apply to every change, human or AI.

## Definition of done

A change is done only when all of these hold:

1. `npm run verify` passes (format check, typecheck, lint, unit tests, dataset
   validation, production build). CI runs the same steps.
2. Viewer/UI changes: `npm run e2e:smoke` passes against a fresh build, and the
   screenshots in `docs/screenshots/` were actually looked at.
3. New behaviour has tests at the lowest sensible level (pure logic first).
4. Docs are updated: `docs/STATUS.md` (always), `docs/DECISIONS.md` (for
   non-obvious choices), `docs/ARCHITECTURE.md` (if a boundary or flow
   changed), `docs/CONTENT_REVIEW.md` (for new medical terms).
5. Never report something as working without having run it.

## Code

- TypeScript strict, `noUncheckedIndexedAccess`; no `any`, no non-null `!`
  (tests excepted), no floating promises — enforced by ESLint.
- `import type` / inline `type` imports for types only.
- Small focused modules and components. If a component grows past ~150 lines
  or does two jobs, split it.
- Domain logic lives in `src/lib` as pure functions/classes; React components
  orchestrate. Pass `now`/`rng` in instead of calling `Date.now()` /
  `Math.random()` inside logic.
- Use string-literal unions from `types/` (e.g. `AnatomySystem`) instead of
  free-form strings; derive lists with `as const` arrays.
- Comments explain _why_ (3D math, browser quirks, medical caveats), not what.
  Every module that isn't self-evident gets a short header comment.
- Zustand: one store per concern, intent-named actions, no derived state
  stored, selectors to subscribe narrowly.
- Formatting is Prettier's; don't hand-format.

## UI

- Hebrew is the default language; every string goes in both dictionaries.
- Logical direction utilities only (`ms-`, `pe-`, `start-`, `end-`,
  `text-start`…). A test enforces this.
- Anatomical names render through `TermText`.
- Touch targets ≥ 40px; visible focus states; never convey correct/incorrect
  by colour alone (use icon + text).
- Respect `prefers-reduced-motion`.

## Medical content

- Never invent anatomy facts or Hebrew terms. Absent is better than wrong.
- New terms start `verified: false`; list Hebrew ones in
  `docs/CONTENT_REVIEW.md`.
- Educational only — no diagnosis or treatment advice.

## Assets

- No third-party model is committed before its licence is recorded in
  `THIRD_PARTY_ASSETS.md`.

## Git

- Work on a feature branch (`claude/<topic>` for AI sessions); small commits
  with messages explaining what and why.

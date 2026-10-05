# Conventions

These apply to every change, human or AI.

## Definition of done

A change is done only when all of these hold:

1. `npm run verify` passes (format check, typecheck — `next typegen` then
   `tsc` — lint, unit tests, dataset validation, production build). CI runs the
   same steps; after pushing, check that the CI run for the commit is green.
2. Viewer/UI changes: `npm run e2e:smoke` passes against a fresh build, and the
   screenshots in `docs/screenshots/` were actually looked at.
3. New behaviour has tests at the lowest sensible level (pure logic first).
4. Docs are updated: `docs/STATUS.md` (always), `docs/DECISIONS.md` (for
   non-obvious choices), `docs/ARCHITECTURE.md` (if a boundary or flow
   changed), `docs/CONTENT_REVIEW.md` (for new medical terms).
5. Never report something as working without having run it.

## Code

- TypeScript strict, `noUncheckedIndexedAccess`, `noImplicitOverride`.
- ESLint (`eslint.config.mjs`, type-aware): Next core-web-vitals + TS
  recommended-type-checked, plus `no-non-null-assertion` (off in tests),
  `no-floating-promises`, `no-misused-promises`, `consistent-type-imports`,
  `switch-exhaustiveness-check`, `no-unused-vars` (`_` prefix allowed),
  `eqeqeq`, `prefer-const`, `no-console` (warn/error only; off in scripts/e2e).
  React Compiler hook rules apply (no mutating hook values, no setState in
  render). Never disable a rule to get green — fix the cause.
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

- Follow `docs/DESIGN.md`: tokens from `globals.css` (`plate`, `sheet`, `ink`,
  `graphite`, `rule`, `scrub`…), serif (`font-serif`) for names/titles, sans for
  UI; sentence case; lists with hairline rules instead of card grids; quiet
  controls (`IconButton`, `Button`, `Segmented` in `components/ui`). Avoid the
  generic defaults listed there (all-caps eyebrows, "A · B" strings, arrows on
  buttons, identical boxed cards, big-number stat tiles).
- Review UI changes from screenshots before calling them done.
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

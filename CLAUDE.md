@AGENTS.md

# Project notes for Claude

- Product spec: `docs/SPEC.md` (read it before planning a phase). Decisions log:
  `docs/DECISIONS.md` — append when making a non-obvious choice.
- UI is Hebrew/RTL first. Use logical Tailwind classes (`ms-`, `me-`, `start-`,
  `end-`, `text-start`), never `left`/`right` for layout. Wrap anatomical terms in
  `TermText` (bidi isolation). Every user-facing string goes in both
  `src/lib/i18n/messages.he.ts` and `messages.en.ts`.
- Never invent medical content or Hebrew terms as fact. New terms start
  `verified: false` and get a row in `docs/CONTENT_REVIEW.md`.
- Only `src/lib/anatomy/modelAdapter.ts` + dataset `meshMap.json` know raw model
  node names.
- Before reporting work done: `npm run check` and `npm run build`; for viewer
  changes also run the e2e smoke test (see README) and look at the screenshots.

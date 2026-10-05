@AGENTS.md

# Anatomy — notes for Claude sessions

3D anatomy learning web app (Next.js 16 + React Three Fiber) for a Hebrew-speaking
medical student. Hebrew/RTL UI first; English/Latin terminology alongside.

**Start every session by reading `docs/STATUS.md`** — it has the current phase,
the ordered next steps, known issues and how to verify. Then, as needed:
`docs/SPEC.md` (product brief, §-numbered), `docs/ARCHITECTURE.md` (layers,
boundaries, recipes), `docs/CONTRIBUTING.md` (conventions + definition of
done), `docs/DECISIONS.md` (rationale log), `docs/DESIGN.md` (visual direction
and tokens — read before any UI change).

Non-negotiables (details in CONTRIBUTING):

- `npm run verify` must pass before you report work as done; for UI changes also
  run `npm run e2e:smoke` against a fresh `next start -p 3100` and look at the
  screenshots.
- Domain logic goes in `src/lib` as pure, unit-tested code; components orchestrate.
- Only the model adapter / scene index / dataset `meshMap.json` know raw model
  node names.
- Logical (RTL-safe) Tailwind utilities only; strings in both `messages.he.ts`
  and `messages.en.ts`; anatomical names via `TermText`.
- Never invent medical facts or Hebrew terms; new terms are `verified: false`
  and Hebrew ones are listed in `docs/CONTENT_REVIEW.md`.
- Before finishing: update `docs/STATUS.md` (phase table, next steps, session
  log) and append to `docs/DECISIONS.md` for non-obvious choices.
- Don't kill dev servers with `pkill -f next` from a compound shell command — it
  matches the shell itself. Run `next start` as a background task and stop it
  by task id.

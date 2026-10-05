# Anatomy

> Learn the body by exploring it.

A web-based 3D anatomy learning app for medical students, Hebrew-first (RTL) with
English and Latin terminology.

| Doc                                                | What's in it                                             |
| -------------------------------------------------- | -------------------------------------------------------- |
| [`docs/STATUS.md`](docs/STATUS.md)                 | **Start here** — current phase, next steps, known issues |
| [`docs/SPEC.md`](docs/SPEC.md)                     | Product brief                                            |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)     | Layers, boundaries, data flow, how-to recipes            |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)     | Conventions and definition of done                       |
| [`docs/DECISIONS.md`](docs/DECISIONS.md)           | Why things are the way they are                          |
| [`docs/CONTENT_REVIEW.md`](docs/CONTENT_REVIEW.md) | Medical terms awaiting human verification                |

**Status:** MVP v0 complete — explore the 3D model (select, search in
Hebrew/English/Latin, focus, hide, isolate, systems), quiz yourself ("find the
structure" by clicking in 3D, or "identify the highlighted structure"), and
track progress with simple spaced review. See `docs/STATUS.md` for what's next.

> 3D model: **Z-Anatomy** (CC BY-SA 4.0), based on **BodyParts3D** (DBCLS,
> CC BY-SA 2.1 JP) — whole skeleton plus the muscles, nerves and vessels of
> the upper limbs. See `THIRD_PARTY_ASSETS.md`.
> For educational purposes. Anatomy content should be verified against your
> institution's required resources.

## Run it

Requires Node.js ≥ 20.9.

```bash
npm install
npm run dev            # http://localhost:3000
```

## Scripts

| Command                                         | What it does                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `npm run dev` / `build` / `start`               | Next.js dev server / production build / serve the build                                                            |
| `npm run check`                                 | typecheck + lint + unit tests                                                                                      |
| `npm run typecheck` · `lint` · `test`           | individually                                                                                                       |
| `npm run format`                                | Prettier                                                                                                           |
| `npm run e2e:smoke`                             | Browser smoke test against a running app (`BASE_URL`, default `http://localhost:3100`); writes `docs/screenshots/` |
| `npm run anatomy:inspect <file.glb> [-- --all]` | Mesh / vertex / triangle / material / texture counts, unnamed + duplicate names                                    |
| `npm run anatomy:validate`                      | Cross-checks the active dataset's mesh map, metadata and model                                                     |
| `npm run anatomy:generate-demo`                 | Regenerates `public/models/anatomy-demo.glb` (placeholder model used by tests)                                     |
| `scripts/anatomy/z-anatomy/`                    | Z-Anatomy → GLB pipeline (Blender `bpy` export + meshopt); see its README                                          |

E2E example:

```bash
npm run build && npx next start -p 3100 &
npm run e2e:smoke
```

## Keyboard shortcuts

- Explore: `/` search · `Esc` close/deselect · `F` focus · `I` isolate ·
  `H` hide · `R` reset camera · `Q` quiz · `?` help.
- Quiz: `1–4` answer · `Enter` next · `R` reset camera · `Q` back to explore.

Shortcuts use physical keys, so they work with a Hebrew keyboard layout too.

## Project layout

```
src/
  app/                    routes: / (home), /explore, /quiz, /progress
  components/
    anatomy/              viewer: frame, canvas, model, camera, search, panels
    quiz/  progress/      quiz setup / run / results, progress page
    home/  layout/  ui/   landing page, top-bar pieces, small primitives
    providers/            dataset context, settings (locale + <html dir>)
  data/anatomy/           datasets — z-anatomy/ (active), demo/ (tests), content/ (curated concepts)
  hooks/                  useMessages, useStructureNames, shortcuts, …
  lib/
    anatomy/              registry, model adapter, names, search, visibility
    anatomy/three/        material states, scene index, camera framing
    quiz/                 question generation, quiz engine (reducer), summary
    progress/             review scheduler, progress updates/stats, repository
    study/                study scopes
    i18n/                 Hebrew + English UI strings
  store/                  zustand: viewer, settings, scene index, quiz, progress
  types/                  anatomy, quiz, progress, study scope types
scripts/anatomy/          inspect / validate / generate-demo
e2e/                      Playwright flows (explore, quiz) + runner
docs/                     spec, decisions, content review, screenshots
```

## Swapping in a real model

1. Put the GLB in `public/models/` and run `npm run anatomy:inspect` on it.
2. Add `src/data/anatomy/<dataset>/` with `structures.ts` and `meshMap.json`
   (raw node name → structure id), and point `src/data/anatomy/index.ts` at it.
3. `npm run anatomy:validate`.
4. Record the source and licence in `THIRD_PARTY_ASSETS.md` **before** committing it.

Nothing in the viewer, search or panels needs to change.

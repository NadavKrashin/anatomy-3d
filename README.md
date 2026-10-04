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

**Status:** first vertical slice — landing page → 3D viewer → demo model →
rotate/zoom/pan → click a structure → names + details → search (Hebrew, English,
Latin) → camera focus → hide / isolate / system toggles. Quiz and progress are
next.

> The bundled model is a **development demo — not anatomically accurate**.
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
| `npm run anatomy:generate-demo`                 | Regenerates `public/models/anatomy-demo.glb`                                                                       |

E2E example:

```bash
npm run build && npx next start -p 3100 &
npm run e2e:smoke
```

## Keyboard shortcuts (explore)

`/` search · `Esc` close/deselect · `F` focus · `I` isolate · `H` hide ·
`R` reset camera · `?` help. Shortcuts use physical keys, so they work with a
Hebrew keyboard layout too.

## Project layout

```
src/
  app/                    routes: / (home), /explore
  components/
    anatomy/              viewer: canvas, model, camera, search, panels, toolbar
    home/  layout/  ui/   landing page, top-bar pieces, small primitives
    providers/            dataset context, settings (locale + <html dir>)
  data/anatomy/           datasets — demo/{structures.ts, meshMap.json}
  hooks/                  useMessages, useStructureNames, shortcuts, …
  lib/
    anatomy/              registry, model adapter, names, search, visibility
    anatomy/three/        material states, scene index, camera framing
    i18n/                 Hebrew + English UI strings
  store/                  zustand: viewer, settings, scene index
  types/anatomy.ts        the normalized anatomy data model
scripts/anatomy/          inspect / validate / generate-demo
e2e/                      Playwright smoke test
docs/                     spec, decisions, content review, screenshots
```

## Swapping in a real model

1. Put the GLB in `public/models/` and run `npm run anatomy:inspect` on it.
2. Add `src/data/anatomy/<dataset>/` with `structures.ts` and `meshMap.json`
   (raw node name → structure id), and point `src/data/anatomy/index.ts` at it.
3. `npm run anatomy:validate`.
4. Record the source and licence in `THIRD_PARTY_ASSETS.md` **before** committing it.

Nothing in the viewer, search or panels needs to change.

# Deployment (Vercel)

**Production:** https://ors-anatomy.vercel.app — Vercel project connected to
`NadavKrashin/anatomy-3d`, production branch `main` (first deployed
2026-10-05). Every push to `main` redeploys; other branches get preview URLs.

The app is a static-friendly Next.js 16 site: every route prerenders, there
is no backend, no database and **no environment variables**. Progress is
stored in the browser (localStorage), so each device keeps its own.

## First deployment (done 2026-10-05 — kept for reference)

1. **Get the code onto the production branch.** Work happens on
   `claude/*` branches. Either merge the branch into `main` (recommended:
   open a PR, let CI pass, merge), or later point Vercel's production branch
   at the working branch.
2. In Vercel: **Add New → Project → Import** the GitHub repo
   `NadavKrashin/anatomy-3d`.
3. Settings (Vercel detects most of them):
   - Framework preset: **Next.js**
   - Root directory: `/`
   - Install command: `npm ci` · Build command: `npm run build` · Output:
     default
   - **Node.js version: 22.x** (Project → Settings → General)
   - Environment variables: none
4. Deploy. Every later push to `main` deploys to production; pushes to other
   branches (including `claude/*`) get preview URLs automatically.

## What ships

- Prerendered pages: `/`, `/explore`, `/quiz`, `/progress`.
- `public/models/z-anatomy/*.glb` — the whole body in five files (skeleton
  2.6 MB, muscles 4.2, nerves 3.8, vessels 3.5, organs 1.7; meshopt, decoder
  bundled — no external CDN). The skeleton loads first; the rest streams in.
  `attachments.glb` (1.9 MB) loads only when a muscle or bone is selected.
  `anatomy-demo.glb` is only used by tests but is harmless.
- Fonts (Frank Ruhl Libre, IBM Plex Sans Hebrew) are self-hosted by
  `next/font` at build time.

Model file names are not content-hashed. If the GLBs are regenerated, either
rename them (the pack list is in `src/data/anatomy/z-anatomy/index.ts`) or
expect browsers to revalidate them — Vercel serves `public/` with
`must-revalidate`, so users get the new file on their next load.

## After deploying — checklist

- [ ] Open the production URL on the **iPad** (Safari): model loads, rotate /
      pinch / two-finger pan work, tapping selects, the info sheet is usable.
- [ ] Note load time and smoothness (the whole body is ≈3.1M triangles in
      five files — see STATUS → next steps if it is sluggish).
- [ ] Hebrew RTL layout, search in Hebrew ("עצב מדיאני").
- [ ] Do a short quiz, reload, check `/progress` remembers it.
- [ ] Optional: Safari → Share → **Add to Home Screen** for an app-like icon.
- [ ] The Z-Anatomy / BodyParts3D attribution is visible (bottom of the
      viewer and home footer) — required by CC BY-SA; keep it.

## Before every production deploy

`npm run verify` and `npm run e2e:smoke` pass locally, and the GitHub CI run
for the commit is green.

## Notes for Claude sessions

A cloud session cannot log in to Vercel, and its network policy blocks
`*.vercel.app`, so it cannot open the production site either. Deploying is done by the user in the
Vercel dashboard (or `npx vercel` on their own machine). Claude's part: keep
`main` deployable (green CI), keep this document accurate, and help debug
build logs the user shares. To smoke-test production from a machine with
access: `BASE_URL=https://ors-anatomy.vercel.app npm run e2e:smoke`.

If Vercel doesn't list the repo when importing: grant the Vercel GitHub app
access at github.com/settings/installations → Vercel → Configure →
Repository access (the mobile settings menu hides this page).

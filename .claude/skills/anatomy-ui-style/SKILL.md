---
name: anatomy-ui-style
description: Visual style rules for this anatomy app. Use before creating or changing any UI in this repository — components, pages, panels, buttons, colours, typography, copy, layout, or anything in src/components, src/app or globals.css.
---

# Anatomy app — UI style guide

The full direction is in `docs/DESIGN.md` (read it). This is the working
checklist. The look is an **anatomical atlas** (Netter/Gray's plates): pale
ground, colour-coded tissue, leader lines, a legend, a contents page — calm
and precise, not a dark sci-fi HUD or a SaaS dashboard. The user explicitly
rejected the earlier "blocky, AI-made" look; don't drift back.

## Tokens (src/app/globals.css) — use these, never ad-hoc colours

`plate` ground · `sheet` surfaces · `ink` text · `graphite` secondary text ·
`faint` tertiary · `rule` hairlines · `wash` hover/fill · `scrub` the single
accent (surgical teal — selection, focus, primary action) · `correct` /
`wrong` (+ `-soft` backgrounds) · `caution`.
Utilities: `sheet` (floating surface), `shadow-[var(--shadow-float)]`,
`shadow-[var(--shadow-pop)]`.

## Type

- `font-title` (Miriam Libre) for structure names, page titles, the
  wordmark, list items that are anatomical names.
- Default sans (IBM Plex Sans Hebrew) for UI and body.
- Sizes in use: 13 / 14 / 15 / 17–20 / 22–28 / 40–48 px. Sentence case.

## Components to reuse (src/components/ui, anatomy, layout)

`Button` / `ButtonLink` (`variant`: primary | secondary | quiet, `size`: md |
sm) · `IconButton` (quiet, rounded, `showLabel` — `"wide"` = icon-only on phones — `active`; labels never wrap) · `Segmented` ·
`Kbd` · `PageShell` (regular pages) · `ViewerFrame` + `ViewerPanel` (3D pages)
· `TermText` / `StructureLabel` (anatomical names, bidi-safe).

## Do

- One primary (teal, pill) action per view; everything else quiet.
- Lists with hairline rules: `divide-y divide-rule border-y border-rule`.
- Panels as soft floating sheets (no borders).
- Logical direction utilities only (RTL test enforces it).
- Strings in both `messages.he.ts` and `messages.en.ts`; plain verbs.
- Icon + text for right/wrong; ≥ 40px targets; visible focus.
- After building, take screenshots (e2e) and critique: remove one thing.

## Don't (generic "AI-made" tells)

All-caps or letter-spaced eyebrow labels · "A · B" middle-dot strings ·
"Name — fragment" labels (sides are "Humerus (left)") · arrows on buttons ·
grids of identical rounded cards · big-number + small-label stat tiles ·
icon-title-blurb feature grids · decorative gradients · dark theme · extra
accent colours · borders on every box · scattered entrance animations.

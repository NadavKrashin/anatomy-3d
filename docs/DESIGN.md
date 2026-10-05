# Design direction

Applies to every UI change. Written following Anthropic's _frontend-design_
guidance (plan → review against generic defaults → build → critique with
screenshots).

## Subject

A study tool for a medical student learning anatomy from 3D models. Its
visual world is the **anatomical atlas** (Netter, Gray's, Sobotta plates):
specimens drawn on a pale ground, colour-coded tissues, thin leader lines
running from a structure to its name, a legend explaining the colours, and
a contents page. The interface should feel like a well-made atlas that
happens to be interactive — calm, precise, quietly confident — not a dark
sci-fi HUD or a SaaS dashboard.

## Tokens

Colour (light "plate" theme; the model's tissue colours are the main colour
on screen, the UI stays out of their way):

| Token      | Hex       | Use                                                                                                                                                                                                                        |
| ---------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plate`    | `#E9EDEF` | page and viewer ground — cool clinical grey, not cream                                                                                                                                                                     |
| `sheet`    | `#FBFCFC` | panels and surfaces                                                                                                                                                                                                        |
| `ink`      | `#18222D` | primary text — deep slate, not black                                                                                                                                                                                       |
| `graphite` | `#56616D` | secondary text                                                                                                                                                                                                             |
| `rule`     | `#D3D9DE` | hairlines, dividers                                                                                                                                                                                                        |
| `scrub`    | `#0B7A75` | the one accent — surgical-scrub teal. Chosen because it is the one hue the tissue palette doesn't use (arteries red, veins blue, nerves yellow, bone ivory, muscle red). Used for selection, focus and the primary action. |

Feedback: correct `#1F7A4D` (with ✓ icon + text), incorrect `#B3261E`
(with ✕ icon + text). Never colour alone.

Attachments (origin/insertion patches and their key,
`components/anatomy/attachmentColors.ts`): origin violet `#7A4FB3`,
insertion amber `#D9822B`, unconfirmed slate `#6F7A85` — outside the tissue
palette and the teal selection; always paired with a text label.

Type:

- **Frank Ruhl Libre** (serif, Hebrew + Latin) — structure names, page
  titles, the wordmark. It is a book face; it makes names read like atlas
  labels.
- **IBM Plex Sans Hebrew** (sans, Hebrew + Latin) — UI, body text, data.
  Clinical, technical, clearly different from the serif.
- Scale: 13 / 15 / 17 / 21 / 28 / 40 px. Sentence case everywhere. No
  all-caps labels, no letter-spaced eyebrows.

Shape & depth: panels have a 16px radius and a soft, wide shadow instead of
borders; controls inside panels are borderless. Pills (fully rounded) only
for the primary action and segmented choices. Hairline rules separate list
rows — lists, not boxes.

## Layout

```
┌───────────────────────────────────────────────────────────────┐
│ אנטומיה      ( search ................ )   Explore Quiz Progress ⚙ │  ← plain header strip on the plate
│                                                               │
│  Legend          [ 3D specimen on the plate ]       ┌────────┐│
│  ● Bones          ·───────── Biceps brachii          │ Name   ││  ← leader label in the 3D view
│  ● Muscles                                           │ (serif)││
│  ○ Nerves   (dimmed = hidden)                        │ facts  ││
│  ● Vessels                                           └────────┘│
│                       ( ⟲  ⌨ )                                 │  ← small capsule toolbar
└───────────────────────────────────────────────────────────────┘
```

Text aligns to the reading start (right in Hebrew). Home is a **contents
page** (regions as a ruled list with counts), not a grid of cards.

## Principles

1. **The specimen is the hero.** UI recedes: light surfaces, no borders,
   minimal chrome.
2. **One memorable device: the leader line.** The selected structure gets an
   atlas-style label in the 3D view — a dot on the structure, a thin line,
   its name in the serif. Everything else stays quiet.
3. **Legend, not settings.** System visibility is presented as the plate's
   colour legend; tapping an entry hides/shows that tissue.
4. **Lists over cards.** Ruled rows (contents, quiz scopes, progress) instead
   of grids of identical boxes.
5. **Plain words.** Sentence case, active verbs, no decorative labels or
   arrows on buttons, no "A · B" strings.

## Review against generic defaults (done before building)

| Generic default                           | Where the old UI had it                   | Now                                                                     |
| ----------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| Near-black background + one bright accent | `#0b0d10` + cyan                          | Pale clinical plate; teal chosen from the tissue palette's gap          |
| ALL-CAPS tracked eyebrows                 | panel section titles, legend title        | Sentence-case serif/sans headings                                       |
| "A · B" meta strings, "Name — fragment"   | "Muscular · Upper limb", "Humerus — left" | "Muscular system, upper limb"; "Humerus (left)"                         |
| Glowing-dot ALL-CAPS wordmark             | "● ANATOMY"                               | Serif wordmark "אנטומיה" / "Anatomy"                                    |
| Identical rounded boxes for everything    | every button, panel, card                 | Borderless controls, pills only for primary/segmented, lists with rules |
| Icon + title + blurb feature grid         | home page                                 | Removed — the contents list _is_ the page                               |
| "→" on CTAs                               | home CTA                                  | Removed                                                                 |
| Big number + small label stat tiles       | progress page                             | A ruled summary list                                                    |

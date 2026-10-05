# Course source — medintzfat.com

Her course's study site: **https://medintzfat.com/anatomy/** ("Med in
Tzfat", an independent student-run site for the Bar-Ilan Faculty of
Medicine in Tzfat; not an official faculty site). First read on 2026-10-05
(session 3). Every item below links back to its page.

## Terms of use — what may live in this repo

The site's terms (https://medintzfat.com/terms/, June 2025) allow
**personal study use** but forbid commercial use, distribution without
attribution, **copying or embedding content "in whole or in part"**, and
rewriting content and presenting it as original. This repo is **public** and
the app is deployed publicly, so:

| Data                                                                                  | Where                                     | Committed? |
| ------------------------------------------------------------------------------------- | ----------------------------------------- | ---------- |
| Syllabus: section, page title, URL                                                    | `data/course/medintzfat/syllabus.json`    | yes        |
| Structure **names** per lab and the past-exam marks (★), with suggested structure ids | `lab-structures.json`                     | yes        |
| Hebrew↔English **term pairs** as the pages write them (candidates)                    | `hebrew-term-candidates.json`             | yes        |
| The site's notes, explanations and page text                                          | `.course-cache/medintzfat/text/*.md`      | **no**     |
| The **586 practice questions** (563 unique) with answers and explanations             | `.course-cache/medintzfat/questions.json` | **no**     |

Names of structures, the syllabus and terminology are facts; the site's
prose, questions and explanations are its authors' work. Before any
question text goes into the app, the user decides (see STATUS → next steps):
ask the site (contact@dorpascal.com) for permission, or link out to the
site's own quizzes, or write our own questions from the structure lists.

## Regenerate

```bash
pip install beautifulsoup4 lxml
npx tsx scripts/course/medintzfat/dump-structures.ts .course-cache/structures.json
python3 scripts/course/medintzfat/extract.py     # ≈75 s on a cold cache
npm run format                                  # the JSON goes through Prettier
```

Downloads (and caches) the 53 anatomy pages and the five question JSON files
the site's quiz widget loads, then writes the committed data and the
git-ignored personal extracts. Delete `.course-cache/medintzfat/html` to
re-download. Needs `medintzfat.com` reachable (it was blocked in session 2
and open in session 3).

## What the site contains

The site's own structure is **6 course sections**: intro, upper limb, thorax,
abdomen & pelvis, lower limb & back, head & neck. They hold 38 lectures and
**9 labs**:

| Lab | Page                                | Topic                                      |
| --- | ----------------------------------- | ------------------------------------------ |
| 1   | https://medintzfat.com/anatomy/lab1 | Upper limb (proximal, distal, hand)        |
| 2   | https://medintzfat.com/anatomy/lab2 | Thorax                                     |
| 3   | https://medintzfat.com/anatomy/lab3 | Anterior abdominal wall, inguinal canal    |
| 4   | https://medintzfat.com/anatomy/lab4 | Peritoneal cavity, abdominal organs        |
| 5   | https://medintzfat.com/anatomy/lab5 | Abdominal organs, blood supply             |
| 6   | https://medintzfat.com/anatomy/lab6 | Posterior abdominal wall, pelvis, perineum |
| 7   | https://medintzfat.com/anatomy/lab7 | Lower limb                                 |
| 8   | https://medintzfat.com/anatomy/lab8 | Back                                       |
| 9   | https://medintzfat.com/anatomy/lab9 | Head and neck                              |

Semester A covers labs 1–2 (upper limb, thorax). Semester B covers labs 3–9.
For semester B the site has a single **structure checklist**:
https://medintzfat.com/anatomy/labs-semester-b. It has 10 regions and **863
rows**. A ★ marks the **279** structures that the site's authors believe
appeared in past exams. The page's markup also records how many times: 150
once, 66 twice, 41 three times, 19 four times and 3 five times
(`pastExams`). There is no such list for labs 1–2, so `lab-structures.json`
takes those labs' structure names from the lab pages themselves (headings,
bold text, first table column).

Practice questions are all multiple choice, one correct answer:

- the lab 1 and lab 2 pages: 68 and 46
- the upper limb and thorax quizzes: 42 and 37
- abdomen: 39 (JSON file) and 118 inline
- lower limb and back: 118
- head and neck: 118 (includes the back and spine)

That makes 586 questions, 563 of them unique. Some repeat across pages.

## Findings that matter for the app

- **The course names structures in English.** Every row of the semester-B
  checklist is English (TA-style, e.g. "Sartorius m.", "Hepatic portal
  vein"). The pages are Hebrew prose with English names inline. For
  example, "Ulnar nerve" appears ~31 times. When Hebrew is used it is
  mostly the **transliteration**: העצב האולנרי, העצב הרדיאלי, העצב
  המדיאני. The Hebrew Academy forms (עצב הגומד, עצב החישור) never appear.
  Bones are the exception: עצם השכמה, עצם הבריח, עצם הזרוע and עצם הירך
  do appear. This supports the current default (English primary, Hebrew
  secondary). The ulnar/radial nerve note is in `CONTENT_REVIEW.md`.
- **Coverage against the model.** The exact-name matcher suggests a
  structure id for **299 of 863** semester-B rows and 624 of 1,889 lab-page
  names. Most of the remaining rows are bony landmarks and surfaces (e.g.
  "Superior & Inferior nuchal line"), spaces, folds and fasciae that the
  model has no mesh for. Others are named differently in Z-Anatomy and need
  a manual mapping. Suggested ids are side-less: append `-left`/`-right`
  for paired structures. They are **unreviewed**.
- **Hebrew term candidates are noisy.** There are 815 pairs. 327 are
  flagged `likelyTerm`: the Hebrew starts with an anatomical noun, or the
  pair recurs. Many pairs are not translations at all, e.g. "Dorsal |
  אבדוקציה", where the parentheses held an aside. Use them only as leads
  for a reviewer. Never import them as verified names.

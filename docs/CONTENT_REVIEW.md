# Content review checklist

Every anatomical term and fact in the app should be checked by a person
against the course's required resources. Mark a term `verified: true` (and set
`source`) in `src/data/anatomy/content/concepts.ts` once checked (the
`withConcept` helper currently marks all curated terms unverified — add a
`verified` field per term there when the first terms are checked).

Suggested references:

- Course lecture slides / syllabus (the final authority for exams)
- Terminologia Anatomica (Latin / English)
- Academy of the Hebrew Language — anatomy terms: https://terms.hebrew-academy.org.il

## Hebrew terms needing review (shared curated concepts)

Source: `src/data/anatomy/content/concepts.ts` — used by both the demo and the
Z-Anatomy datasets. The other ~560 Z-Anatomy structures have no Hebrew name yet
(they show English; the dataset validator reports them as warnings).

| Structure       | Hebrew (current)        | Aliases        | Notes                           |
| --------------- | ----------------------- | -------------- | ------------------------------- |
| Skull           | גולגולת                 |                |                                 |
| Scapula         | עצם השכמה               |                | added with the Z-Anatomy model  |
| Clavicle        | עצם הבריח               |                | added with the Z-Anatomy model  |
| Humerus         | עצם הזרוע               |                |                                 |
| Radius          | עצם החישור              |                |                                 |
| Ulna            | עצם הגומד               |                |                                 |
| Femur           | עצם הירך                |                |                                 |
| Biceps brachii  | השריר הדו־ראשי של הזרוע | דו ראשי, ביספס |                                 |
| Median nerve    | העצב המדיאני            |                | Academy term may differ — check |
| Ulnar nerve     | עצב הגומד               | העצב האולנרי   | which form does the course use? |
| Radial nerve    | עצב החישור              | העצב הרדיאלי   | which form does the course use? |
| Brachial artery | עורק הזרוע              | העורק הברכיאלי |                                 |
| Heart           | לב                      |                |                                 |
| Lung            | ריאה                    |                |                                 |
| Liver           | כבד                     |                |                                 |

### What her course writes (medintzfat.com, read 2026-10-05)

From `docs/COURSE_SOURCE.md` (counts over all 53 anatomy pages): the course
names structures **in English** (Ulnar/Radial/Median nerve ≈ 30 times each);
its Hebrew, when used, is the transliteration — **העצב האולנרי**, **העצב
הרדיאלי**, **העצב המדיאני** — while **עצב הגומד / עצב החישור / עצם הגומד /
עצם החישור never appear**. Bones it does name in Hebrew: עצם השכמה, עצם
הבריח, עצם הזרוע, עצם הירך (as in the table above). A reviewer should decide
whether the curated nerve names switch to the transliterated forms (now
aliases).

More Hebrew↔English pairs as the course writes them:
`data/course/medintzfat/hebrew-term-candidates.json` (815 candidates, each
with its pages; noisy — leads for a reviewer, never imported as verified).

Z-Anatomy English names come from the atlas itself (TA-based English).
English/Latin names and the medical details (function, origin, insertion,
innervation, blood supply, clinical notes) are standard textbook anatomy but
also still `verified: false`.

## Origins & insertions (attachment patches)

Source: Z-Anatomy attachment patches → `src/data/anatomy/z-anatomy/attachments.json`
(kinds from the source). All are unverified. Check the shown kind and bone
for each muscle against the course material.

UI terms to confirm with the course: **מוצא** (origin) and **אחיזה**
(insertion) — currently shown with the English term in parentheses
(`messages.he.ts → attachments`).

Muscles shown as "attachment — origin or insertion not confirmed" because
the source's labels contradict standard descriptions
(`KIND_UNDER_REVIEW` in `src/data/anatomy/z-anatomy/attachments.ts`; once a
reviewer confirms the correct kinds, record them there instead of the
demotion):

| Muscle                                                                                                                        | Why                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Serratus anterior                                                                                                             | ribs labelled insertion, scapula labelled origin (standard: the reverse)                               |
| Pectoralis minor                                                                                                              | ribs 3–5 labelled insertion, scapula origin (standard: the reverse)                                    |
| Subclavius                                                                                                                    | clavicle labelled origin (standard: first rib origin, clavicle insertion)                              |
| Latissimus dorsi                                                                                                              | scapula patch labelled insertion (standard insertion: humerus)                                         |
| Trapezius (descending, transverse, ascending parts)                                                                           | origin/insertion bones don't match the parts' standard attachments                                     |
| Extensor carpi ulnaris                                                                                                        | insertion on the triquetrum (standard: base of the 5th metacarpal)                                     |
| Deep head of flexor pollicis brevis                                                                                           | origin on the 1st metacarpal (standard: trapezoid/capitate)                                            |
| Scalenus anterior / medius / posterior                                                                                        | first rib labelled origin, cervical vertebrae insertion (standard: the reverse)                        |
| Thyrohyoid                                                                                                                    | hyoid labelled origin (standard: thyroid cartilage origin, hyoid insertion)                            |
| Longus capitis; rectus capitis anterior / lateralis / posterior major / posterior minor; obliquus capitis superior / inferior | the cranial end labelled origin (standard: the reverse)                                                |
| Rectus abdominis                                                                                                              | costal cartilage labelled origin (standard: pubis origin, costal cartilages 5–7 and xiphoid insertion) |
| External / internal abdominal oblique                                                                                         | rib and iliac attachments labelled the wrong way round                                                 |
| Lateral pterygoid                                                                                                             | origin on maxilla/palatine (standard: sphenoid)                                                        |
| Procerus, frontalis                                                                                                           | bony "origin" on the frontal bone doesn't fit the standard description                                 |
| Extensor hallucis longus                                                                                                      | insertion on the proximal phalanx (standard: distal phalanx of the hallux)                             |
| Lateral head of flexor hallucis brevis                                                                                        | origin on the 1st metatarsal (standard: cuboid / lateral cuneiform)                                    |

Also unclassified by the source itself (suffix and material disagree): long
head of triceps (scapula), sternocostal head of pectoralis major (sternum,
costal cartilages), part of adductor pollicis (capitate).

## Whole body — classifications to check

- **Organ → system** (`VISCERAL_SYSTEMS` in `scripts/anatomy/z-anatomy/export_glb.py`):
  pharynx parts are filed under digestive (nasopharynx under respiratory),
  the epiglottis under respiratory, salivary glands under digestive, the
  spleen/thymus/tonsils under lymphatic.
- **Regions** of organs and midline structures are assigned by height against
  skeletal landmarks (e.g. the liver and stomach → abdomen, the thyroid →
  neck). Adjust in the export if the course divides regions differently.
- The model is male; no kidneys or inner ear (licences), no female organs.
- **Organ wholes** (`ORGAN_GROUPS` in the export) are named after Z-Anatomy's
  groups: Heart, Lung, Frontal/Parietal/Temporal/Occipital/Limbic lobe,
  Insula, Cerebellum, Brainstem, Diencephalon, Spinal cord, Eyeball, Colon,
  Small intestine, Pharynx, Hypophysis, Thymus, Penis — check membership
  (e.g. the source puts the duodenum and jejunum, but no ileum, in the small
  intestine).

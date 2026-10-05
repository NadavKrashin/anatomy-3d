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

Z-Anatomy English names come from the atlas itself (TA-based English).
English/Latin names and the medical details (function, origin, insertion,
innervation, blood supply, clinical notes) are standard textbook anatomy but
also still `verified: false`.

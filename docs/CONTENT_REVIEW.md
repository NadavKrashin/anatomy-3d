# Content review checklist

Every anatomical term and fact in the app should be checked by a person
against the course's required resources. Mark a term `verified: true` (and set
`source`) in `src/data/anatomy/<dataset>/structures.ts` once checked.

Suggested references:

- Course lecture slides / syllabus (the final authority for exams)
- Terminologia Anatomica (Latin / English)
- Academy of the Hebrew Language — anatomy terms: https://terms.hebrew-academy.org.il

## Demo dataset — Hebrew terms needing review

| Structure       | Hebrew (current)        | Aliases        | Notes                           |
| --------------- | ----------------------- | -------------- | ------------------------------- |
| Skull           | גולגולת                 |                |                                 |
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

English/Latin names and the medical details (function, origin, insertion,
innervation, blood supply, clinical notes) are standard textbook anatomy but
also still `verified: false`.

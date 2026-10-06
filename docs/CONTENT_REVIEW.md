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

## Structure names (from her course site)

The user's decision (2026-10-05): **names are shown exactly as her course
site writes them** (https://medintzfat.com/anatomy/). See
`docs/COURSE_SOURCE.md` → "Course names" for how they are matched.

- **English:** 581 of 1,576 structures carry the course's English name
  (`src/data/anatomy/z-anatomy/courseNames.json`, with the page it comes
  from). The rest keep the Z-Anatomy name: the course never names them, or
  only in a form that would be ambiguous. To check: that each course name
  went to the right structure. Synonyms that were matched by hand are in
  `scripts/course/medintzfat/synonyms.json`.
- **Hebrew:** the course writes structure names in English. It uses Hebrew
  only occasionally, mostly as transliterations: העצב האולנרי, never עצב
  הגומד; רדיוס and אולנה, never עצם החישור or עצם הגומד. So only the
  structures below show a Hebrew name: 71 as the site writes them, plus 40
  from her own summary, which wins where both exist. The earlier
  curated Hebrew names (`concepts.ts`) are kept as search aliases. They are
  no longer shown for structures the course names in English only (e.g.
  עורק הזרוע).

### Hebrew names from her summary (shown — they win over the site's)

From her own anatomy summary (`docs/COURSE_SOURCE.md` → "Her summary"):
the organ guide's headings, without the definite article and in the
singular for one-sided structures (`scripts/course/summary/synonyms.json` →
`hebrew`). Where the site's form differs it stays searchable.

| Structure           | Hebrew shown          | Her heading           | The site's form |
| ------------------- | --------------------- | --------------------- | --------------- |
| Atrium              | עלייה שמאלית          | העלייה השמאלית        |                 |
| Atrium              | עלייה ימנית           | העלייה הימנית         |                 |
| Colon               | כרכשת                 | הכרכשת                |                 |
| Diaphragm           | סרעפת                 | הסרעפת                | סרעפת           |
| Ductus deferens     | צינור הזרע            | צינור הזרע            |                 |
| Duodenum            | תריסריון              | התריסריון             | תריסריון        |
| Epididymis          | יותרת האשך            | יותרת האשך            | יותרת האשך      |
| Epiglottis          | מכסה הגרון            | מכסה הגרון            |                 |
| Esophagus           | ושט                   | הוושט                 | ושט             |
| Eyeball             | עין                   | העין                  |                 |
| Gallbladder         | כיס המרה              | כיס המרה              | כיס המרה        |
| Heart               | לב                    | הלב                   | לב              |
| Hypophysis          | יותרת המוח            | יותרת המוח            |                 |
| Jejunum             | מעי ריק               | המעי הריק             |                 |
| Kidney              | כליה                  | הכליות                |                 |
| Lacrimal gland      | בלוטת הדמעות          | בלוטת הדמעות          |                 |
| Liver               | כבד                   | הכבד                  | כבד             |
| Palatine tonsil     | שקד                   | השקדים                |                 |
| Pancreas            | לבלב                  | הלבלב                 | לבלב            |
| Parotid gland       | בלוטת הפרוטיד         | בלוטת הפרוטיד         |                 |
| Penis               | פין                   | הפין                  |                 |
| Pharynx             | לוע                   | הלוע                  | לוע             |
| Prostate            | ערמונית               | הערמונית              |                 |
| Seminal vesicle     | שלפוחית הזרע          | שלפוחיות הזרע         |                 |
| Spinal cord         | חוט השדרה             | חוט השדרה             | חוט השדרה       |
| Spleen              | טחול                  | הטחול                 | טחול            |
| Stomach             | קיבה                  | הקיבה                 | קיבה            |
| Sublingual gland    | בלוטת הרוק התת־לשונית | בלוטת הרוק התת־לשונית |                 |
| Submandibular gland | בלוטת הרוק התת־לסתית  | בלוטת הרוק התת־לסתית  |                 |
| Suprarenal gland    | בלוטת יותרת הכליה     | בלוטות יותרת הכליה    |                 |
| Testis              | אשך                   | האשכים                |                 |
| Thymus              | תימוס                 | התימוס                |                 |
| Thyroid gland       | בלוטת התריס           | בלוטת התריס           | בלוטת התריס     |
| Tongue              | לשון                  | הלשון                 |                 |
| Trachea             | קנה הנשימה            | קנה הנשימה            | טרכיאה          |
| Ureter              | שופכן                 | השופכנים              | צינור הכליה     |
| Urethra             | שופכה                 | השופכה                |                 |
| Urinary bladder     | שלפוחית השתן          | שלפוחית השתן          |                 |
| Ventricle           | חדר שמאלי             | החדר השמאלי           |                 |
| Ventricle           | חדר ימני              | החדר הימני            |                 |
| Vermiform appendix  | תוספתן                | התוספתן               | תוספתן          |

### Hebrew names shown from the course site (as it writes them — please check)

Source of truth: `scripts/course/medintzfat/hebrew-names.json`. Niqqud and
the definite article are kept where the course writes them that way.

| Structure (course English)   | Hebrew                       | Page                                                                                        |
| ---------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------- |
| Adductor pollicis            | מקרב האגודל                  | [lab1](https://medintzfat.com/anatomy/lab1)                                                 |
| Aortic arch                  | קשת האאורטה                  | [lab2](https://medintzfat.com/anatomy/lab2)                                                 |
| Auditory tube                | חצוצרת השמע                  | [ear](https://medintzfat.com/anatomy/ear)                                                   |
| Biceps brachii               | הַשְּׁרִיר הַדוּ-רֹאשִׁי     | [class6](https://medintzfat.com/anatomy/class6)                                             |
| Bile duct                    | צינור המרה                   | [lab5](https://medintzfat.com/anatomy/lab5)                                                 |
| Calcaneus                    | עצם הקלקנאוס                 | [lower-limb-part5](https://medintzfat.com/anatomy/lower-limb-part5)                         |
| Clavicle                     | עצם הבריח                    | [class5](https://medintzfat.com/anatomy/class5)                                             |
| Coccyx                       | עצם הזנב                     | [lab6](https://medintzfat.com/anatomy/lab6)                                                 |
| Coracobrachialis             | קורקו ברכיאלי                | [class6](https://medintzfat.com/anatomy/class6)                                             |
| Diaphragm                    | סרעפת                        | [respiratory-system](https://medintzfat.com/anatomy/respiratory-system)                     |
| Duodenum                     | תריסריון                     | [labs-semester-b](https://medintzfat.com/anatomy/labs-semester-b)                           |
| Ejaculatory duct             | צינור השפיכה                 | [lab6](https://medintzfat.com/anatomy/lab6)                                                 |
| Epididymis                   | יותרת האשך                   | [lab3](https://medintzfat.com/anatomy/lab3)                                                 |
| Erector spinae               | זוקפי הגב                    | [back-and-spine](https://medintzfat.com/anatomy/back-and-spine)                             |
| Esophagus                    | ושט                          | [thorax-part2](https://medintzfat.com/anatomy/thorax-part2)                                 |
| Ethmoid                      | עצם האתמואיד                 | [skull-cranial-nerves](https://medintzfat.com/anatomy/skull-cranial-nerves)                 |
| External intercostals        | בין צלעי חיצוני              | [thorax-part1](https://medintzfat.com/anatomy/thorax-part1)                                 |
| Femur                        | עצם הירך                     | [lab7](https://medintzfat.com/anatomy/lab7)                                                 |
| Frontal bone                 | העצם הפרונטלית               | [skull-cranial-nerves](https://medintzfat.com/anatomy/skull-cranial-nerves)                 |
| Gallbladder                  | כיס המרה                     | [lab4](https://medintzfat.com/anatomy/lab4)                                                 |
| Heart                        | לב                           | [xray-ct-basics](https://medintzfat.com/anatomy/xray-ct-basics)                             |
| Hepatic portal vein          | הווריד הפורטלי               | [lab5](https://medintzfat.com/anatomy/lab5)                                                 |
| Humerus                      | עצם הזרוע                    | [class5](https://medintzfat.com/anatomy/class5)                                             |
| Inguinal ligament            | רצועת המפשעה                 | [lab3](https://medintzfat.com/anatomy/lab3)                                                 |
| Internal intercostal muscles | בין צלעי פנימי               | [thorax-part1](https://medintzfat.com/anatomy/thorax-part1)                                 |
| Internal thoracic artery     | עורק החזה הפנימי             | [thorax-part1](https://medintzfat.com/anatomy/thorax-part1)                                 |
| Lacrimal bone                | עצם הדמעות                   | [skull-cranial-nerves](https://medintzfat.com/anatomy/skull-cranial-nerves)                 |
| Levator scapulae             | מֵרִים הַשֶּׁכֶם             | [class6](https://medintzfat.com/anatomy/class6)                                             |
| Linea alba                   | הקו הלבן                     | [lab3](https://medintzfat.com/anatomy/lab3)                                                 |
| Liver                        | כבד                          | [abdominal-imaging](https://medintzfat.com/anatomy/abdominal-imaging)                       |
| Long thoracic nerve          | עצב ארוך חזה                 | [class6](https://medintzfat.com/anatomy/class6)                                             |
| Lung                         | ריאה                         | [lab2](https://medintzfat.com/anatomy/lab2)                                                 |
| Mandible                     | הלסת התחתונה                 | [skull-cranial-nerves](https://medintzfat.com/anatomy/skull-cranial-nerves)                 |
| Median nerve                 | עצב מדיאני                   | [class7](https://medintzfat.com/anatomy/class7)                                             |
| Occipital bone               | עצם העורף                    | [skull-cranial-nerves](https://medintzfat.com/anatomy/skull-cranial-nerves)                 |
| Pancreas                     | לבלב                         | [quiz-abdomen](https://medintzfat.com/anatomy/quiz-abdomen)                                 |
| Patella                      | פיקה                         | [lab7](https://medintzfat.com/anatomy/lab7)                                                 |
| Pectoralis major             | שְׁרִיר הֶחָזֶה הַגָּדוֹל    | [class6](https://medintzfat.com/anatomy/class6)                                             |
| Pectoralis minor             | החזה הקטן                    | [class6](https://medintzfat.com/anatomy/class6)                                             |
| Pharynx                      | לוע                          | [labs-semester-b](https://medintzfat.com/anatomy/labs-semester-b)                           |
| Platysma                     | פלטיזמה                      | [neck](https://medintzfat.com/anatomy/neck)                                                 |
| Pudendal nerve               | העצב הפודנדלי                | [pelvis-male](https://medintzfat.com/anatomy/pelvis-male)                                   |
| Quadriceps femoris           | הארבע ראשי                   | [lower-limb-part2](https://medintzfat.com/anatomy/lower-limb-part2)                         |
| Radial nerve                 | העצב הרדיאלי                 | [class8](https://medintzfat.com/anatomy/class8)                                             |
| Radius                       | רדיוס                        | [class3](https://medintzfat.com/anatomy/class3)                                             |
| Renal artery                 | עורק הכליה                   | [lab6](https://medintzfat.com/anatomy/lab6)                                                 |
| Sacrum                       | עצם העצה                     | [pelvis](https://medintzfat.com/anatomy/pelvis)                                             |
| Sartorius                    | שריר החייטים                 | [lower-limb-part1](https://medintzfat.com/anatomy/lower-limb-part1)                         |
| Scapula                      | עצם השכמה                    | [lab1](https://medintzfat.com/anatomy/lab1)                                                 |
| Small intestine              | מעי דק                       | [abdominal-imaging](https://medintzfat.com/anatomy/abdominal-imaging)                       |
| Sphenoid                     | עצם הספנואיד                 | [skull-cranial-nerves](https://medintzfat.com/anatomy/skull-cranial-nerves)                 |
| Spinal cord                  | חוט השדרה                    | [class1](https://medintzfat.com/anatomy/class1)                                             |
| Spleen                       | טחול                         | [labs-semester-b](https://medintzfat.com/anatomy/labs-semester-b)                           |
| Stomach                      | קיבה                         | [quiz-abdomen](https://medintzfat.com/anatomy/quiz-abdomen)                                 |
| Sympathetic trunk            | השרשרת הסימפתטית             | [lab2](https://medintzfat.com/anatomy/lab2)                                                 |
| Talus                        | עצם הטלוס                    | [lower-limb-part5](https://medintzfat.com/anatomy/lower-limb-part5)                         |
| Temporal bone                | העצם הטמפורלית               | [lab9](https://medintzfat.com/anatomy/lab9)                                                 |
| Teres major                  | הַשְּׁרִיר הֶעָגֹל הַגָּדוֹל | [class6](https://medintzfat.com/anatomy/class6)                                             |
| Teres minor                  | הַשְּׁרִיר הֶעָגֹל הַקָּטָן  | [class6](https://medintzfat.com/anatomy/class6)                                             |
| Thalamus                     | תלמוס                        | [class1](https://medintzfat.com/anatomy/class1)                                             |
| Thyroid gland                | בלוטת התריס                  | [lab9](https://medintzfat.com/anatomy/lab9)                                                 |
| Trachea                      | טרכיאה                       | [thorax-part2](https://medintzfat.com/anatomy/thorax-part2)                                 |
| Transverse colon             | מעי גס חוצה                  | [quiz-abdomen](https://medintzfat.com/anatomy/quiz-abdomen)                                 |
| Triceps brachii              | תלת ראשי                     | [class6](https://medintzfat.com/anatomy/class6)                                             |
| Tympanic membrane            | עור התוף                     | [ear](https://medintzfat.com/anatomy/ear)                                                   |
| Ulna                         | אולנה                        | [class8](https://medintzfat.com/anatomy/class8)                                             |
| Ulnar nerve                  | העצב האולנרי                 | [class8](https://medintzfat.com/anatomy/class8)                                             |
| Ureter                       | צינור הכליה                  | [pelvis](https://medintzfat.com/anatomy/pelvis)                                             |
| Vagus nerve                  | עצב הוואגוס                  | [thorax-autonomic-innervation](https://medintzfat.com/anatomy/thorax-autonomic-innervation) |
| Vermiform appendix           | תוספתן                       | [abdominal-organs](https://medintzfat.com/anatomy/abdominal-organs)                         |
| Xiphoid process              | זיז החרב                     | [thorax-part1](https://medintzfat.com/anatomy/thorax-part1)                                 |

More Hebrew↔English pairs as the course writes them:
`data/course/medintzfat/hebrew-term-candidates.json` (815 candidates, each
with its pages; noisy — leads for a reviewer, never imported as verified).

Z-Anatomy English names (for structures the course does not name) come
from the atlas itself (TA-based English).
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
- The model is male; no female organs. The kidneys and inner ear are in
  (non-commercial licences, `THIRD_PARTY_ASSETS.md`).
- **Organ wholes** (`ORGAN_GROUPS` in the export) are named after Z-Anatomy's
  groups: Heart, Lung, Frontal/Parietal/Temporal/Occipital/Limbic lobe,
  Insula, Cerebellum, Brainstem, Diencephalon, Spinal cord, Eyeball, Colon,
  Small intestine, Pharynx, Hypophysis, Thymus, Penis — check membership
  (e.g. the source puts the duodenum and jejunum, but no ileum, in the small
  intestine).

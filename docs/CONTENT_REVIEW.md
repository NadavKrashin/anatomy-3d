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
| Anal canal          | תעלה אנאלית           | התעלה האנאלית         |                 |
| Atrium              | עלייה שמאלית          | העלייה השמאלית        |                 |
| Atrium              | עלייה ימנית           | העלייה הימנית         |                 |
| Breast              | שד                    | השד                   |                 |
| Cervix of uterus    | צוואר הרחם            | צוואר הרחם            |                 |
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
| Ovary               | שחלה                  | השחלות                |                 |
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
| Uterine tube        | חצוצרה                | החצוצרות              |                 |
| Uterus              | רחם                   | הרחם                  |                 |
| Vagina              | נרתיק                 | הנרתיק                |                 |
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
- **Swapped sides fixed (2026-10-06 audit):** Z-Anatomy's lateral
  temporomandibular ligament and the Atlas's round ligaments of the uterus
  had left and right swapped; please confirm on the model.
- **Rectum:** Z-Anatomy labels the rectum "Sigmoid colon"; the app shows it
  as "Rectum" (`RELABEL` in `z-anatomy/build.ts`, reasons in
  `docs/DECISIONS.md`). The sigmoid loop is inside Z-Anatomy's "Descending
  colon" mesh, so there is no separate sigmoid colon. Please confirm on the
  model.
- BodyParts3D pieces use its English names ("Supra-orbital nerve",
  "Gastro-omental artery (right)", "Anterior cardiac veins"…), unverified.
- The model is male; the female body (settings) adds the Human Reference
  Atlas's female organs with their own English names (e.g. "Lower uterine
  segment", "Cornua of uterus", "Fundus/Dome of urinary bladder",
  "Areolar tubercles") — please check them; all `verified: false`. The
  inner ear is in (non-commercial licence, `THIRD_PARTY_ASSETS.md`).
- **Kidneys** (2026-10-08) are the Human Reference Atlas's (male, both
  bodies), parts of the whole "Kidney": "Fibrous capsule of kidney", "Renal
  cortex", "Renal columns", "Renal pyramids", "Renal papillae", "Hilum of
  kidney", "Minor calyces", "Major calyces", "Renal pelvis" (English names
  chosen here, `verified: false`). The old kidney's "Intrarenal arteries /
  veins" have no Atlas counterpart and are gone; the renal vein's hilar end
  is part of the renal vein.
- **Organ wholes** (`ORGAN_GROUPS` in the export) are named after Z-Anatomy's
  groups: Heart, Lung, Frontal/Parietal/Temporal/Occipital/Limbic lobe,
  Insula, Cerebellum, Brainstem, Diencephalon, Spinal cord, Eyeball, Colon,
  Small intestine, Pharynx, Hypophysis, Thymus, Penis — check membership
  (e.g. the source puts the duodenum and jejunum, but no ileum, in the small
  intestine).

## Hand-built structures — schematic, please check

Built by hand (`scripts/anatomy/handmade/`, `docs/DECISIONS.md` →
"Hand-built structures"): **schematic in shape, placed from landmarks of our
model** — please check the course of each against her atlas. English names
only (no Hebrew added), all `verified: false`.

| Name (as in the app)                                                                                                                                        | Course to check                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phrenic nerve (left, right)                                                                                                                                 | C3–C5 roots joining at the lateral border of scalenus anterior; on the muscle; between subclavian artery and vein; right beside the brachiocephalic vein, SVC, right atrium; left over the arch and the left ventricle; ends on the diaphragm                  |
| Left / Right recurrent laryngeal nerve                                                                                                                      | right hooks round the subclavian artery's first part (in front, under, behind) lateral to the brachiocephalic bifurcation, left under the arch beside the ligamentum arteriosum; up the tracheo-oesophageal groove to the posterior crico-arytenoid            |
| Superior laryngeal nerve; internal / external branch of superior laryngeal nerve                                                                            | from the vagus high in the neck, medial to the carotids; internal branch through the thyrohyoid membrane; external branch on the inferior constrictor to cricothyroid                                                                                          |
| Ansa cervicalis (superior root, inferior root, loop, muscular branches)                                                                                     | superior root from the hypoglossal on the carotid sheath; inferior root round the IJV's lateral side; loop at the cricoid level; twigs to the infrahyoid muscles                                                                                               |
| Lesser occipital, great auricular, transverse cervical nerves; supraclavicular nerves                                                                       | emerging together at the midpoint of the SCM's posterior border; the lobe of the ear is approximated (the model has no auricle)                                                                                                                                |
| Superior thyroid artery; superior laryngeal artery                                                                                                          | first branch of the external carotid to the thyroid's upper pole (anterior and posterior glandular branches); laryngeal artery with the internal laryngeal nerve                                                                                               |
| Thoracic duct; cisterna chyli                                                                                                                               | cisterna at L1–L2 (smaller than typical: no room in the model); duct through the aortic hiatus, between aorta and azygos, crossing left at T5–T6, arching at C7 to the left venous angle                                                                       |
| Cystic artery                                                                                                                                               | from the hepatic artery beside the gallbladder neck (the model has no separate right hepatic artery); superficial and deep branches                                                                                                                            |
| Short gastric arteries                                                                                                                                      | four vessels from the splenic hilum to the fundus                                                                                                                                                                                                              |
| Perineal body; superficial / deep transverse perineal muscle                                                                                                | node 12 mm in front of the external anal sphincter; bands from the ischial tuberosity / ischiopubic ramus to it                                                                                                                                                |
| External urethral sphincter (male ring; female: sphincter urethrae, compressor urethrae, urethrovaginal sphincter)                                          | male round the membranous urethra; female round the urethra's course (the female urethra itself is not built yet)                                                                                                                                              |
| Bulbospongiosus (male one muscle; female left and right); ischiocavernosus (left, right)                                                                    | male from the perineal body over the bulb, and along the crura from the ischial tuberosities; female where the vestibular bulbs and the clitoris' crura belong (not built yet)                                                                                 |
| Anal canal; internal anal sphincter                                                                                                                         | along the external sphincter's axis from the rectum's lower end; narrower than typical (the model's sphincter ring is small)                                                                                                                                   |
| Pericardiacophrenic artery and vein (left, right)                                                                                                           | from the internal thoracic vessels near the thoracic inlet, then alongside the phrenic nerve (artery behind, vein in front) to the diaphragm                                                                                                                   |
| Subcostal nerve (left, right)                                                                                                                               | T12–L1 foramen, under the 12th rib below the subcostal vessels, in front of quadratus lumborum, then between transversus abdominis and the internal oblique to the rectus' lateral border halfway between umbilicus and pubis                                  |
| Greater pancreatic artery                                                                                                                                   | from the splenic artery at the pancreas' body–tail junction, down the back of the gland into it                                                                                                                                                                |
| Lingual artery (left, right)                                                                                                                                | from the external carotid at the hyoid horn's tip, a loop over the horn, deep to hyoglossus, on as the deep lingual artery lateral to genioglossus                                                                                                             |
| Posterior auricular artery (left, right)                                                                                                                    | from the back of the external carotid above the digastric, up between the (unmodelled) auricle and the mastoid beside the posterior auricular vein                                                                                                             |
| Suboccipital nerve (left, right)                                                                                                                            | between the occipital bone and the atlas' posterior arch under the vertebral artery, into the suboccipital triangle, twigs to the recti, obliques and semispinalis capitis                                                                                     |
| Infra-orbital nerve; nerve to vastus medialis (left, right)                                                                                                 | cut out of Z-Anatomy's maxillary nerve (in front of the inferior orbital fissure) and femoral nerve (below its division): check where the cut falls                                                                                                            |
| Bulbourethral glands (male, left, right)                                                                                                                    | posterolateral to the membranous urethra in the external sphincter; ducts forward into the bulb                                                                                                                                                                |
| Cremaster (male, left, right)                                                                                                                               | open loops round the spermatic cord from below the superficial ring to the testis                                                                                                                                                                              |
| Urethra (female)                                                                                                                                            | from the bladder neck down in front of the vagina to in front of the vaginal opening (nearly vertical in this model)                                                                                                                                           |
| Clitoris (glans, body, crura); suspensory ligament; bulbs of the vestibule; greater vestibular glands; vaginal vestibule; labia minora / majora; mons pubis | placed by the bones (user): crura on the ischiopubic rami, angle below the symphysis, glans at the vestibule's front; bulbs beside the vaginal orifice; glands at the bulbs' back ends; the vestibule is longer than typical (the fitted vagina sits far back) |
| Tensor tympani (left, right)                                                                                                                                | belly above the auditory tube, then (model: the tube stops short of the middle ear) forward round the cochlea and back along the cavity's anterior wall to the cochleariform process; tendon laterally to the malleus' handle                                  |
| Stapedius (left, right)                                                                                                                                     | belly beside (medial to) the facial nerve's descending segment in the posterior wall; tendon forward from the pyramidal eminence to the neck of the stapes                                                                                                     |
| Subcostal muscles (left, right)                                                                                                                             | four slips on the inner posterior wall near the rib angles: ribs 7→9, 8→10, 9→11, 10→12, running down and medially                                                                                                                                             |
| Scrotum; septum of scrotum (male)                                                                                                                           | 2 mm sack round both testes and epididymides, closed over its root by a low dome the cords pass through; midline septum between the two compartments                                                                                                           |

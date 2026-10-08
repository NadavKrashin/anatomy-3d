# Extra 3D model sources (research, 2026-10-06)

The user asked for 3D models to fill what our Z-Anatomy model lacks. The
gaps are mostly those found through her summary (`.course-cache/summary/unmatched.json`,
183 entries after `parents.json`): female organs, the kidneys, some nerves
and vessels (phrenic, cervical plexus, laryngeal, thoracic duct, small
gastric/pancreatic arteries), perineal muscles, and soft tissue.

Every source below was checked at its primary source on 2026-10-06:

- its licence;
- its contents, by listing the node or part names in the actual files;
- whether it lines up with our body, by comparing bones present in both.

**Licence rule:** CC BY / CC BY-SA / CC0 sources can be used freely. Since
2026-10-06 the user also allows **non-commercial (NC)** sources (the app is
not commercial); they go into the separate non-commercial model file
(`THIRD_PARTY_ASSETS.md` → "Non-commercial models"). Z-Anatomy's own NC inner
ear is in; its NC kidney was replaced by the Human Reference Atlas kidney
(2026-10-08). The NC sources under "Not usable" below are now candidates;
their contents still need checking.

**Status:** BodyParts3D's missing pieces are integrated (23, 2026-10-06 —
`scripts/anatomy/bodyparts3d/README.md`; its rectum showed Z-Anatomy's
"Sigmoid colon" is the rectum). The Human Reference Atlas female organs are integrated (female
body, 2026-10-06 — `scripts/anatomy/hra/README.md`), and its male kidneys,
calyces and renal pelvis replace the non-commercial kidney in both bodies
(2026-10-08, same README). Open3DModel is integrated (206 meshes, 2026-10-06 — see
`scripts/anatomy/open3dmodel/README.md`). The ~740 count below was before
removing duplicates, coverings and spaces.

## Summary

| Source                                                               | Licence         | Lines up with our body?                                                                       | Fills (from her list)                                                                                                                                                                                                                                                                                                                                                                                                                                     | Effort                                                                                |
| -------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Open3DModel** (AnatomyTOOL, Leiden/Utrecht/Maastricht/Leuven)      | CC BY-SA        | **Yes**: same base and frame as Z-Anatomy (femur, patella, calcaneus, hip bone within ~2 mm)  | Lower limb: inferior gluteal nerve, lumbosacral trunk, sacral/lumbar plexus, psoas minor, articularis genus, nerve roots, femoral/adductor canal, saphenous opening, patellar ligament, pes anserinus. Upper limb: **lateral and medial cords** and divisions of the brachial plexus, roots of the median nerve, nerve branches, flexor/extensor retinacula, tendon sheaths, dorsal scapular artery, coracoclavicular ligaments. ~740 new pieces in total | **Low**: same pipeline; right side only in the upper limb, so mirror for the left     |
| **Human Reference Atlas** (HuBMAP, NIH)                              | CC BY 4.0       | No: Visible Human bodies, so needs per-organ alignment                                        | **Female organs**: uterus (fundus, body, cervix, internal/external os), uterine tubes (ampulla, isthmus, infundibulum, fimbriae), ovaries, mammary gland (nipple, areola, lactiferous ducts, Cooper's ligaments). **Kidney** in detail (capsule, cortex, medulla, pyramids, papillae, renal columns, hilum), renal pelvis, ureter, urinary bladder (trigone, ureteral orifices), larynx cartilages                                                        | Medium: fit each organ to our pelvis/spine (scale + translate), then the usual export |
| **BodyParts3D 4.0** (DBCLS, the base of Z-Anatomy)                   | CC BY-SA 2.1 JP | No: millimetres, Y-axis offset, slightly different scale, and Z-Anatomy remodelled some bones | **Kidney** (a permitted one, unlike Z-Anatomy's NC model), **rectum**, frontal/lacrimal/supra-orbital nerves, right gastric, dorsal pancreatic and superior pancreaticoduodenal arteries, small/anterior cardiac veins, levator veli palatini, semispinalis capitis, skin                                                                                                                                                                                 | Medium: one affine fit from shared bones fits all of it                               |
| **"Inner ear"** (R. van den Berg, Sketchfab)                         | CC BY           | No                                                                                            | Cochlea, vestibular system and semicircular canals with their nerves and vessels; could **replace the NC inner ear**                                                                                                                                                                                                                                                                                                                                      | Medium: one object to fit into the temporal bone                                      |
| **"Bony Pelvis and Pelvic Organs from MRI"** (audreybyrd, Sketchfab) | CC BY           | No                                                                                            | Uterus, cervix, uterine tubes, ovaries, **vagina, vulva**, bladder, rectum, from a real 25-year-old woman's MRI                                                                                                                                                                                                                                                                                                                                           | Medium; overlaps the Human Reference Atlas, adds vagina/vulva                         |
| "Anatomy of the Larynx" (University of Dundee)                       | CC BY-SA 4.0    | No (derived from BodyParts3D)                                                                 | Larynx cartilages, membranes                                                                                                                                                                                                                                                                                                                                                                                                                              | Low value: BodyParts3D has the same                                                   |

**Not usable:**

- Sketchfab "Nerves" (metal_soup): an AR art piece, not labelled anatomy.

## Non-commercial sources, checked 2026-10-06

NC licences are allowed since 2026-10-06. Every NC candidate was checked
(Sketchfab API listings, descriptions, preview images; the viewer's scene
files are obfuscated and were not read). **None fills a gap**, so none was
added:

| Source                                                                                                              | Licence                                   | Contents                                                                                                          | Verdict                                                                                     |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| "Anatomy of the Inner Ear" (Dundee)                                                                                 | CC BY-NC-SA 4.0                           | Inner ear                                                                                                         | Already in, via Z-Anatomy                                                                   |
| "Ligaments of the Female Pelvis" (Dundee, Lissie Cowley)                                                            | CC BY-NC-SA 4.0 (Sketchfab says CC BY)    | Female bony pelvis, lumbar spine, femora; iliolumbar, sacroiliac, sacrotuberous/-spinous, inguinal, hip ligaments | All these ligaments are in Z-Anatomy already; a female pelvis doesn't fit our male skeleton |
| Indiana University School of Medicine, Ruth Lilly Medical Library (`iusmlib`)                                       | CC BY-NC-SA 4.0                           | 6 models: brain lobes, brain half, spine, skull, renal system                                                     | All present; the renal system is BodyParts3D-derived                                        |
| Indiana University Advanced Visualization Lab (`AVL`)                                                               | CC BY or none                             | Scans (thorax/blood volume, skull, protein)                                                                       | Not separable structures                                                                    |
| Cervical nerves model (PMC4145979)                                                                                  | CC BY-NC-SA 3.0 (the article)             | Cervical plexus, phrenic, vagus, recurrent laryngeal shown in figures                                             | **No model file published** (no supplement) — only pictures                                 |
| Dundee "Larynx with Muscles and Ligaments", "Pharynx and Floor of Mouth", "Parapharyngeal Space" (Eve Laws)         | CC BY-NC-SA 4.0                           | Larynx muscles/cartilages; pharynx, floor of mouth; skull base, parotid, styloid muscles, carotid sheath          | Z-Anatomy has these; a CT-based other body would need fitting and duplicate them            |
| Dundee "Lymphatics of head and neck" (School of Dentistry)                                                          | NC-SA on Sketchfab, CC BY-SA in its image | Head/neck lymph nodes and vessels, BodyParts3D-derived                                                            | Licence unclear; lymph nodes already present                                                |
| Dundee "Head and Neck Anatomy for Dentistry"                                                                        | CC BY                                     | Photogrammetry of a wax écorché                                                                                   | One surface, no separate structures                                                         |
| Dundee "3D Pelvic Floor Muscles", "Spinal Cord Anatomy", "Cranial Nerves and Foramina" and most of `anatomy_dundee` | —                                         | —                                                                                                                 | Not downloadable                                                                            |
| Open Anatomy SPL head and neck atlas                                                                                | 3D Slicer licence part B                  | Skull, spine, neck muscles, vessels, glands — no nerves                                                           | Nothing missing from our model                                                              |

The gaps below therefore stay open.

## Still without any open source — built by hand

None of the above has these; since 2026-10-07 they are **built by hand**
(`scripts/anatomy/handmade/`, `docs/HANDMADE_MODELS_PROMPT.md`, schematic,
CC BY-SA 4.0, this project). Priority 1, built: the **phrenic nerve**; the
cervical plexus branches (lesser occipital, great auricular, transverse
cervical, supraclavicular) and the ansa cervicalis; the recurrent and
superior laryngeal nerves; the **thoracic duct** and cisterna chyli; the
cystic, short gastric, superior thyroid and superior laryngeal arteries;
the perineal muscles and body, anal canal and internal anal sphincter.
Priority 2, built: the pericardiacophrenic vessels; the subcostal and
suboccipital nerves; the lingual, posterior auricular and greater
pancreatic arteries; the bulbourethral glands and cremaster; the female
urethra and external genitalia. Not built but cut out of Z-Anatomy meshes
that already contain them: the infra-orbital nerve (from the maxillary
nerve) and the nerve to vastus medialis (from the femoral nerve). Still to
build (priority 3): tensor tympani and stapedius, subcostal muscles,
scrotum.

Open3DModel has head and neck soft tissue and the "spinal cord and
surroundings" planned for 2026, so re-check it: a real model would be
better than a hand-built schematic one and should replace it.

## How to fetch (for the next session)

- Open3DModel: GLB/OBJ/Blender zips at https://anatomytool.org/open3dmodel-create
  (`https://caskanatomy.info/open3dmodelfiles/<model>/<model>-glb.zip`;
  Draco-compressed, so read them with Blender/bpy). Nodes are named like
  Z-Anatomy ("Femur.r").
- Human Reference Atlas: `https://cdn.humanatlas.io/digital-objects/ref-organ/<organ>/latest/graph.json`
  names the GLB, e.g. `.../uterus-female/v1.2/assets/3d-vh-f-uterus.glb`.
  Licence and creators are in https://lod.humanatlas.io/ref-organ/.
- BodyParts3D: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
  (`isa_BP3D_4.0_obj_99.zip`, 136 MB). FMA name → file id is in
  `isa_element_parts.txt`, e.g. rectum FJ2571, right kidney FJ3147.
- Sketchfab models: download needs a (free) account. The licence is in
  `https://api.sketchfab.com/v3/models/<uid>`.

Each source needs a row in `THIRD_PARTY_ASSETS.md` and its attribution in
the app before it ships. CC BY-SA sources keep our model files CC BY-SA.

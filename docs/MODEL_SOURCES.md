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

**Licence rule:** the app is public, so only CC BY / CC BY-SA / CC0 sources
can be used. Non-commercial (NC) licences are out, as with Z-Anatomy's
inner ear and kidney.

**Status:** Open3DModel is integrated (206 meshes, 2026-10-06 — see
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

- "Ligaments of the Female Pelvis" (Dundee): tagged CC BY on Sketchfab but
  its description says CC BY-NC-SA, so treat it as NC.
- "Anatomy of the Inner Ear" (Dundee): CC BY-NC-SA.
- Indiana University School of Medicine collection: CC BY-NC-SA.
- Open Anatomy Project atlases (SPL head and neck, inner ear): 3D Slicer
  licence, not CC.
- Cervical nerves visualisation (PMC4145979): CC BY-NC-SA 3.0.
- Sketchfab "Nerves" (metal_soup): an AR art piece, not labelled anatomy.

## Still without any open source

These are absent from all of the above:

- the **phrenic nerve**;
- the cervical plexus branches (lesser occipital, great auricular,
  transverse cervical, supraclavicular) and the ansa cervicalis;
- the recurrent and superior laryngeal nerves;
- the **thoracic duct**;
- the cystic, short gastric, lingual and superior thyroid arteries;
- the perineal muscles (bulbospongiosus, ischiocavernosus) and the
  cremaster.

Open3DModel has head and neck soft tissue and the "spinal cord and
surroundings" planned for 2026, so re-check it. The other option is
modelling them by hand (a tube along an anatomical path) as our own
CC BY-SA work.

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

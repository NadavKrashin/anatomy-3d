"""
Contact sheets of the hand-built structures' review shots (front and
turned view per row, by region) for a quick look:

    ~/bpyenv/bin/python scripts/anatomy/handmade/contact_sheets.py docs/screenshots/handmade/sheets

The shots come from e2e/handmade-shots.ts.
"""
import sys
from PIL import Image, ImageDraw
from pathlib import Path
D = Path("docs/screenshots/handmade")
GROUPS = {
  "neck-nerves": ["superior-laryngeal-nerve-left", "superior-laryngeal-nerve-right", "ansa-cervicalis-left", "ansa-cervicalis-right",
                  "lesser-occipital-nerve-left", "great-auricular-nerve-left", "transverse-cervical-nerve-left", "supraclavicular-nerves-left"],
  "neck-arteries-thorax": ["superior-thyroid-artery-left", "superior-laryngeal-artery-left", "phrenic-nerve-left", "phrenic-nerve-right",
                           "recurrent-laryngeal-nerve-left", "recurrent-laryngeal-nerve-right", "thoracic-duct"],
  "abdomen": ["cisterna-chyli", "cystic-artery", "short-gastric-arteries"],
  "priority-2": ["pericardiacophrenic-artery-left", "subcostal-nerve-left", "greater-pancreatic-artery",
                 "lingual-artery-left", "posterior-auricular-artery-left", "suboccipital-nerve-left",
                 "infra-orbital-nerve-left", "nerve-to-vastus-medialis-left", "bulbourethral-gland-left",
                 "cremaster-muscle-left"],
  "priority-2-female": ["urethra-female", "clitoris-female", "bulb-of-vestibule-left-female",
                        "greater-vestibular-gland-left-female", "labium-majus-left-female", "mons-pubis-female"],
  "priority-3": ["tensor-tympani-muscle-left", "stapedius-muscle-left", "subcostal-muscles-left", "scrotum",
                 "septum-of-scrotum"],
  "pelvis": ["perineal-body", "superficial-transverse-perineal-muscle-left", "deep-transverse-perineal-muscle-left",
             "external-urethral-sphincter", "bulbospongiosus-muscle", "ischiocavernosus-muscle-left", "anal-canal",
             "internal-anal-sphincter", "perineal-body-female", "external-urethral-sphincter-female",
             "bulbospongiosus-muscle-female", "ischiocavernosus-muscle-left-female"],
}
W, H = 640, 430
for g, ids in GROUPS.items():
    sheet = Image.new("RGB", (2 * W, len(ids) * H), "white")
    for r, i in enumerate(ids):
        for c, v in enumerate(("front", "side")):
            im = Image.open(D / f"{i}-{v}.jpg").convert("RGB").resize((W, H), Image.LANCZOS)
            sheet.paste(im, (c * W, r * H))
    sheet.save(Path(sys.argv[1]) / f"handmade-{g}.jpg", quality=82)
    print(g, sheet.size)

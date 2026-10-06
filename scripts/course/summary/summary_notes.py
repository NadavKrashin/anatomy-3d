"""Turns her anatomy summary (a Word file she wrote herself) into study notes.

    pip install python-docx
    npx tsx scripts/course/medintzfat/dump-structures.ts
    python3 scripts/course/summary/summary_notes.py path/to/summary.docx
    npm run format

The summary has two kinds of entries, both in Hebrew in her own words:
- an organ guide: heading (Hebrew name), a line with the English name, then
  a paragraph on location, function and relations;
- region tables: | Hebrew definition | English structure name |, using the
  same English names as the course's lab checklist.

Each entry's English name is matched to model structures the same way as
the course names (course_names.py: normalised spelling/abbreviations, the
course names and their aliases count too). Writes
src/data/anatomy/z-anatomy/summaryNotes.json: per side-less structure id,
its notes (text + where in the summary) and, from the organ guide, her
Hebrew name (without the definite article; singular for one-sided
structures — synonyms.json → hebrew). Entries the rules can't place but that are about a part of a structure (a
landmark on a bone, a lobe of the liver) go to that structure via
parents.json, labelled with the entry's name. Entries naming several structures ("Superficial & Deep inguinal
ring") go to each of them. See docs/COURSE_SOURCE.md → "Her summary".
"""

import json
import os
import re
import sys
from collections import defaultdict

import docx
from docx.table import Table
from docx.text.paragraph import Paragraph

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, os.path.join(ROOT, "scripts", "course", "medintzfat"))
from course_names import key, sorted_key  # noqa: E402

OUT = os.path.join(ROOT, "src", "data", "anatomy", "z-anatomy", "summaryNotes.json")
REPORT = os.path.join(ROOT, ".course-cache", "summary", "unmatched.json")
HEAD_NOUNS = {"artery", "arteries", "vein", "veins", "nerve", "nerves", "muscle", "muscles", "ligament",
              "ligaments", "fascia", "duct", "gland", "glands", "bone", "bones", "process", "m.", "n.", "a.", "v."}


# Sections of her summary that name one body region.
SECTION_REGION = {
    "גפה תחתונה": "lower-limb", "השלמות גפה תחתונה": "lower-limb",
    "גפה עליונה": "upper-limb", "השלמות גפה עליונה": "upper-limb",
}

REGION_QUALIFIERS = {
    "lower-limb": ["of foot", "muscles of foot", "muscle of foot", "of leg"],
    "upper-limb": ["of hand", "muscles of hand", "muscle of hand", "of forearm"],
}


def norm(s):
    return re.sub(r"\s+", " ", s.replace("‏", "").replace("‎", "")).strip()


def read(path):
    """The summary in document order → entries {en, he?, text, section, kind}."""
    d = docx.Document(path)
    entries, part, section, heading, pending = [], "", "", None, []
    for el in d.element.body.iterchildren():
        tag = el.tag.rsplit("}", 1)[-1]
        if tag == "p":
            p = Paragraph(el, d)
            text, style = norm(p.text), p.style.name
            if not text:
                continue
            if style in ("Title", "Heading 1"):
                part, section, heading = text, "", None
            elif style == "Heading 2":
                section, heading = text, None
            elif style == "Heading 3":
                heading, pending = text, []
            elif heading is not None:
                pending.append(text)
                # organ guide: Hebrew heading, English name line, description
                if len(pending) == 2 and re.fullmatch(r"[A-Za-z][A-Za-z ,’'()/&\-]*", pending[0]):
                    entries.append({"en": pending[0], "he": heading, "text": pending[1],
                                    "section": section, "kind": "guide"})
        elif tag == "tbl":
            for row in Table(el, d).rows[1:]:
                cells = [norm(c.text) for c in row.cells]
                if len(cells) == 2 and cells[0] and cells[1]:
                    entries.append({"en": cells[1], "text": cells[0], "section": section, "kind": "table"})
    return entries


def dictionary_form(he):
    """Her headings carry the definite article ("הלב", "המעי הריק"); names are
    shown without it, like the course's ("לב"). Only short headings whose
    every word takes the article are changed."""
    words = he.split()
    if len(words) <= 2 and all(w.startswith("ה") and len(w) > 2 for w in words):
        # A doubled vav is spelling after the article only: הוושט → ושט.
        return " ".join(re.sub(r"^וו", "ו", w[1:]) for w in words)
    return he


def english_part(term):
    """'עצמות הבריח (Clavicles)' → 'Clavicles'; 'Brachial Plexus - מקלעת העצבים'
    → 'Brachial Plexus'. Terms without Hebrew are returned unchanged."""
    if not re.search(r"[\u0590-\u05FF]", term):
        return term
    inside = re.findall(r"\(([A-Za-z][^()\u0590-\u05FF]*)\)", term)
    outside = norm(re.sub(r"\(.*?\)|[\u0590-\u05FF][^()A-Za-z]*", " ", term)).strip(" -")
    return inside[0] if inside and not outside else outside or (inside[0] if inside else "")


def split_names(name):
    """'Superficial & Deep inguinal ring' → both rings; 'X artery & vein' → both."""
    name = english_part(name)
    name = re.sub(r"\(.*?\)", " ", name)
    parts = [norm(p) for p in re.split(r"\s*(?:/|&|\+|,| and |\s-\s)\s*", name) if norm(p)]
    out = []
    for i, p in enumerate(parts):
        words = p.split()
        if len(words) == 1 and p.lower() in HEAD_NOUNS and out:
            out.append(" ".join(out[-1].split()[:-1] + [p]))
        elif len(words) == 1 and i + 1 < len(parts) and len(parts[i + 1].split()) > 1:
            out.append(" ".join([p] + parts[i + 1].split()[1:]))
        elif len(words) == 1 and i > 0 and len(parts[i - 1].split()) > 1:
            # "Rhomboid major/minor" → "Rhomboid minor"
            out.append(" ".join(parts[i - 1].split()[:-1] + [p]))
        else:
            out.append(p)
    return list(dict.fromkeys([name.strip()] + out))


def resolve_parents(parents, structures):
    """parents.json values → structure ids; 're:<regex>' matches side-less ids.
    Unknown ids fail loudly so a model change can't silently drop notes."""
    sided = {s["id"] for s in structures}
    bases = sorted({re.sub(r"-(left|right)$", "", i) for i in sided})
    resolved, unknown = {}, []
    for term, targets in parents.items():
        ids = []
        for t in targets:
            if t.startswith("re:"):
                hits = [b for b in bases if re.search(t[3:], b)]
                ids += hits or [f"(no match) {t}"]
            else:
                ids.append(t)
        unknown += [i for i in ids if i not in sided and i not in bases]
        resolved[term] = list(dict.fromkeys(ids))
    assert not unknown, f"parents.json names unknown structures: {sorted(set(unknown))}"
    return resolved


def main(path):
    entries = read(path)
    with open(os.path.join(ROOT, ".course-cache", "structures.json"), encoding="utf-8") as f:
        structures = json.load(f)
    with open(os.path.join(ROOT, "src", "data", "anatomy", "z-anatomy", "courseNames.json"), encoding="utf-8") as f:
        course = json.load(f)
    index, by_sorted, region = defaultdict(set), defaultdict(set), {}
    for s in structures:
        base = re.sub(r"-(left|right)$", "", s["id"])
        index[key(s["en"])].add(base)
        by_sorted[sorted_key(s["en"])].add(base)
        region[base] = s["region"]
    with open(os.path.join(HERE, "synonyms.json"), encoding="utf-8") as f:
        synonym_file = json.load(f)
    synonyms, hebrew_overrides = synonym_file["terms"], synonym_file["hebrew"]["names"]
    for base, c in course.items():
        if re.search(r"-(left|right)$", base):
            continue
        for name in [c.get("en"), *c.get("aliases", [])]:
            if name:
                index[key(name)].add(base)

    with open(os.path.join(HERE, "parents.json"), encoding="utf-8") as f:
        parents = resolve_parents(json.load(f)["parents"], structures)

    out, unmatched = defaultdict(lambda: {"notes": []}), []
    for e in entries:
        bases = list(synonyms.get(e["en"], []))
        for name in [] if bases else split_names(e["en"]):
            name = re.sub(r"^\d+\s+", "", name)  # "3 Palmar Interossei"
            hits = index.get(key(name)) or by_sorted.get(sorted_key(name), set())
            for qualifier in [] if hits else REGION_QUALIFIERS.get(SECTION_REGION.get(e["section"], ""), []):
                hits = index.get(key(f"{name} {qualifier}"), set())  # "… of foot"
                if hits:
                    break
            if len(hits) > 1 and e["section"] in SECTION_REGION:
                # "Abductor digiti minimi" in the lower-limb part is the foot's.
                hits = {h for h in hits if region.get(h) == SECTION_REGION[e["section"]]}
            if len(hits) == 1:
                bases.extend(hits)
        bases = list(dict.fromkeys(bases))
        part_of = not bases and e["en"] in parents
        if part_of:
            bases = parents[e["en"]]  # a landmark on a bone, a part of an organ, …
        if not bases:
            unmatched.append(e)
            continue
        for b in bases:
            note = {"text": e["text"], "section": e["section"], "term": e["en"]}
            if len(bases) > 1 or part_of:
                # The entry is about more than this structure, or a part of it:
                # the panel labels the note with the entry's name.
                note["shared"] = True
            if note not in out[b]["notes"]:
                out[b]["notes"].append(note)
            if e.get("he") and len(bases) == 1 and not part_of:
                he = hebrew_overrides.get(b, dictionary_form(e["he"]))
                if he:
                    out[b]["he"] = he
                    out[b]["heHeading"] = e["he"]
    for entry in out.values():  # notes about the structure itself first
        entry["notes"].sort(key=lambda n: n.get("shared", False))
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(dict(sorted(out.items())), f, ensure_ascii=False, indent=2)
        f.write("\n")
    os.makedirs(os.path.dirname(REPORT), exist_ok=True)
    with open(REPORT, "w", encoding="utf-8") as f:
        json.dump(unmatched, f, ensure_ascii=False, indent=1)
    print(f"{len(entries)} entries → notes for {len(out)} structures; "
          f"{sum(1 for v in out.values() if 'he' in v)} Hebrew names; "
          f"{len(unmatched)} entries name no model structure ({os.path.relpath(REPORT, ROOT)})")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, ".course-cache", "summary", "summary.docx"))

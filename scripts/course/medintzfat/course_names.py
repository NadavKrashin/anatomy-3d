"""Names every model structure the way her course names it.

    python3 scripts/course/medintzfat/extract.py          # fills .course-cache/
    npx tsx scripts/course/medintzfat/dump-structures.ts  # raw Z-Anatomy names
    python3 scripts/course/medintzfat/course_names.py
    npm run format

Writes src/data/anatomy/z-anatomy/courseNames.json: for each structure (by
side-less id) the English name as written on https://medintzfat.com/anatomy/,
the page it comes from, the course's Hebrew name where the course gives one
(hand-picked in hebrew-names.json), and the other wordings as search aliases.
The app applies it in src/data/anatomy/z-anatomy/courseNames.ts.

How a course name is found (see docs/COURSE_SOURCE.md → "Course names"):
- Every English run in the page text and the practice questions counts as one
  use of that wording.
- A model name and a course wording match when they agree after normalising:
  abbreviations (m./n./a./v.) and "muscle"/"bone" dropped, British→American
  spelling (oesophagus→esophagus), hyphens, and plural "-s". Failing that,
  the same words in another order. The model name without its
  parenthesised qualifier ("Vagus nerve (X)" → "Vagus nerve") also counts.
- synonyms.json adds wordings the rules can't find ("Portal vein").
- Among different wordings, the one in the semester-B structure checklist
  wins, else the most used. Within one wording, the spelled-out form beats
  the abbreviation (an abbreviation-only name is spelled out: "n." → "nerve")
  and capitalisation is normalised to sentence case.
- Skipped, keeping the model name: a wording that fits two model structures,
  and a wording whose number differs ("Lungs" for one lung).
"""

import glob
import json
import os
import re
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
CACHE = os.path.join(ROOT, ".course-cache")
SITE = "https://medintzfat.com/anatomy/"
OUT = os.path.join(ROOT, "src", "data", "anatomy", "z-anatomy", "courseNames.json")

# --- course wordings ----------------------------------------------------------

RUN = re.compile(r"[A-Za-z][A-Za-z’'\-\.]*(?:[ ](?:[A-Za-z’'\-\.]+))*")
LEADING = {"the", "of", "and", "or", "to", "in", "-"}


def course_forms():
    """Every English run on the course pages → {wording: {page: uses}}."""
    docs = []
    for f in sorted(glob.glob(os.path.join(CACHE, "medintzfat", "text", "*.md"))):
        docs.append((SITE + os.path.basename(f)[:-3], open(f, encoding="utf-8").read()))
    with open(os.path.join(CACHE, "medintzfat", "questions.json"), encoding="utf-8") as f:
        for q in json.load(f):
            docs.append((q["page"].split("#")[0], "\n".join([q["question"], *q["options"], q["explanation"]])))
    forms = defaultdict(Counter)
    for page, text in docs:
        for m in RUN.finditer(text):
            w = [x.strip(",") for x in m.group(0).replace("’", "'").split()]
            w = [x if x in ("m.", "n.", "a.", "v.") else x.rstrip(".") for x in w]
            w = [x for x in w if x]
            while w and w[0].lower() in LEADING:
                w = w[1:]
            while w and w[-1] == "-":
                w = w[:-1]
            if w and len(w) <= 8:
                forms[" ".join(w)][page] += 1
    return forms


# --- normalisation --------------------------------------------------------------

SPELLING = {"fasciae": "fascia", "latae": "lata", "peroneus": "fibularis", "peroneal": "fibular"}


def words(s):
    s = s.lower().replace("'s", "s").replace("'", "")
    s = re.sub(r"(\w)-(\w)", r"\1\2", s)
    s = re.sub(r"\b(m|mm|muscles?)\b\.?", " ", s)
    s = re.sub(r"\b(n|nn|nerves?)\b\.?", " nerve ", s)
    s = re.sub(r"\b(a|aa|artery|arteries)\b\.?", " artery ", s)
    s = re.sub(r"\b(v|vv|veins?)\b\.?", " vein ", s)
    s = re.sub(r"\b(the|of|bone)\b", " ", s)
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    out = []
    for w in s.split():
        w = w.replace("oe", "e").replace("ae", "e")
        w = SPELLING.get(w, w)
        out.append(w.rstrip("s") if len(w) > 3 else w)
    return out


def key(s):
    return " ".join(words(s))


def sorted_key(s):
    return " ".join(sorted(words(s)))


def plural(s):
    w = s.split()[-1].lower() if s.split() else ""
    return (w.endswith("s") and not w.endswith(("is", "us", "ss", "as", "ys"))) or w.endswith("ae")


EPONYMS = {
    "treitz", "hesselbach", "gerdy", "scarpa", "camper", "colles", "buck", "alcock", "morison",
    "douglas", "bartholin", "vater", "oddi", "gerota", "guyon", "louis", "glisson", "sibson",
    "cooper", "poupart", "calot", "eustachian", "wharton", "stensen", "adam",
}
LEVEL = re.compile(r"^(?:[IVX]+|[CTLS]\d+(?:-[CTLS]?\d+)?)$")
ABBREVIATED = re.compile(r"\b(m|n|a|v|mm|nn|aa|vv)\.?$")
EXPANDED = {"m": "muscle", "n": "nerve", "a": "artery", "v": "vein", "mm": "muscles", "nn": "nerves", "aa": "arteries", "vv": "veins"}


def sentence_case(f):
    ws = f.split()
    out = [ws[0][0].upper() + ws[0][1:]]
    for w in ws[1:]:
        bare = re.sub(r"['’]s?$", "", w).lower()
        keep = (w.isupper() and len(w) > 1) or LEVEL.match(w) or bare in EPONYMS or "'" in w
        out.append(w if keep else w.lower())
    return " ".join(out)


# --- matching -------------------------------------------------------------------


def main():
    forms = course_forms()
    by_key, by_sorted = defaultdict(dict), defaultdict(dict)
    for f, pages in forms.items():
        if key(f):
            by_key[key(f)][f] = pages
            by_sorted[sorted_key(f)][f] = pages

    with open(os.path.join(CACHE, "structures.json"), encoding="utf-8") as f:
        structures = json.load(f)
    bases = {}
    for s in structures:
        bases.setdefault(re.sub(r"-(left|right)$", "", s["id"]), s["en"])
    model_keys, model_sorted = defaultdict(set), defaultdict(set)
    for b, en in bases.items():
        model_keys[key(en)].add(b)
        model_sorted[sorted_key(en)].add(b)
    unqualified = defaultdict(set)
    for b, en in bases.items():
        unqualified[key(re.sub(r"\s*\(.*?\)\s*", " ", en))].add(b)

    with open(os.path.join(ROOT, "data", "course", "medintzfat", "lab-structures.json"), encoding="utf-8") as f:
        labs = json.load(f)
    checklist = {
        key(st["name"])
        for r in labs["semesterB"]["regions"]
        for g in r["groups"]
        for st in g["structures"]
        if not re.search(r"/|&|\+|,", st["name"])
    }
    with open(os.path.join(HERE, "synonyms.json"), encoding="utf-8") as f:
        synonyms = json.load(f)["synonyms"]

    def wordings(base, en):
        """Course wordings for a model structure: {wording key: {form: pages}}."""
        found = {}
        k = key(en)
        if k in by_key and len(model_keys[k]) == 1:
            found[k] = by_key[k]
        elif sorted_key(en) in by_sorted and len(model_sorted[sorted_key(en)]) == 1:
            found[k] = by_sorted[sorted_key(en)]
        # The model name without its qualifier: "Vagus nerve (X)" → "Vagus nerve".
        uk = key(re.sub(r"\s*\(.*?\)\s*", " ", en))
        if uk != k and uk in by_key and len(unqualified[uk]) == 1 and uk not in model_keys:
            found[uk] = by_key[uk]
        for syn in synonyms.get(base, []):
            if key(syn) in by_key:
                found[key(syn)] = by_key[key(syn)]
            else:
                print(f"synonym not on the site: {base} → {syn}")
        return found

    def best_form(variants, en, forced=False):
        """One wording's variants → (display form, uses, pages) or None."""
        cands = [(f, sum(p.values()), p) for f, p in variants.items()]
        same = [c for c in cands if plural(c[0]) == plural(en)]
        if not same and not forced:
            return None
        same = same or cands  # a hand-picked synonym may differ in number
        full = [c for c in same if not ABBREVIATED.search(c[0])] or same
        plain = [c for c in full if " - " not in c[0]] or full
        uses, pages = Counter(), defaultdict(Counter)
        for f, n, p in plain:
            uses[sentence_case(f)] += n
            pages[sentence_case(f)].update(p)
        form, n = uses.most_common(1)[0]
        # Only an abbreviated form on the site: spell it out (same name, readable).
        shown = ABBREVIATED.sub(lambda m: EXPANDED[m.group(1)], form)
        return shown, sum(uses.values()), pages[form]

    out, used_by = {}, defaultdict(list)
    for base, en in sorted(bases.items()):
        groups = []
        for k, variants in wordings(base, en).items():
            picked = best_form(variants, en, forced=base in synonyms)
            if picked:
                groups.append((k in checklist, picked[1], k, picked))
        if not groups:
            continue
        groups.sort(reverse=True)  # checklist wording first, then most used
        name, uses, pages = groups[0][3]
        entry = {"en": name, "source": SITE.rstrip("/") + "/" + pages.most_common(1)[0][0].rsplit("/", 1)[-1], "uses": uses}
        others = [g[3][0] for g in groups[1:]]
        if others:
            entry["aliases"] = others
        out[base] = entry
        used_by[name.lower()].append(base)

    # A course name may name one structure only.
    for name, bs in used_by.items():
        if len(bs) > 1:
            print(f"ambiguous, model names kept: {name} ← {bs}")
            for b in bs:
                out.pop(b, None)

    with open(os.path.join(HERE, "hebrew-names.json"), encoding="utf-8") as f:
        hebrew = json.load(f)["names"]
    for row in hebrew:
        target = out.setdefault(row["id"], {})
        target["he"] = row["he"]
        target["heSource"] = row["source"]
        if row.get("aliases"):
            target["heAliases"] = row["aliases"]
    for row in json.load(open(os.path.join(HERE, "synonyms.json"), encoding="utf-8"))["sideAliases"]:
        out.setdefault(row["id"], {})["aliases"] = [row["alias"]]
        out[row["id"]]["source"] = row["source"]

    missing = [r["id"] for r in hebrew if r["id"] not in bases] + [
        r["id"] for r in json.load(open(os.path.join(HERE, "synonyms.json")))["sideAliases"]
        if re.sub(r"-(left|right)$", "", r["id"]) not in bases
    ]
    assert not missing, f"unknown structure ids: {missing}"
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(dict(sorted(out.items())), f, ensure_ascii=False, indent=2)
        f.write("\n")
    named = sum(1 for v in out.values() if "en" in v)
    print(f"{named} of {len(bases)} structures named as in the course; "
          f"{sum(1 for v in out.values() if 'he' in v)} with the course's Hebrew → {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()

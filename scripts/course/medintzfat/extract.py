"""Extracts study data from the course site https://medintzfat.com/anatomy/.

    pip install beautifulsoup4 lxml
    npx tsx scripts/course/medintzfat/dump-structures.ts .course-cache/structures.json
    python3 scripts/course/medintzfat/extract.py

Two outputs, because the site's terms of use (https://medintzfat.com/terms/)
allow personal study use but forbid copying or embedding its content:

- data/course/medintzfat/  (committed): facts only — the syllabus (page titles
  and URLs), the structure names each lab covers (with the site's past-exam
  marks), Hebrew↔English term candidates, and suggested Z-Anatomy structure
  ids. No notes, explanations or questions.
- .course-cache/medintzfat/  (git-ignored, personal use): the raw pages, the
  plain-text page extracts and every practice question with its explanation.

Pages are cached in .course-cache/medintzfat/html; delete it to re-download.
See docs/COURSE_SOURCE.md.
"""

import json
import os
import re
import time
import urllib.request
from collections import defaultdict

from bs4 import BeautifulSoup

SITE = "https://medintzfat.com"
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
CACHE = os.path.join(ROOT, ".course-cache", "medintzfat")
OUT = os.path.join(ROOT, "data", "course", "medintzfat")
STRUCTURES = os.path.join(ROOT, ".course-cache", "structures.json")

# Practice-question sets loaded by the site's quiz widget (data-json-path).
QUESTION_JSON = {
    "/assets/anatomy-lab1.json": "/anatomy/lab1",
    "/assets/anatomy-lab2.json": "/anatomy/lab2",
    "/assets/anatomy-prep/upper_limb_questions.json": "/anatomy/quiz-upper-limb-01",
    "/assets/anatomy-prep/thorax_questions.json": "/anatomy/quiz-thorax-mediastinum-01",
    "/assets/anatomy-prep/abdomen_questions.json": "/anatomy/quiz-abdomen",
}
# Pages whose questions are written inline (h3 "שאלה N:", ol, details).
INLINE_QUIZ_PAGES = ["quiz-abdomen", "quiz-lower-limb", "quiz-head-neck"]
PAST_EXAMS = {"twice": 2, "triple": 3, "quadruple": 4, "quintuple": 5}


def norm(s):
    return re.sub(r"\s+", " ", s.replace("‑", "-")).strip()


def fetch(path):
    """Returns the body of SITE+path, cached on disk."""
    name = path.strip("/").replace("/", "__") or "index"
    file = os.path.join(CACHE, "html", name)
    if not os.path.exists(file):
        os.makedirs(os.path.dirname(file), exist_ok=True)
        req = urllib.request.Request(SITE + path, headers={"User-Agent": "anatomy-study-app"})
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        with open(file, "wb") as f:
            f.write(data)
        time.sleep(0.5)
    with open(file, encoding="utf-8") as f:
        return f.read()


def soup(path):
    return BeautifulSoup(fetch(path), "lxml")


def main_el(s):
    m = s.find("main") or s.body
    for t in m.find_all(["script", "style", "svg", "nav", "aside"]):
        t.decompose()
    return m


def write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


# --- syllabus ---------------------------------------------------------------


def syllabus():
    """Sections of the anatomy index page with their pages, in course order."""
    m = soup("/anatomy/").find("main")
    out, cur, seen = [], None, set()
    for el in m.find_all(["h2", "h3", "a"]):
        if el.name in ("h2", "h3"):
            cur = {"section": norm(el.get_text(" ")), "pages": []}
            out.append(cur)
            continue
        href = el.get("href", "").split("#")[0]
        if not href.startswith("/anatomy/") or href == "/anatomy/" or href in seen or cur is None:
            continue
        seen.add(href)
        title = norm(soup(href).title.get_text()) if soup(href).title else ""
        cur["pages"].append({"label": norm(el.get_text(" ")), "title": title, "url": SITE + href})
    # The index ends with a "latest content" strip whose headings don't match
    # their links (one link each); gather those pages into one extra section.
    sections = [s for s in out if s["pages"]]
    course = [s for s in sections if len(s["pages"]) > 1]
    extra = [p for s in sections if len(s["pages"]) == 1 for p in s["pages"]]
    if extra:
        course.append({"section": "practice and lab lists (site extras)", "pages": extra})
    return course


# --- questions (personal use only) ------------------------------------------


def questions():
    out = []
    for data_path, page in QUESTION_JSON.items():
        key = os.path.basename(data_path)[:-5]
        for q in json.loads(fetch(data_path))["questions"]:
            out.append({
                "id": f"{key}-{q['question_number']}",
                "page": SITE + page,
                "data": SITE + data_path,
                "topic": None,
                "question": norm(q["question_text"]),
                "options": [norm(o) for o in q["options"]],
                "correctIndex": q["correct_answer"] - 1,  # the site is 1-based
                "explanation": norm(q.get("explanation", "")),
            })
    for page in INLINE_QUIZ_PAGES:
        s = soup(f"/anatomy/{page}")
        topic = None
        for el in s.select("main h2, main h3"):
            if el.name == "h2":
                topic = norm(el.get_text())
                continue
            m = re.match(r"שאלה (\d+):\s*(.*)", norm(el.get_text()))
            ol, det = el.find_next_sibling("ol"), el.find_next_sibling("details")
            if not m or ol is None or det is None:
                continue
            paras = det.select("div > p")
            correct = re.search(r"\((\d+)\)", paras[0].get_text()) if paras else None
            if correct is None:
                continue
            out.append({
                "id": f"{page}-{m.group(1)}",
                "page": f"{SITE}/anatomy/{page}#{el.get('id')}",
                "topic": topic,
                "question": norm(m.group(2)),
                "options": [norm(li.get_text(" ")) for li in ol.find_all("li", recursive=False)],
                "correctIndex": int(correct.group(1)) - 1,
                "explanation": " ".join(
                    norm(p.get_text(" ")) for p in paras[2:] if "מדוע התשובות" not in p.get_text()
                ),
                "wrongExplanations": [norm(li.get_text(" ")) for li in det.select("div > ul > li")],
            })
    bad = [q["id"] for q in out if not 0 <= q["correctIndex"] < len(q["options"])]
    assert not bad, f"answer index out of range: {bad}"
    return out


# --- structure matching -----------------------------------------------------


def structure_matcher():
    """Suggests a Z-Anatomy structure id (side-less) for a course name."""
    if not os.path.exists(STRUCTURES):
        print("no structures.json — run dump-structures.ts first; skipping ids")
        return lambda name: None

    def key(s):
        s = s.lower().replace("’", "'").replace("'s", "s")
        s = re.sub(r"\b(m|mm|muscles?)\b\.?", " ", s)
        s = re.sub(r"\b(n|nn|nerves?)\b\.?", " nerve ", s)
        s = re.sub(r"\b(a|aa|artery|arteries)\b\.?", " artery ", s)
        s = re.sub(r"\b(v|vv|veins?)\b\.?", " vein ", s)
        s = re.sub(r"\b(the|of|bone|process)\b", " ", s)
        s = re.sub(r"[^a-z ]", " ", s)
        return " ".join(sorted(w.rstrip("s") if len(w) > 3 else w for w in s.split()))

    index = {}
    with open(STRUCTURES, encoding="utf-8") as f:
        for x in json.load(f):
            base = re.sub(r"-(left|right)$", "", x["id"])
            for name in (x["en"], x["la"]):
                if name:
                    index.setdefault(key(name), base)

    def match(name):
        parts = re.split(r"\s*(?:/|\+|&| and )\s*", name) + [name]
        for cand in parts:
            k = key(re.sub(r"\(.*?\)", "", cand))
            if k and k in index:
                return index[k]
        return None

    return match


# --- lab structure lists ----------------------------------------------------

LATIN_TERM = re.compile(r"[A-Z][A-Za-z’'\-/\.]*(?:[ \-](?:[A-Za-z’'\-/\.]+|&)){0,6}")
NOT_STRUCTURES = {"CT", "MRI", "AP", "PA", "Structure"}


def lab_lists(match):
    # Semester B: one consolidated table page; ★ marks past-exam structures.
    s = soup("/anatomy/labs-semester-b")
    regions, reg, grp = [], None, None
    for el in s.select("main h2, main h3, main table"):
        if el.name == "h2":
            reg = {"region": norm(el.get_text()), "url": f"{SITE}/anatomy/labs-semester-b#{el.get('id')}", "groups": []}
            regions.append(reg)
        elif el.name == "h3" and reg is not None:
            grp = {"group": norm(el.get_text()), "structures": []}
            reg["groups"].append(grp)
        elif el.name == "table" and grp is not None:
            for tr in el.select("tbody tr"):
                tds = tr.find_all("td")
                if not tds:
                    continue
                mark = tds[0].select_one(".test-solution")
                n = next((v for k, v in PAST_EXAMS.items() if k in mark["class"]), 1) if mark else 0
                name = norm(tds[0].get_text(" "))
                grp["structures"].append({"name": name, "pastExams": n, "structureId": match(name)})

    # Every lab page (both semesters): its sections and the English/Latin
    # structure names in headings, bold text and first table cells.
    labs = []
    for i in range(1, 10):
        s = soup(f"/anatomy/lab{i}")
        m = main_el(s)
        sections, cur = [], None
        for el in m.find_all(["h2", "h3", "h4", "strong", "th", "td"]):
            if el.name == "h2":
                cur = {"section": norm(el.get_text(" ")), "names": []}
                sections.append(cur)
                continue
            if cur is None or (el.name == "td" and el.find_previous_sibling("td")):
                continue
            for mm in LATIN_TERM.finditer(norm(el.get_text(" "))):
                t = mm.group(0).strip(" -.")
                if len(t) >= 3 and t not in NOT_STRUCTURES and t not in [n["name"] for n in cur["names"]]:
                    cur["names"].append({"name": t, "structureId": match(t)})
        labs.append({
            "lab": i,
            "url": f"{SITE}/anatomy/lab{i}",
            "title": norm(s.title.get_text()) if s.title else "",
            "sections": [x for x in sections if x["names"]],
        })
    regions = [r for r in regions if r["groups"]]  # drops the page's table of contents
    return {
        "labs": labs,
        "semesterB": {
            "url": f"{SITE}/anatomy/labs-semester-b",
            "pastExamsNote": "pastExams: how many past exams the site authors believe included the structure (★ on the site; 0 = not marked)",
            "regions": regions,
        },
    }


# --- Hebrew terms -----------------------------------------------------------

HEB_ONLY = re.compile(r"^[֐-׿\"״׳'’\- ]+$")
LAT_ONLY = re.compile(r"^[A-Za-z][A-Za-z0-9’'\-/\. ]*$")
LAT_RUN = r"[A-Z][A-Za-z’'\-/\.]*(?:[ \-][A-Za-z’'\-/\.]+){0,6}"
ANATOMY_NOUN = re.compile(
    r"^(ה?(עצמ|עצם|עורק|וריד|עצב|שריר|רצוע|מפרק|בלוט|גיד|חוליי?|צלע|תעל|חלל|שק|קרו|ריא|כבד|לב|טחול|קיב|מעי|כלי|שופכ|שלפוחי|רחם|שחל|אשך|ערמוני|לבלב|קנה|גרון|לוע|ושט|לשון|חך|שפתי|עין|אוזן|אף|לסת|גולגול|אגן|ירך|ברך|שוק|קרסול|כף|אצבע|אגודל|זרוע|אמה|מרפק|כתף|שכמ|בריח|חזה|בטן|גב|צוואר|ראש|מוח|חוט|סרעפ|צפק|קרום|מיתר|חצוצר|עור|ענבל|פיק|דגדג))"
)


def hebrew_terms():
    """Hebrew↔English pairs as written on the course pages: 'עברית (English)'
    headings/bold text and 'English (עברית)' anywhere. Candidates, not facts."""
    pairs = defaultdict(lambda: {"pages": set(), "count": 0})

    def add(he, en, page):
        if HEB_ONLY.match(he) and LAT_ONLY.match(en) and len(he.split()) <= 4 and len(en.split()) <= 6:
            p = pairs[(he.replace("־", " ").strip(), en.strip())]
            p["pages"].add(page)
            p["count"] += 1

    for path in sorted(p["url"][len(SITE):] for s in syllabus() for p in s["pages"]):
        m = main_el(soup(path))
        for el in m.find_all(["h2", "h3", "h4", "strong", "li", "td", "th", "p", "summary"]):
            txt = norm(el.get_text(" "))
            if el.name in ("h2", "h3", "h4", "strong", "th", "summary"):
                mm = re.fullmatch(r"(.+?)\s*\(\s*(.+?)\s*\)", txt) or re.fullmatch(r"(.+?)\s+-\s+(.+)", txt)
                if mm:
                    a, b = mm.group(1).strip(), mm.group(2).strip()
                    add(a, b, SITE + path)
                    add(b, a, SITE + path)
            for mm in re.finditer("(" + LAT_RUN + r")\s*\(([^()]+)\)", txt):
                add(mm.group(2).strip(), mm.group(1).strip(" -"), SITE + path)
    rows = [
        {
            "he": he,
            "en": en,
            "count": v["count"],
            # A heuristic only: the Hebrew starts with an anatomical noun or
            # the pair recurs. Everything here still needs review.
            "likelyTerm": bool(ANATOMY_NOUN.match(he)) or v["count"] > 1,
            "pages": sorted(v["pages"]),
        }
        for (he, en), v in pairs.items()
    ]
    return sorted(rows, key=lambda r: (r["en"].lower(), r["he"]))


# --- page text (personal use only) ------------------------------------------


def page_text(path):
    m = main_el(soup(path))
    lines = []
    for el in m.find_all(["h1", "h2", "h3", "h4", "p", "li", "td", "th", "summary", "figcaption"]):
        if el.name in ("li", "td") and el.find(["p", "li", "td", "h3", "h4"]):
            txt = " ".join(x.strip() for x in el.find_all(string=True, recursive=False) if x.strip())
        else:
            txt = el.get_text(" ", strip=True)
        txt = norm(txt)
        if txt:
            prefix = {"h1": "# ", "h2": "## ", "h3": "### ", "h4": "#### ", "li": "- ", "td": "| ", "th": "| "}
            lines.append(prefix.get(el.name, "") + txt)
    return f"<!-- {SITE}{path} -->\n" + "\n".join(lines) + "\n"


def main():
    syl = syllabus()
    match = structure_matcher()
    labs = lab_lists(match)
    terms = hebrew_terms()
    qs = questions()

    write(os.path.join(OUT, "syllabus.json"), syl)
    write(os.path.join(OUT, "lab-structures.json"), labs)
    write(os.path.join(OUT, "hebrew-term-candidates.json"), terms)

    write(os.path.join(CACHE, "questions.json"), qs)
    os.makedirs(os.path.join(CACHE, "text"), exist_ok=True)
    for s in syl:
        for p in s["pages"]:
            path = p["url"][len(SITE):]
            with open(os.path.join(CACHE, "text", path.rsplit("/", 1)[-1] + ".md"), "w", encoding="utf-8") as f:
                f.write(page_text(path))

    pages = sum(len(s["pages"]) for s in syl)
    rows = [st for r in labs["semesterB"]["regions"] for g in r["groups"] for st in g["structures"]]
    lab_names = [n for lab in labs["labs"] for sec in lab["sections"] for n in sec["names"]]
    print(f"pages: {pages}")
    print(f"semester-B rows: {len(rows)} ({sum(1 for r in rows if r['pastExams'])} past-exam, "
          f"{sum(1 for r in rows if r['structureId'])} matched to a structure)")
    print(f"lab-page names: {len(lab_names)} ({sum(1 for n in lab_names if n['structureId'])} matched)")
    print(f"Hebrew term candidates: {len(terms)} ({sum(1 for t in terms if t['likelyTerm'])} likely)")
    print(f"questions: {len(qs)} ({len({q['question'] for q in qs})} unique) → {CACHE}")


if __name__ == "__main__":
    main()

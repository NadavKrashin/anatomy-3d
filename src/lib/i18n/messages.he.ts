import type {
  AnatomyRegion,
  AnatomySystem,
  DetailSection,
  TermLanguage,
} from "@/types/anatomy";

export const he = {
  appName: "ANATOMY",
  tagline: "ללמוד את הגוף דרך חקירה שלו.",
  disclaimer:
    "לצורכי לימוד בלבד. יש לאמת את התוכן האנטומי מול המקורות הנדרשים במוסד הלימודים שלך.",
  demoModelNotice: "מודל הדגמה לפיתוח — אינו מדויק אנטומית.",
  nav: {
    home: "בית",
    explore: "חקירה",
    quiz: "בוחן",
    progress: "התקדמות",
    comingSoon: "בקרוב",
  },
  home: {
    welcomeTitle: "ברוכה הבאה ל־Anatomy",
    welcomeBody:
      "לומדים אנטומיה של האדם דרך חקירה בתלת־ממד: מסובבים, בוחרים מבנים, מסתירים שכבות ומתרגלים.",
    startExploring: "להתחיל לחקור",
    whatToStudy: "מה לומדים היום?",
    structuresCount: (n: number) => (n === 1 ? "מבנה אחד" : `${n} מבנים`),
    features: {
      explore: {
        title: "חקירה תלת־ממדית",
        body: "סיבוב, זום והתמקדות בכל מבנה.",
      },
      identify: {
        title: "זיהוי מבנים",
        body: "לחיצה על מבנה מציגה שם בעברית, באנגלית ובלטינית.",
      },
      quiz: {
        title: "תרגול פעיל",
        body: "בחנים ומעקב אחרי מבנים חלשים — בשלב הבא.",
      },
    },
  },
  viewer: {
    loading: "טוען אנטומיה…",
    loadFailed: "לא ניתן לטעון את המודל האנטומי.",
    retry: "נסה שוב",
    webglUnavailable:
      "הדפדפן או המכשיר אינם תומכים ב־WebGL, ולכן לא ניתן להציג את המודל התלת־ממדי.",
    resetCamera: "איפוס מצלמה",
    showAll: "הצג הכול",
    exitIsolate: "יציאה מבידוד",
    systems: "מערכות",
    shortcuts: "קיצורי מקלדת",
    settings: "הגדרות",
    close: "סגירה",
    hiddenCount: (n: number) => `${n} מוסתרים`,
    isolating: "מצב בידוד",
  },
  search: {
    placeholder: "חיפוש מבנה…",
    label: "חיפוש מבנים",
    noResults: "לא נמצאו מבנים",
  },
  structure: {
    focus: "מיקוד",
    isolate: "בידוד",
    hide: "הסתרה",
    studyThis: "ללמוד את זה",
    unverified: "לא אומת",
    unverifiedHint: "התרגום טרם אומת מול מקור מוסמך",
    noDetails: "אין עדיין מידע מאומת על מבנה זה.",
    contentLanguageNote: "התוכן המפורט זמין כרגע באנגלית.",
    sections: {
      function: "תפקוד",
      origin: "מוצא",
      insertion: "אחיזה",
      innervation: "עצבוב",
      bloodSupply: "אספקת דם",
      articulations: "מפרקים",
    } satisfies Record<DetailSection, string>,
    clinicalNote: "הערה קלינית",
  },
  shortcuts: {
    search: "חיפוש",
    escape: "סגירה / ביטול בחירה",
    focus: "מיקוד במבנה הנבחר",
    isolate: "בידוד המבנה הנבחר",
    hide: "הסתרת המבנה הנבחר",
    reset: "איפוס מצלמה",
    help: "הצגת קיצורים",
  },
  settings: {
    interfaceLanguage: "שפת ממשק",
    primaryTerm: "שפת שם ראשית",
    secondaryTerm: "שפת שם משנית",
    none: "ללא",
  },
  termLanguages: { en: "אנגלית", la: "לטינית", he: "עברית" } satisfies Record<
    TermLanguage,
    string
  >,
  systems: {
    skeletal: "שלד",
    muscular: "שרירים",
    nervous: "עצבים",
    cardiovascular: "לב וכלי דם",
    respiratory: "נשימה",
    digestive: "עיכול",
    urinary: "שתן",
    reproductive: "רבייה",
    lymphatic: "לימפה",
    endocrine: "אנדוקרינית",
    integumentary: "עור",
    other: "אחר",
  } satisfies Record<AnatomySystem, string>,
  regions: {
    head: "ראש",
    neck: "צוואר",
    thorax: "בית החזה",
    abdomen: "בטן",
    pelvis: "אגן",
    back: "גב",
    "upper-limb": "גפה עליונה",
    "lower-limb": "גפה תחתונה",
    "whole-body": "כל הגוף",
    other: "אחר",
  } satisfies Record<AnatomyRegion, string>,
};

export type Messages = typeof he;

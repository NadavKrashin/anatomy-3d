import type { Distinction } from "@/lib/quiz/clues";

/** Her heading for the distinctions part of her summary. */
export const DISTINCTIONS_HEADING = "הבחנות חשובות ללימוד";

/**
 * Her "important distinctions" (הבחנות חשובות ללימוד, at the end of her
 * summary), split into one clue per side of each pair, in her words. Pairs
 * whose halves the model doesn't have, or that don't say which is which
 * (thyroid / parathyroid, artery / vein, muscle / tendon / ligament, tongue
 * sensation / movement, pericardium / pleura) are left out. Listed for her
 * check in docs/CONTENT_REVIEW.md → "Quiz clues from her distinctions".
 */
export const SUMMARY_DISTINCTIONS: readonly Distinction[] = [
  // שופכן ושופכה
  { text: "מחבר כליה לשלפוחית.", answer: "ureter", others: ["urethra"] },
  { text: "מחברת שלפוחית לחוץ.", answer: "urethra", others: ["ureter"] },
  // ייצור מרה ואגירת מרה
  { text: "מייצר מרה.", answer: "liver", others: ["gallbladder"] },
  { text: "אוגר ומרכז את המרה.", answer: "gallbladder", others: ["liver"] },
  // טחול ולבלב
  { text: "איבר לימפתי המסנן דם.", answer: "spleen", others: ["pancreas"] },
  { text: "בלוטת עיכול והורמונים.", answer: "pancreas", others: ["spleen"] },
  // אשך ויותרת האשך
  { text: "כאן מתרחשת יצירת זרע.", answer: "testis", others: ["epididymis"] },
  {
    text: "כאן מתרחשות הבשלה ואגירה של הזרע.",
    answer: "epididymis",
    others: ["testis"],
  },
  // עצב הפנים בפרוטיד
  {
    text: "עובר בפרוטיד ומפעיל שרירי הבעה.",
    answer: "facial-nerve-vii",
    others: ["glossopharyngeal-nerve-ix"],
  },
  {
    text: "המסלול להפרשת בלוטת הפרוטיד קשור אליו.",
    answer: "glossopharyngeal-nerve-ix",
    others: ["facial-nerve-vii"],
  },
  // מדולת כליה ועמודי כליה
  {
    text: "שייכות למדולה של הכליה.",
    answer: "renal-pyramids",
    others: ["renal-columns"],
  },
  {
    text: "רקמה קורטיקלית שבין הפירמידות.",
    answer: "renal-columns",
    others: ["renal-pyramids"],
  },
  // שרוול מסובב
  {
    text: "אינו חלק מהשרוול המסובב.",
    answer: "teres-major-muscle",
    others: [
      "supraspinatus-muscle",
      "infraspinatus-muscle",
      "teres-minor-muscle",
      "subscapularis-muscle",
    ],
  },
];

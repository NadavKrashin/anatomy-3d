import type {
  AnatomicalStructure,
  StructureDetails,
  StructureNames,
} from "@/types/anatomy";

/*
 * Demo dataset. Medical facts here are limited to well-established textbook
 * anatomy; anything uncertain is left out on purpose.
 *
 * Terms are all `verified: false` until a human checks them against course
 * material. Hebrew terms in particular are best-effort and must be reviewed —
 * see docs/CONTENT_REVIEW.md.
 */

const SOURCE = "demo-dataset";
const LICENSE = "Project content (see README)";

const en = (text: string) => ({ text, verified: false });
const la = (text: string) => ({ text, verified: false });
const he = (text: string) => ({ text, verified: false });

function names(english: string, latin: string, hebrew: string): StructureNames {
  return { en: en(english), la: la(latin), he: he(hebrew) };
}

const bicepsBrachii: StructureDetails = {
  description: { en: "Two-headed muscle on the front of the arm." },
  function: [
    { en: "Flexion of the elbow" },
    { en: "Supination of the forearm" },
    { en: "Weak flexion of the shoulder" },
  ],
  origin: [
    { en: "Long head: supraglenoid tubercle of the scapula" },
    { en: "Short head: coracoid process of the scapula" },
  ],
  insertion: [{ en: "Radial tuberosity" }, { en: "Bicipital aponeurosis" }],
  innervation: [{ en: "Musculocutaneous nerve (C5–C6)" }],
  bloodSupply: [{ en: "Muscular branches of the brachial artery" }],
};

const humerus: StructureDetails = {
  description: {
    en: "Long bone of the arm, between the shoulder and the elbow.",
  },
  articulations: [
    { en: "Scapula — glenohumeral (shoulder) joint" },
    { en: "Radius and ulna — elbow joint" },
  ],
};

const radius: StructureDetails = {
  description: {
    en: "Lateral bone of the forearm (thumb side in anatomical position).",
  },
  articulations: [
    { en: "Humerus — elbow joint" },
    { en: "Ulna — proximal and distal radioulnar joints" },
    { en: "Carpal bones — wrist joint" },
  ],
};

const ulna: StructureDetails = {
  description: {
    en: "Medial bone of the forearm (little-finger side in anatomical position).",
  },
  articulations: [
    { en: "Humerus — elbow joint" },
    { en: "Radius — proximal and distal radioulnar joints" },
  ],
};

const femur: StructureDetails = {
  description: {
    en: "Bone of the thigh; the longest and strongest bone in the body.",
  },
  articulations: [
    { en: "Hip bone — hip joint" },
    { en: "Tibia and patella — knee joint" },
  ],
};

const lung: StructureDetails = {
  description: {
    en: "Organ of gas exchange. The right lung has three lobes; the left lung has two.",
  },
};

const structures: AnatomicalStructure[] = [
  {
    id: "skull",
    names: names("Skull", "Cranium", "גולגולת"),
    aliases: { en: ["cranium"] },
    system: "skeletal",
    region: "head",
    side: "midline",
    details: {
      description: {
        en: "Bony framework of the head that encloses and protects the brain.",
      },
    },
    tags: ["bone"],
  },
  ...(["left", "right"] as const).flatMap((side): AnatomicalStructure[] => [
    {
      id: `humerus-${side}`,
      names: names("Humerus", "Humerus", "עצם הזרוע"),
      aliases: { en: ["arm bone"] },
      system: "skeletal",
      region: "upper-limb",
      side,
      bilateralGroupId: "humerus",
      details: humerus,
      tags: ["bone", "long-bone"],
    },
    {
      id: `radius-${side}`,
      names: names("Radius", "Radius", "עצם החישור"),
      aliases: {},
      system: "skeletal",
      region: "upper-limb",
      side,
      bilateralGroupId: "radius",
      details: radius,
      tags: ["bone", "long-bone", "forearm"],
    },
    {
      id: `ulna-${side}`,
      names: names("Ulna", "Ulna", "עצם הגומד"),
      aliases: {},
      system: "skeletal",
      region: "upper-limb",
      side,
      bilateralGroupId: "ulna",
      details: ulna,
      tags: ["bone", "long-bone", "forearm"],
    },
    {
      id: `biceps-brachii-${side}`,
      names: names(
        "Biceps brachii",
        "Musculus biceps brachii",
        "השריר הדו־ראשי של הזרוע",
      ),
      aliases: { en: ["biceps"], he: ["דו ראשי", "ביספס"] },
      system: "muscular",
      region: "upper-limb",
      side,
      bilateralGroupId: "biceps-brachii",
      details: bicepsBrachii,
      tags: ["muscle", "arm", "anterior-compartment"],
    },
    {
      id: `femur-${side}`,
      names: names("Femur", "Femur", "עצם הירך"),
      aliases: { en: ["thigh bone"] },
      system: "skeletal",
      region: "lower-limb",
      side,
      bilateralGroupId: "femur",
      details: femur,
      tags: ["bone", "long-bone"],
    },
  ]),
  {
    id: "median-nerve-left",
    names: names("Median nerve", "Nervus medianus", "העצב המדיאני"),
    aliases: {},
    system: "nervous",
    region: "upper-limb",
    side: "left",
    bilateralGroupId: "median-nerve",
    details: {
      description: {
        en: "Formed by the lateral and medial cords of the brachial plexus. Runs down the arm with the brachial artery and enters the hand through the carpal tunnel.",
      },
      function: [
        { en: "Motor: most flexors of the forearm and the thenar muscles" },
        { en: "Sensory: palmar side of the lateral three and a half digits" },
      ],
      innervation: [{ en: "Roots: C6–T1 (often also C5)" }],
      clinicalNote: {
        en: "Compression within the carpal tunnel causes carpal tunnel syndrome.",
      },
    },
    tags: ["nerve", "brachial-plexus"],
  },
  {
    id: "ulnar-nerve-left",
    names: names("Ulnar nerve", "Nervus ulnaris", "עצב הגומד"),
    aliases: { he: ["העצב האולנרי"] },
    system: "nervous",
    region: "upper-limb",
    side: "left",
    bilateralGroupId: "ulnar-nerve",
    details: {
      description: {
        en: "Terminal branch of the medial cord of the brachial plexus. Passes behind the medial epicondyle of the humerus.",
      },
      function: [
        {
          en: "Motor: flexor carpi ulnaris, medial half of flexor digitorum profundus, most intrinsic hand muscles",
        },
        { en: "Sensory: medial one and a half digits" },
      ],
      innervation: [{ en: "Roots: C8–T1" }],
      clinicalNote: {
        en: "Superficial behind the medial epicondyle (the “funny bone”), where it is easily injured.",
      },
    },
    tags: ["nerve", "brachial-plexus"],
  },
  {
    id: "radial-nerve-left",
    names: names("Radial nerve", "Nervus radialis", "עצב החישור"),
    aliases: { he: ["העצב הרדיאלי"] },
    system: "nervous",
    region: "upper-limb",
    side: "left",
    bilateralGroupId: "radial-nerve",
    details: {
      description: {
        en: "Terminal branch of the posterior cord of the brachial plexus. Runs in the radial groove on the back of the humerus.",
      },
      function: [
        {
          en: "Motor: extensors of the arm and forearm (including triceps brachii)",
        },
      ],
      innervation: [{ en: "Roots: C5–T1" }],
      clinicalNote: {
        en: "A midshaft humeral fracture can injure it in the radial groove, causing wrist drop.",
      },
    },
    tags: ["nerve", "brachial-plexus"],
  },
  {
    id: "brachial-artery-left",
    names: names("Brachial artery", "Arteria brachialis", "עורק הזרוע"),
    aliases: { he: ["העורק הברכיאלי"] },
    system: "cardiovascular",
    region: "upper-limb",
    side: "left",
    bilateralGroupId: "brachial-artery",
    details: {
      description: {
        en: "Continuation of the axillary artery from the inferior border of teres major. Divides in the cubital fossa into the radial and ulnar arteries.",
      },
      clinicalNote: {
        en: "Compressed with a cuff and auscultated when measuring blood pressure.",
      },
    },
    tags: ["artery"],
  },
  {
    id: "heart",
    names: names("Heart", "Cor", "לב"),
    aliases: {},
    system: "cardiovascular",
    region: "thorax",
    side: "midline",
    details: {
      description: {
        en: "Four-chambered muscular pump located in the middle mediastinum.",
      },
      bloodSupply: [{ en: "Right and left coronary arteries" }],
    },
    tags: ["organ"],
  },
  {
    id: "lung-left",
    names: names("Lung", "Pulmo", "ריאה"),
    aliases: {},
    system: "respiratory",
    region: "thorax",
    side: "left",
    bilateralGroupId: "lung",
    details: lung,
    tags: ["organ"],
  },
  {
    id: "lung-right",
    names: names("Lung", "Pulmo", "ריאה"),
    aliases: {},
    system: "respiratory",
    region: "thorax",
    side: "right",
    bilateralGroupId: "lung",
    details: lung,
    tags: ["organ"],
  },
  {
    id: "liver",
    names: names("Liver", "Hepar", "כבד"),
    aliases: {},
    system: "digestive",
    region: "abdomen",
    side: "midline",
    details: {
      description: {
        en: "Largest gland of the body, mostly in the right upper quadrant of the abdomen.",
      },
      bloodSupply: [
        { en: "Hepatic artery proper" },
        { en: "Hepatic portal vein" },
      ],
    },
    tags: ["organ", "gland"],
  },
];

export const demoStructures: AnatomicalStructure[] = structures.map(
  (structure) => ({
    ...structure,
    modelSource: SOURCE,
    sourceLicense: LICENSE,
  }),
);

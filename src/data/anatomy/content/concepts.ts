import type { StructureDetails, TermLanguage } from "@/types/anatomy";

/*
 * Hand-curated content per anatomical concept, shared by every dataset (a
 * concept is side-independent: "humerus", not "humerus-left").
 *
 * Rules (docs/CONTRIBUTING.md → Medical content):
 *  - Only well-established textbook facts. Absent is better than wrong.
 *  - Every term is unverified until a human checks it; Hebrew terms are
 *    listed in docs/CONTENT_REVIEW.md.
 */

export interface ConceptContent {
  /** Names in languages other than English (English comes from the dataset). */
  names?: Partial<Record<Exclude<TermLanguage, "en">, string>>;
  aliases?: Partial<Record<TermLanguage, string[]>>;
  details?: StructureDetails;
}

export const CONCEPTS = {
  skull: {
    names: { la: "Cranium", he: "גולגולת" },
    aliases: { en: ["cranium"] },
    details: {
      description: {
        en: "Bony framework of the head that encloses and protects the brain.",
      },
    },
  },
  scapula: {
    names: { la: "Scapula", he: "עצם השכמה" },
    aliases: { en: ["shoulder blade"] },
    details: {
      description: {
        en: "Flat, triangular bone on the posterior thoracic wall; part of the shoulder girdle.",
      },
      articulations: [
        { en: "Humerus — glenohumeral (shoulder) joint" },
        { en: "Clavicle — acromioclavicular joint" },
      ],
    },
  },
  clavicle: {
    names: { la: "Clavicula", he: "עצם הבריח" },
    aliases: { en: ["collarbone"] },
    details: {
      description: {
        en: "S-shaped bone connecting the upper limb to the trunk.",
      },
      articulations: [
        { en: "Sternum — sternoclavicular joint" },
        { en: "Scapula — acromioclavicular joint" },
      ],
    },
  },
  humerus: {
    names: { la: "Humerus", he: "עצם הזרוע" },
    aliases: { en: ["arm bone"] },
    details: {
      description: {
        en: "Long bone of the arm, between the shoulder and the elbow.",
      },
      articulations: [
        { en: "Scapula — glenohumeral (shoulder) joint" },
        { en: "Radius and ulna — elbow joint" },
      ],
    },
  },
  radius: {
    names: { la: "Radius", he: "עצם החישור" },
    details: {
      description: {
        en: "Lateral bone of the forearm (thumb side in anatomical position).",
      },
      articulations: [
        { en: "Humerus — elbow joint" },
        { en: "Ulna — proximal and distal radioulnar joints" },
        { en: "Carpal bones — wrist joint" },
      ],
    },
  },
  ulna: {
    names: { la: "Ulna", he: "עצם הגומד" },
    details: {
      description: {
        en: "Medial bone of the forearm (little-finger side in anatomical position).",
      },
      articulations: [
        { en: "Humerus — elbow joint" },
        { en: "Radius — proximal and distal radioulnar joints" },
      ],
    },
  },
  femur: {
    names: { la: "Femur", he: "עצם הירך" },
    aliases: { en: ["thigh bone"] },
    details: {
      description: {
        en: "Bone of the thigh; the longest and strongest bone in the body.",
      },
      articulations: [
        { en: "Hip bone — hip joint" },
        { en: "Tibia and patella — knee joint" },
      ],
    },
  },
  "biceps-brachii": {
    names: { la: "Musculus biceps brachii", he: "השריר הדו־ראשי של הזרוע" },
    aliases: { en: ["biceps"], he: ["דו ראשי", "ביספס"] },
    details: {
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
    },
  },
  "median-nerve": {
    names: { la: "Nervus medianus", he: "העצב המדיאני" },
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
  },
  "ulnar-nerve": {
    names: { la: "Nervus ulnaris", he: "עצב הגומד" },
    aliases: { he: ["העצב האולנרי"] },
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
  },
  "radial-nerve": {
    names: { la: "Nervus radialis", he: "עצב החישור" },
    aliases: { he: ["העצב הרדיאלי"] },
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
  },
  "brachial-artery": {
    names: { la: "Arteria brachialis", he: "עורק הזרוע" },
    aliases: { he: ["העורק הברכיאלי"] },
    details: {
      description: {
        en: "Continuation of the axillary artery from the inferior border of teres major. Divides in the cubital fossa into the radial and ulnar arteries.",
      },
      clinicalNote: {
        en: "Compressed with a cuff and auscultated when measuring blood pressure.",
      },
    },
  },
  heart: {
    names: { la: "Cor", he: "לב" },
    details: {
      description: {
        en: "Four-chambered muscular pump located in the middle mediastinum.",
      },
      bloodSupply: [{ en: "Right and left coronary arteries" }],
    },
  },
  lung: {
    names: { la: "Pulmo", he: "ריאה" },
    details: {
      description: {
        en: "Organ of gas exchange. The right lung has three lobes; the left lung has two.",
      },
    },
  },
  liver: {
    names: { la: "Hepar", he: "כבד" },
    details: {
      description: {
        en: "Largest gland of the body, mostly in the right upper quadrant of the abdomen.",
      },
      bloodSupply: [
        { en: "Hepatic artery proper" },
        { en: "Hepatic portal vein" },
      ],
    },
  },
} satisfies Record<string, ConceptContent>;

export type ConceptKey = keyof typeof CONCEPTS;

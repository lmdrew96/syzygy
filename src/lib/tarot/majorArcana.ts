export type MajorArcanaId =
  | "the-fool"
  | "the-magician"
  | "the-high-priestess"
  | "the-empress"
  | "the-emperor"
  | "the-hierophant"
  | "the-lovers"
  | "the-chariot"
  | "strength"
  | "the-hermit"
  | "wheel-of-fortune"
  | "justice"
  | "the-hanged-man"
  | "death"
  | "temperance"
  | "the-devil"
  | "the-tower"
  | "the-star"
  | "the-moon"
  | "the-sun"
  | "judgement"
  | "the-world";

export interface MajorArcanaCard {
  id: MajorArcanaId;
  numeral: number;
  name: string;
  /** Traditional upright keyword meanings (Rider-Waite/Golden Dawn tradition). */
  keywords: readonly string[];
  /** One-line traditional meaning, used as the seed for interpretive text. */
  meaning: string;
  /** Path under /public to this card's artwork. */
  artUrl: string;
}

// Traditional Rider-Waite/Golden Dawn upright meanings. Standalone reference —
// see correspondences.ts for the planetary/zodiac attribution table.
export const MAJOR_ARCANA: readonly MajorArcanaCard[] = [
  {
    id: "the-fool",
    numeral: 0,
    name: "The Fool",
    keywords: ["new beginnings", "innocence", "spontaneity", "a leap of faith", "freedom"],
    meaning: "A leap into the unknown, taken on trust rather than certainty.",
    artUrl: "/cards/the-fool.jpeg",
  },
  {
    id: "the-magician",
    numeral: 1,
    name: "The Magician",
    keywords: ["willpower", "manifestation", "resourcefulness", "skill", "action"],
    meaning: "Having every tool you need, and the will to use them.",
    artUrl: "/cards/the-magician.jpeg",
  },
  {
    id: "the-high-priestess",
    numeral: 2,
    name: "The High Priestess",
    keywords: ["intuition", "mystery", "subconscious", "hidden knowledge", "stillness"],
    meaning: "Knowledge that arrives before it can be explained.",
    artUrl: "/cards/the-high-priestess.jpeg",
  },
  {
    id: "the-empress",
    numeral: 3,
    name: "The Empress",
    keywords: ["abundance", "nurturing", "fertility", "creativity", "growth"],
    meaning: "Something is ready to grow, if it's given room.",
    artUrl: "/cards/the-empress.jpeg",
  },
  {
    id: "the-emperor",
    numeral: 4,
    name: "The Emperor",
    keywords: ["authority", "structure", "control", "stability", "discipline"],
    meaning: "Order imposed by will, so something steadier can stand.",
    artUrl: "/cards/the-emperor.jpeg",
  },
  {
    id: "the-hierophant",
    numeral: 5,
    name: "The Hierophant",
    keywords: ["tradition", "convention", "institutions", "belief systems", "teaching"],
    meaning: "What's inherited, taught, or agreed upon rather than invented.",
    artUrl: "/cards/the-hierophant.jpeg",
  },
  {
    id: "the-lovers",
    numeral: 6,
    name: "The Lovers",
    keywords: ["connection", "choice", "alignment of values", "union", "relationship"],
    meaning: "A choice that's really about which values you stand behind.",
    artUrl: "/cards/the-lovers.jpeg",
  },
  {
    id: "the-chariot",
    numeral: 7,
    name: "The Chariot",
    keywords: ["willpower", "drive", "victory through discipline", "direction", "momentum"],
    meaning: "Two opposing forces, driven forward by sheer will.",
    artUrl: "/cards/the-chariot.jpeg",
  },
  {
    id: "strength",
    numeral: 8,
    name: "Strength",
    keywords: ["courage", "patience", "inner resolve", "compassion over force", "gentleness"],
    meaning: "Power that persuades instead of overpowers.",
    artUrl: "/cards/strength.jpeg",
  },
  {
    id: "the-hermit",
    numeral: 9,
    name: "The Hermit",
    keywords: ["introspection", "solitude", "inner guidance", "withdrawal", "searching"],
    meaning: "Stepping back from the noise to hear your own answer.",
    artUrl: "/cards/the-hermit.jpeg",
  },
  {
    id: "wheel-of-fortune",
    numeral: 10,
    name: "Wheel of Fortune",
    keywords: ["cycles", "fate", "change", "turning points", "timing"],
    meaning: "A turn that was always coming, whether or not you asked for it.",
    artUrl: "/cards/wheel-of-fortune.jpeg",
  },
  {
    id: "justice",
    numeral: 11,
    name: "Justice",
    keywords: ["fairness", "truth", "cause and effect", "accountability", "balance"],
    meaning: "Consequences catching up with their causes.",
    artUrl: "/cards/justice.jpeg",
  },
  {
    id: "the-hanged-man",
    numeral: 12,
    name: "The Hanged Man",
    keywords: ["surrender", "new perspective", "suspension", "letting go", "pause"],
    meaning: "Seeing differently, because you finally stopped pushing.",
    artUrl: "/cards/the-hanged-man.jpeg",
  },
  {
    id: "death",
    numeral: 13,
    name: "Death",
    keywords: ["endings", "transformation", "release", "transition", "rebirth"],
    meaning: "One thing has to end cleanly for the next to begin.",
    artUrl: "/cards/death.jpeg",
  },
  {
    id: "temperance",
    numeral: 14,
    name: "Temperance",
    keywords: ["balance", "moderation", "patience", "synthesis", "integration"],
    meaning: "Two things blended slowly until they become one thing.",
    artUrl: "/cards/temperance.jpeg",
  },
  {
    id: "the-devil",
    numeral: 15,
    name: "The Devil",
    keywords: ["bondage", "materialism", "temptation", "self-imposed limits", "attachment"],
    meaning: "A chain you could take off, but haven't tried to yet.",
    artUrl: "/cards/the-devil.jpeg",
  },
  {
    id: "the-tower",
    numeral: 16,
    name: "The Tower",
    keywords: ["sudden upheaval", "revelation", "collapse", "false structures", "shock"],
    meaning: "A structure built on a lie comes down fast, not slow.",
    artUrl: "/cards/the-tower.jpeg",
  },
  {
    id: "the-star",
    numeral: 17,
    name: "The Star",
    keywords: ["hope", "renewal", "inspiration", "quiet faith", "healing"],
    meaning: "Quiet faith, returning after the wreckage clears.",
    artUrl: "/cards/the-star.jpeg",
  },
  {
    id: "the-moon",
    numeral: 18,
    name: "The Moon",
    keywords: ["illusion", "uncertainty", "the unconscious", "fear", "intuition"],
    meaning: "The path is real even when you can't see where it leads.",
    artUrl: "/cards/the-moon.jpeg",
  },
  {
    id: "the-sun",
    numeral: 19,
    name: "The Sun",
    keywords: ["joy", "vitality", "clarity", "success", "warmth"],
    meaning: "Nothing hidden, nothing needed — just what it is.",
    artUrl: "/cards/the-sun.jpeg",
  },
  {
    id: "judgement",
    numeral: 20,
    name: "Judgement",
    keywords: ["reckoning", "awakening", "calling", "self-evaluation", "renewal"],
    meaning: "A call you can no longer pretend not to have heard.",
    artUrl: "/cards/judgement.jpeg",
  },
  {
    id: "the-world",
    numeral: 21,
    name: "The World",
    keywords: ["completion", "wholeness", "fulfillment", "integration", "arrival"],
    meaning: "Every piece finally in its place, at least for now.",
    artUrl: "/cards/the-world.jpeg",
  },
] as const;

export function getCard(id: MajorArcanaId): MajorArcanaCard {
  const card = MAJOR_ARCANA.find((c) => c.id === id);
  if (!card) throw new Error(`Unknown Major Arcana id: ${id}`);
  return card;
}

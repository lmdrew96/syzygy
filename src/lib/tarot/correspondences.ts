import type { MajorArcanaId } from "./majorArcana";

export type Planet =
  | "Sun"
  | "Moon"
  | "Mercury"
  | "Venus"
  | "Mars"
  | "Jupiter"
  | "Saturn"
  | "Uranus"
  | "Neptune"
  | "Pluto";

export type ZodiacSign =
  | "Aries"
  | "Taurus"
  | "Gemini"
  | "Cancer"
  | "Leo"
  | "Virgo"
  | "Libra"
  | "Scorpio"
  | "Sagittarius"
  | "Capricorn"
  | "Aquarius"
  | "Pisces";

export type Element = "Fire" | "Water" | "Air" | "Earth";

export type Ruler =
  | { type: "planet"; planet: Planet }
  | { type: "zodiac"; sign: ZodiacSign; rulingPlanet: Planet }
  | { type: "element"; element: Element };

/**
 * The Major Arcana → planet/zodiac/element attribution from the Hermetic
 * Order of the Golden Dawn's "Book T" (the 22 paths on the Tree of Life),
 * the same scheme Waite-tradition tarot follows — e.g. The Empress↔Venus,
 * The Tower↔Mars, The Star↔Aquarius. This is the single source of truth for
 * every downstream system (draw weighting, edge formation, interpretive
 * text) — do not duplicate or reinvent it elsewhere.
 *
 * Zodiac-attributed cards also carry that sign's classical ruling planet
 * (used for edge-strength weighting against today's real transits). Three
 * cards carry a pure element instead of a planet/sign, per the same scheme
 * (there is no Major Arcana card for Earth).
 */
export const CORRESPONDENCES: Record<MajorArcanaId, Ruler> = {
  "the-fool": { type: "element", element: "Air" },
  "the-magician": { type: "planet", planet: "Mercury" },
  "the-high-priestess": { type: "planet", planet: "Moon" },
  "the-empress": { type: "planet", planet: "Venus" },
  "the-emperor": { type: "zodiac", sign: "Aries", rulingPlanet: "Mars" },
  "the-hierophant": { type: "zodiac", sign: "Taurus", rulingPlanet: "Venus" },
  "the-lovers": { type: "zodiac", sign: "Gemini", rulingPlanet: "Mercury" },
  "the-chariot": { type: "zodiac", sign: "Cancer", rulingPlanet: "Moon" },
  strength: { type: "zodiac", sign: "Leo", rulingPlanet: "Sun" },
  "the-hermit": { type: "zodiac", sign: "Virgo", rulingPlanet: "Mercury" },
  "wheel-of-fortune": { type: "planet", planet: "Jupiter" },
  justice: { type: "zodiac", sign: "Libra", rulingPlanet: "Venus" },
  "the-hanged-man": { type: "element", element: "Water" },
  death: { type: "zodiac", sign: "Scorpio", rulingPlanet: "Mars" },
  temperance: { type: "zodiac", sign: "Sagittarius", rulingPlanet: "Jupiter" },
  "the-devil": { type: "zodiac", sign: "Capricorn", rulingPlanet: "Saturn" },
  "the-tower": { type: "planet", planet: "Mars" },
  "the-star": { type: "zodiac", sign: "Aquarius", rulingPlanet: "Saturn" },
  "the-moon": { type: "zodiac", sign: "Pisces", rulingPlanet: "Jupiter" },
  "the-sun": { type: "planet", planet: "Sun" },
  judgement: { type: "element", element: "Fire" },
  "the-world": { type: "planet", planet: "Saturn" },
};

const OPPOSING_SIGNS: Record<ZodiacSign, ZodiacSign> = {
  Aries: "Libra",
  Libra: "Aries",
  Taurus: "Scorpio",
  Scorpio: "Taurus",
  Gemini: "Sagittarius",
  Sagittarius: "Gemini",
  Cancer: "Capricorn",
  Capricorn: "Cancer",
  Leo: "Aquarius",
  Aquarius: "Leo",
  Virgo: "Pisces",
  Pisces: "Virgo",
};

const OPPOSING_ELEMENTS: Record<Element, Element> = {
  Fire: "Water",
  Water: "Fire",
  Air: "Earth",
  Earth: "Air",
};

/** The planet that ultimately governs a card — direct, or via its zodiac sign's rulership. Null for element cards. */
export function effectivePlanet(ruler: Ruler): Planet | null {
  if (ruler.type === "planet") return ruler.planet;
  if (ruler.type === "zodiac") return ruler.rulingPlanet;
  return null;
}

export function areOpposingSigns(a: ZodiacSign, b: ZodiacSign): boolean {
  return OPPOSING_SIGNS[a] === b;
}

export function areOpposingElements(a: Element, b: Element): boolean {
  return OPPOSING_ELEMENTS[a] === b;
}

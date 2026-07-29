import type { NatalChart, TransitSnapshot } from "../stellation/client";
import { ZODIAC_ORDER, type ZodiacSign } from "./correspondences";

export type NatalTransitAspectType = "conjunction" | "sextile" | "square" | "trine" | "opposition";

export interface NatalTransitAspect {
  transitingPlanet: string;
  natalPlanet: string;
  aspectType: NatalTransitAspectType;
  exactAngle: number;
  orb: number;
}

// Matches graph.ts's MAX_ORB_DEGREES — Stellation's own aspect orbs run up to ~8deg.
const MAX_ORB_DEGREES = 8;

const ASPECT_ANGLES: Record<NatalTransitAspectType, number> = {
  conjunction: 0,
  sextile: 60,
  square: 90,
  trine: 120,
  opposition: 180,
};

function absoluteLongitude(sign: string, degreeInSign: number): number {
  const index = ZODIAC_ORDER.indexOf(sign as ZodiacSign);
  return (index === -1 ? 0 : index * 30) + degreeInSign;
}

function angularSeparation(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Classifies the angular separation between every transiting/natal planet
 * pair into a major aspect within MAX_ORB_DEGREES. No applying/separating
 * distinction — that needs planetary-speed data Stellation doesn't return.
 */
export function computeNatalTransitAspects(
  natal: NatalChart,
  transits: TransitSnapshot,
): NatalTransitAspect[] {
  const aspects: NatalTransitAspect[] = [];

  for (const transiting of transits.planets) {
    const transitingLon = absoluteLongitude(transiting.sign, transiting.degreeInSign);

    for (const natalPlanet of natal.planets) {
      const natalLon = absoluteLongitude(natalPlanet.sign, natalPlanet.degreeInSign);
      const separation = angularSeparation(transitingLon, natalLon);

      let bestType: NatalTransitAspectType | null = null;
      let bestOrb = Infinity;
      for (const [type, angle] of Object.entries(ASPECT_ANGLES) as Array<
        [NatalTransitAspectType, number]
      >) {
        const orb = Math.abs(separation - angle);
        if (orb <= MAX_ORB_DEGREES && orb < bestOrb) {
          bestType = type;
          bestOrb = orb;
        }
      }

      if (bestType) {
        aspects.push({
          transitingPlanet: transiting.name,
          natalPlanet: natalPlanet.name,
          aspectType: bestType,
          exactAngle: ASPECT_ANGLES[bestType],
          orb: bestOrb,
        });
      }
    }
  }

  return aspects;
}

const ASPECT_VERB: Record<NatalTransitAspectType, string> = {
  conjunction: "conjunct",
  sextile: "sextile",
  square: "square",
  trine: "trine",
  opposition: "opposite",
};

/** e.g. "transiting Saturn is conjunct your natal Sun" */
export function describeNatalTransitAspect(aspect: NatalTransitAspect): string {
  return `transiting ${aspect.transitingPlanet} is ${ASPECT_VERB[aspect.aspectType]} your natal ${aspect.natalPlanet}`;
}

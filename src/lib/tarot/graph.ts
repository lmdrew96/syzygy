import type { MajorArcanaId } from "./majorArcana";
import {
  CORRESPONDENCES,
  effectivePlanet,
  areOpposingSigns,
  areOpposingElements,
  type Planet,
} from "./correspondences";
import type { TransitSnapshot } from "../stellation/client";

export interface GraphEdge {
  from: MajorArcanaId;
  to: MajorArcanaId;
  weight: number;
  reason: "shared-ruler" | "opposing-sign" | "opposing-element";
}

const BASE_SHARED_RULER_WEIGHT = 3;
const BASE_OPPOSITION_WEIGHT = 2;
// Stellation's aspect orbs run up to ~8deg; a 0deg (exact) aspect maxes this out.
const MAX_ORB_DEGREES = 8;

/**
 * How "loud" each planet is in today's sky: the sum, across every aspect it
 * participates in, of how exact that aspect is. A planet in several tight
 * aspects today scores higher than one sitting alone — this is what makes
 * edge strength shift with the real transits instead of being static.
 */
function planetProminence(transits: TransitSnapshot | null): Partial<Record<Planet, number>> {
  const prominence: Partial<Record<Planet, number>> = {};
  if (!transits) return prominence;

  for (const aspect of transits.aspects) {
    const exactness = Math.max(0, MAX_ORB_DEGREES - aspect.orb);
    for (const name of [aspect.planetA, aspect.planetB]) {
      const planet = name as Planet;
      prominence[planet] = (prominence[planet] ?? 0) + exactness;
    }
  }

  return prominence;
}

/**
 * Forms edges between drawn cards based on shared or opposing astrological
 * rulers (Golden Dawn correspondence table), strengthened by whichever
 * planets are prominent in today's live transits.
 */
export function buildGraph(
  cardIds: readonly MajorArcanaId[],
  transits: TransitSnapshot | null,
): GraphEdge[] {
  const prominence = planetProminence(transits);
  const edges: GraphEdge[] = [];

  for (let i = 0; i < cardIds.length; i++) {
    for (let j = i + 1; j < cardIds.length; j++) {
      const a = cardIds[i];
      const b = cardIds[j];
      const rulerA = CORRESPONDENCES[a];
      const rulerB = CORRESPONDENCES[b];
      const planetA = effectivePlanet(rulerA);
      const planetB = effectivePlanet(rulerB);

      if (planetA && planetB && planetA === planetB) {
        const boost = prominence[planetA] ?? 0;
        edges.push({ from: a, to: b, weight: BASE_SHARED_RULER_WEIGHT + boost, reason: "shared-ruler" });
        continue;
      }

      if (rulerA.type === "zodiac" && rulerB.type === "zodiac" && areOpposingSigns(rulerA.sign, rulerB.sign)) {
        const boost = (prominence[rulerA.rulingPlanet] ?? 0) + (prominence[rulerB.rulingPlanet] ?? 0);
        edges.push({ from: a, to: b, weight: BASE_OPPOSITION_WEIGHT + boost, reason: "opposing-sign" });
        continue;
      }

      if (rulerA.type === "element" && rulerB.type === "element" && areOpposingElements(rulerA.element, rulerB.element)) {
        edges.push({ from: a, to: b, weight: BASE_OPPOSITION_WEIGHT, reason: "opposing-element" });
      }
    }
  }

  return edges;
}

import { createSeededRng } from "./rng";
import type { MajorArcanaId } from "./majorArcana";

export interface CardPosition {
  cardId: MajorArcanaId;
  /** Normalized 0–1 coordinates within the constellation canvas. */
  x: number;
  y: number;
}

const MARGIN = 0.12;
const MIN_DISTANCE = 0.18;
const MAX_ATTEMPTS = 30;

/**
 * Scatters drawn cards across the canvas deterministically (seeded by the
 * same input+date seed as the draw), with light rejection sampling so stars
 * don't land directly on top of each other.
 */
export function layoutCards(cardIds: readonly MajorArcanaId[], seed: string): CardPosition[] {
  const rng = createSeededRng(`${seed}|layout`);
  const positions: CardPosition[] = [];

  for (const cardId of cardIds) {
    let x = 0.5;
    let y = 0.5;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      x = MARGIN + rng() * (1 - MARGIN * 2);
      y = MARGIN + rng() * (1 - MARGIN * 2);
      const tooClose = positions.some((p) => Math.hypot(p.x - x, p.y - y) < MIN_DISTANCE);
      if (!tooClose) break;
    }
    positions.push({ cardId, x, y });
  }

  return positions;
}

import type { MajorArcanaId } from "./majorArcana";
import type { GraphEdge } from "./graph";

export interface WalkStep {
  cardId: MajorArcanaId;
  /** Weight of the correspondence edge connecting this step to the previous one; null for the first step or an unconnected jump. */
  connectionWeight: number | null;
}

/**
 * Traces a single path across the drawn cards, starting at the most
 * astrologically "loud" card (highest total edge weight) and always moving
 * along the strongest available correspondence edge to an unvisited card.
 * When a component of the graph is exhausted, jumps to the next
 * most-connected remaining card rather than stopping early.
 */
export function buildWalk(
  cardIds: readonly MajorArcanaId[],
  edges: readonly GraphEdge[],
): WalkStep[] {
  if (cardIds.length === 0) return [];

  const weightBetween = new Map<string, number>();
  for (const edge of edges) {
    weightBetween.set(`${edge.from}|${edge.to}`, edge.weight);
    weightBetween.set(`${edge.to}|${edge.from}`, edge.weight);
  }

  const totalWeight = new Map<MajorArcanaId, number>();
  for (const id of cardIds) totalWeight.set(id, 0);
  for (const edge of edges) {
    totalWeight.set(edge.from, (totalWeight.get(edge.from) ?? 0) + edge.weight);
    totalWeight.set(edge.to, (totalWeight.get(edge.to) ?? 0) + edge.weight);
  }

  const byTotalWeightDesc = (a: MajorArcanaId, b: MajorArcanaId) =>
    (totalWeight.get(b) ?? 0) - (totalWeight.get(a) ?? 0);

  const remaining = new Set(cardIds);
  let current = [...remaining].sort(byTotalWeightDesc)[0];
  remaining.delete(current);

  const walk: WalkStep[] = [{ cardId: current, connectionWeight: null }];

  while (remaining.size > 0) {
    let next: MajorArcanaId | null = null;
    let bestWeight = -Infinity;
    for (const candidate of remaining) {
      const w = weightBetween.get(`${current}|${candidate}`);
      if (w !== undefined && w > bestWeight) {
        bestWeight = w;
        next = candidate;
      }
    }

    if (next === null) {
      next = [...remaining].sort(byTotalWeightDesc)[0];
      walk.push({ cardId: next, connectionWeight: null });
    } else {
      walk.push({ cardId: next, connectionWeight: bestWeight });
    }

    current = next;
    remaining.delete(next);
  }

  return walk;
}

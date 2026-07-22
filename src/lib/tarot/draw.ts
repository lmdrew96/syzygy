import { MAJOR_ARCANA, type MajorArcanaId } from "./majorArcana";
import { createSeededRng } from "./rng";

export interface DrawParams {
  inputText: string;
  question?: string;
  /**
   * Breaks pure input-reproducibility ahead of real transit weighting
   * (patches 3–4). Defaults to today's date so the same input still draws
   * differently across days.
   */
  dateSeed?: string;
}

export interface DrawnCard {
  id: MajorArcanaId;
  weight: number;
}

const MIN_DRAW = 3;
const MAX_DRAW = 7;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((token) => token.length >= 3);
}

function keywordScore(cardKeywords: readonly string[], tokens: string[]): number {
  const keywordText = cardKeywords.join(" ").toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (keywordText.includes(token)) score += 2;
  }
  return score;
}

/**
 * Draws 3–7 Major Arcana, weighted by textual overlap between the input
 * (+ optional question) and each card's traditional keywords, plus a seeded
 * jitter so the draw isn't purely keyword-deterministic. Not uniform random.
 */
export function drawCards(params: DrawParams): DrawnCard[] {
  const {
    inputText,
    question = "",
    dateSeed = new Date().toISOString().slice(0, 10),
  } = params;

  const seed = `${inputText}|${question}|${dateSeed}`;
  const rng = createSeededRng(seed);
  const tokens = tokenize(`${inputText} ${question}`);

  const pool = MAJOR_ARCANA.map((card) => {
    const keywordBoost = keywordScore(card.keywords, tokens);
    const jitter = rng() * 1.5;
    return { id: card.id, weight: 1 + keywordBoost + jitter };
  });

  const drawCount = MIN_DRAW + Math.floor(rng() * (MAX_DRAW - MIN_DRAW + 1));

  const drawn: DrawnCard[] = [];
  for (let i = 0; i < drawCount && pool.length > 0; i++) {
    const totalWeight = pool.reduce((sum, c) => sum + c.weight, 0);
    let roll = rng() * totalWeight;
    let pickIndex = pool.length - 1;
    for (let j = 0; j < pool.length; j++) {
      roll -= pool[j].weight;
      if (roll <= 0) {
        pickIndex = j;
        break;
      }
    }
    drawn.push(pool[pickIndex]);
    pool.splice(pickIndex, 1);
  }

  return drawn;
}

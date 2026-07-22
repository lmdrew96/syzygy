import Anthropic from "@anthropic-ai/sdk";
import { headers } from "next/headers";
import type { MajorArcanaCard } from "./majorArcana";
import { CORRESPONDENCES, effectivePlanet, type Planet } from "./correspondences";
import type { TransitSnapshot } from "../stellation/client";
import { createSeededRng } from "./rng";
import { isRateLimited } from "../rateLimit";

const CLAUDE_MODEL = "claude-sonnet-5";

const PLANET_DOMAIN: Record<Planet, string> = {
  Sun: "identity and vitality",
  Moon: "instinct and feeling",
  Mercury: "thought and communication",
  Venus: "connection and desire",
  Mars: "drive and conflict",
  Jupiter: "growth and excess",
  Saturn: "structure and restriction",
  Uranus: "disruption and awakening",
  Neptune: "dreams and dissolution",
  Pluto: "power and transformation",
};

function rulerClause(card: MajorArcanaCard, rng: () => number): string {
  const ruler = CORRESPONDENCES[card.id];

  if (ruler.type === "planet") {
    const variants = [
      `ruled by ${ruler.planet}, the planet of ${PLANET_DOMAIN[ruler.planet]}`,
      `carrying ${ruler.planet}'s signature — ${PLANET_DOMAIN[ruler.planet]}`,
    ];
    return variants[Math.floor(rng() * variants.length)];
  }

  if (ruler.type === "zodiac") {
    const variants = [
      `tied to ${ruler.sign}, governed by ${ruler.rulingPlanet}`,
      `speaking in ${ruler.sign}'s voice, under ${ruler.rulingPlanet}'s rule`,
    ];
    return variants[Math.floor(rng() * variants.length)];
  }

  const variants = [
    `carrying the element of ${ruler.element}`,
    `moving with pure ${ruler.element}`,
  ];
  return variants[Math.floor(rng() * variants.length)];
}

function transitClause(
  card: MajorArcanaCard,
  transits: TransitSnapshot | null,
  rng: () => number,
): string | null {
  if (!transits) return null;
  const planet = effectivePlanet(CORRESPONDENCES[card.id]);
  if (!planet) return null;
  const position = transits.planets.find((p) => p.name === planet);
  if (!position) return null;

  const motion = position.retrograde
    ? ["turned inward and retrograde", "pulled backward, retrograde"]
    : ["moving forward at full strength", "direct and unobstructed"];

  const variants = [
    `${planet} is passing through ${position.sign} right now, ${motion[Math.floor(rng() * motion.length)]}`,
    `today ${planet} sits in ${position.sign}, ${motion[Math.floor(rng() * motion.length)]}`,
  ];

  return variants[Math.floor(rng() * variants.length)];
}

/** One woven sentence per card — meaning, ruler, and today's transit in a single fragment, not stapled-together blurbs. */
export function interpretCard(
  card: MajorArcanaCard,
  transits: TransitSnapshot | null,
  seed: string,
): string {
  const rng = createSeededRng(`${seed}|interpret|${card.id}`);
  const ruler = rulerClause(card, rng);
  const transit = transitClause(card, transits, rng);

  const base = `${card.name}: ${card.meaning} It's ${ruler}.`;
  if (!transit) return base;
  return `${base} ${transit.charAt(0).toUpperCase()}${transit.slice(1)}.`;
}

/** Deterministic template weave — no external calls, always available. */
export function interpretReading(
  cards: readonly MajorArcanaCard[],
  transits: TransitSnapshot | null,
  seed: string,
): string {
  return cards.map((card) => interpretCard(card, transits, seed)).join(" ");
}

function describeCardForPrompt(card: MajorArcanaCard, transits: TransitSnapshot | null): string {
  const ruler = CORRESPONDENCES[card.id];
  const planet = effectivePlanet(ruler);
  const position = planet ? transits?.planets.find((p) => p.name === planet) : undefined;

  const rulerDesc =
    ruler.type === "planet"
      ? `ruled by ${ruler.planet}`
      : ruler.type === "zodiac"
        ? `tied to ${ruler.sign} (ruled by ${ruler.rulingPlanet})`
        : `carries the element of ${ruler.element}`;

  const transitDesc = position
    ? `${position.retrograde ? "retrograde" : "direct"} in ${position.sign}`
    : "no live transit data";

  return `- ${card.name} — traditional meaning: "${card.meaning}" — ${rulerDesc} — today: ${transitDesc}`;
}

async function generateWithClaude(
  cards: readonly MajorArcanaCard[],
  transits: TransitSnapshot | null,
  input: string,
  question: string | undefined,
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) return null;

  const userContent = [
    `Input: ${input}`,
    question ? `Question: ${question}` : null,
    "",
    "Drawn cards (in walk order):",
    ...cards.map((card) => describeCardForPrompt(card, transits)),
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 700,
      thinking: { type: "disabled" },
      system:
        "You write short tarot-and-astrology readings for Syzygy, a generative oracle app. " +
        "Weave each card's traditional meaning together with its planetary/zodiac resonance and " +
        "today's actual transit position into ONE flowing reading — never two stapled-together " +
        "blurbs of 'tarot says X, astrology says Y'. Reference the user's input and question " +
        "naturally where it fits. Address the reader directly. 150-250 words. No headers, no " +
        "bullet points, no disclaimers, no meta-commentary about being an AI — just the reading.",
      messages: [{ role: "user", content: userContent }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock?.type === "text" ? textBlock.text.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Generates the reading's interpretive text via Claude when ANTHROPIC_API_KEY
 * is set, falling back to the deterministic template weave otherwise (missing
 * key, rate-limited, or a failed API call all degrade the same way).
 */
export async function generateInterpretation(
  cards: readonly MajorArcanaCard[],
  transits: TransitSnapshot | null,
  input: string,
  question: string | undefined,
  seed: string,
): Promise<string> {
  const aiResult = await generateWithClaude(cards, transits, input, question);
  return aiResult ?? interpretReading(cards, transits, seed);
}

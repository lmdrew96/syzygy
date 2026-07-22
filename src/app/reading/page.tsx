import Image from "next/image";
import { redirect } from "next/navigation";
import { drawCards } from "@/lib/tarot/draw";
import { getCard } from "@/lib/tarot/majorArcana";
import { buildGraph } from "@/lib/tarot/graph";
import { buildWalk } from "@/lib/tarot/walk";
import { layoutCards } from "@/lib/tarot/layout";
import { getCurrentTransits, type TransitSnapshot } from "@/lib/stellation/client";
import { generateInterpretation } from "@/lib/tarot/interpret";
import { ConstellationCanvas } from "@/components/ConstellationCanvas";

type ReadingPageProps = {
  searchParams: Promise<{ input?: string; question?: string }>;
};

export default async function ReadingPage({ searchParams }: ReadingPageProps) {
  const { input, question } = await searchParams;
  if (!input) redirect("/");

  const dateSeed = new Date().toISOString().slice(0, 10);
  const seed = `${input}|${question ?? ""}|${dateSeed}`;

  const drawn = drawCards({ inputText: input, question, dateSeed });
  const cardIds = drawn.map((d) => d.id);
  const cards = drawn.map((d) => getCard(d.id));

  let transits: TransitSnapshot | null = null;
  let transitError: string | null = null;
  try {
    transits = await getCurrentTransits();
  } catch {
    transitError = "Couldn't reach Stellation for today's sky — is its backend running?";
  }

  const edges = buildGraph(cardIds, transits).sort((a, b) => b.weight - a.weight);
  const walk = buildWalk(cardIds, edges);
  const positions = layoutCards(cardIds, seed);
  const walkCards = walk.map((step) => getCard(step.cardId));

  const interpretation = await generateInterpretation(walkCards, transits, input, question, seed);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
        Reading for
      </p>
      <h1 className="mt-2 text-center font-display text-3xl text-star-silver">
        {input}
      </h1>
      {question && (
        <p className="mt-2 max-w-md text-center text-sm text-foreground-muted">
          &ldquo;{question}&rdquo;
        </p>
      )}

      <div className="mt-10 w-full max-w-2xl">
        <ConstellationCanvas cards={cards} positions={positions} walk={walk} />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-6">
        {cards.map((card) => (
          <div key={card.id} className="flex w-28 flex-col items-center gap-2">
            <div className="relative aspect-[3/5] w-28 overflow-hidden rounded-lg border border-line-violet/40 bg-surface">
              <Image
                src={card.artUrl}
                alt={card.name}
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>
            <p className="text-center text-xs text-foreground-muted">
              {card.name}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-12 w-full max-w-md">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-foreground-muted">
          Today&apos;s sky
        </p>
        {transitError && (
          <p className="mt-3 text-center text-sm text-star-gold">{transitError}</p>
        )}
        {transits && (
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-foreground-muted">
            {transits.planets.map((p) => (
              <li key={p.name} className="flex justify-between">
                <span>{p.name}</span>
                <span>
                  {p.sign} {p.degreeInSign.toFixed(1)}°{p.retrograde ? " ℞" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12 w-full max-w-md">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-foreground-muted">
          Correspondence graph
        </p>
        {edges.length === 0 ? (
          <p className="mt-3 text-center text-sm text-foreground-muted">
            No shared or opposing rulers among this draw.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1 text-sm text-foreground-muted">
            {edges.map((edge) => {
              const from = getCard(edge.from);
              const to = getCard(edge.to);
              return (
                <li key={`${edge.from}-${edge.to}`} className="flex justify-between gap-4">
                  <span>
                    {from.name} — {to.name}
                  </span>
                  <span className="whitespace-nowrap text-star-gold">
                    {edge.reason.replace("-", " ")} · {edge.weight.toFixed(1)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-12 max-w-lg">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-foreground-muted">
          The reading
        </p>
        <p className="mt-3 whitespace-pre-line text-center font-display text-lg leading-relaxed text-foreground">
          {interpretation}
        </p>
      </section>
    </main>
  );
}

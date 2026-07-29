import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { drawCards } from "@/lib/tarot/draw";
import { getCard } from "@/lib/tarot/majorArcana";
import { buildGraph } from "@/lib/tarot/graph";
import { buildWalk } from "@/lib/tarot/walk";
import { layoutCards } from "@/lib/tarot/layout";
import { getCurrentTransits, type NatalChart, type TransitSnapshot } from "@/lib/stellation/client";
import { generateInterpretation } from "@/lib/tarot/interpret";
import {
  computeNatalTransitAspects,
  describeNatalTransitAspect,
  type NatalTransitAspect,
} from "@/lib/tarot/natalTransits";
import { ConstellationCanvas } from "@/components/ConstellationCanvas";
import { CardGallery } from "@/components/CardGallery";
import { SaveReadingButton } from "@/components/SaveReadingButton";

/**
 * Fetches the signed-in user's cached natal chart for a per-user Convex
 * read from this server component. Requires forwarding the Clerk session
 * token into fetchQuery (src/proxy.ts wires up clerkMiddleware so auth()
 * works here) — returns null for anonymous users or anyone without a ready
 * chart, same as having no birth data at all.
 */
async function fetchNatalChart(): Promise<NatalChart | null> {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return null;
  }
  try {
    const { getToken } = await auth();
    const token = (await getToken({ template: "convex" })) ?? undefined;
    if (!token) return null;

    const profile = await fetchQuery(api.natal.getMyBirthProfile, {}, { token });
    if (profile?.chartStatus === "ready" && profile.natalChart) {
      return profile.natalChart as NatalChart;
    }
    return null;
  } catch {
    return null;
  }
}

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

  const natal = await fetchNatalChart();
  const natalTransitAspects: NatalTransitAspect[] | null =
    natal && transits ? computeNatalTransitAspects(natal, transits) : null;

  const edges = buildGraph(cardIds, transits).sort((a, b) => b.weight - a.weight);
  const walk = buildWalk(cardIds, edges);
  const positions = layoutCards(cardIds, seed);
  const walkCards = walk.map((step) => getCard(step.cardId));

  const interpretation = await generateInterpretation(
    walkCards,
    transits,
    input,
    question,
    seed,
    natal,
    natalTransitAspects,
  );

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-celestial-silver">
        Reading for
      </p>
      <h1 className="mt-2 text-center font-display text-3xl text-starlight-lilac">
        {input}
      </h1>
      {question && (
        <p className="mt-2 max-w-md text-center text-sm text-celestial-silver">
          &ldquo;{question}&rdquo;
        </p>
      )}

      <div className="mt-10 w-full max-w-2xl">
        <ConstellationCanvas cards={cards} positions={positions} walk={walk} />
      </div>

      <div className="mt-8">
        <CardGallery cards={cards} />
      </div>

      <section className="mt-12 w-full max-w-md">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-celestial-silver">
          Today&apos;s sky
        </p>
        {transitError && (
          <p className="mt-3 text-center text-sm text-star-gold">{transitError}</p>
        )}
        {transits && (
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-celestial-silver">
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
        <p className="text-center text-xs uppercase tracking-[0.2em] text-celestial-silver">
          Correspondence graph
        </p>
        {edges.length === 0 ? (
          <p className="mt-3 text-center text-sm text-celestial-silver">
            No shared or opposing rulers among this draw.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1 text-sm text-celestial-silver">
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

      {natal && (
        <section className="mt-12 w-full max-w-md">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-celestial-silver">
            Your chart today
          </p>
          {natalTransitAspects && natalTransitAspects.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-1 text-sm text-celestial-silver">
              {natalTransitAspects.map((aspect, i) => (
                <li key={`${aspect.transitingPlanet}-${aspect.natalPlanet}-${i}`}>
                  {describeNatalTransitAspect(aspect)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-center text-sm text-celestial-silver">
              No notable aspects between today&apos;s sky and your chart.
            </p>
          )}
        </section>
      )}

      <section className="mt-12 max-w-lg">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-celestial-silver">
          The reading
        </p>
        <p className="mt-3 whitespace-pre-line text-center font-sans text-lg leading-relaxed text-aged-parchment">
          {interpretation}
        </p>
      </section>

      <div className="mt-10">
        <SaveReadingButton
          inputText={input}
          question={question}
          cardIds={cardIds}
          positions={positions}
          edges={edges}
          walk={walk}
          transits={transits}
          interpretiveText={interpretation}
        />
      </div>
    </main>
  );
}

import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { getCard, type MajorArcanaId } from "@/lib/tarot/majorArcana";
import { ConstellationCanvas } from "@/components/ConstellationCanvas";
import { CardGallery } from "@/components/CardGallery";

type SavedReadingPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SavedReadingPage({ params }: SavedReadingPageProps) {
  const { id } = await params;

  let reading;
  try {
    reading = await fetchQuery(api.readings.get, { id: id as Id<"readings"> });
  } catch {
    notFound();
  }
  if (!reading) notFound();

  const cards = reading.cardIds.map((cardId) => getCard(cardId as MajorArcanaId));
  const positions = reading.positions.map((p) => ({
    ...p,
    cardId: p.cardId as MajorArcanaId,
  }));
  const walk = reading.walkPath.map((step) => ({
    cardId: step.cardId as MajorArcanaId,
    connectionWeight: step.connectionWeight ?? null,
  }));

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-celestial-silver">
        Saved reading for
      </p>
      <h1 className="mt-2 text-center font-display text-3xl text-starlight-lilac">
        {reading.inputText}
      </h1>
      {reading.inputQuestion && (
        <p className="mt-2 max-w-md text-center text-sm text-celestial-silver">
          &ldquo;{reading.inputQuestion}&rdquo;
        </p>
      )}

      <div className="mt-10 w-full max-w-2xl">
        <ConstellationCanvas cards={cards} positions={positions} walk={walk} />
      </div>

      <div className="mt-8">
        <CardGallery cards={cards} />
      </div>

      <section className="mt-12 max-w-lg">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-celestial-silver">
          The reading
        </p>
        <p className="mt-3 whitespace-pre-line text-center font-sans text-lg leading-relaxed text-aged-parchment">
          {reading.interpretiveText}
        </p>
      </section>

      <p className="mt-10 text-xs text-celestial-silver">
        Saved {new Date(reading._creationTime).toLocaleDateString()}
      </p>
    </main>
  );
}

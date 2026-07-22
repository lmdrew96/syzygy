import Image from "next/image";
import { redirect } from "next/navigation";
import { drawCards } from "@/lib/tarot/draw";
import { getCard } from "@/lib/tarot/majorArcana";

type ReadingPageProps = {
  searchParams: Promise<{ input?: string; question?: string }>;
};

export default async function ReadingPage({ searchParams }: ReadingPageProps) {
  const { input, question } = await searchParams;
  if (!input) redirect("/");

  const drawn = drawCards({ inputText: input, question });
  const cards = drawn.map((d) => getCard(d.id));

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

      <div className="mt-12 flex flex-wrap justify-center gap-6">
        {cards.map((card) => (
          <div key={card.id} className="flex w-32 flex-col items-center gap-2">
            <div className="relative aspect-[3/5] w-32 overflow-hidden rounded-lg border border-line-violet/40 bg-surface">
              <Image
                src={card.artUrl}
                alt={card.name}
                fill
                sizes="128px"
                className="object-cover"
              />
            </div>
            <p className="text-center text-xs text-foreground-muted">
              {card.name}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-10 max-w-md text-center text-sm text-foreground-muted">
        The constellation graph and live transit weighting aren&apos;t wired
        up yet — this is a plain keyword-weighted draw.
      </p>
    </main>
  );
}

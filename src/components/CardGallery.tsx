"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { MajorArcanaCard } from "@/lib/tarot/majorArcana";

export function CardGallery({ cards }: { cards: MajorArcanaCard[] }) {
  const [selected, setSelected] = useState<MajorArcanaCard | null>(null);

  useEffect(() => {
    if (!selected) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  return (
    <>
      <div className="flex flex-wrap justify-center gap-6">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setSelected(card)}
            className="flex w-28 cursor-pointer flex-col items-center gap-2 text-left transition-transform hover:-translate-y-1"
          >
            <div className="relative aspect-[3/5] w-28 overflow-hidden rounded-lg border border-dusty-plum/40 bg-dusty-plum">
              <Image
                src={card.artUrl}
                alt={card.name}
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>
            <p className="text-center text-xs text-celestial-silver">{card.name}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-blue/80 px-6 py-12 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-dusty-plum/40 bg-forest-moss p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[3/5] w-56 overflow-hidden rounded-lg border border-starlight-lilac/60 shadow-[0_0_50px_rgba(194,163,104,0.25)]">
              <Image
                src={selected.artUrl}
                alt={selected.name}
                fill
                sizes="224px"
                className="object-cover"
              />
            </div>
            <h2 className="text-center font-display text-2xl text-starlight-lilac">
              {selected.name}
            </h2>
            <p className="text-center text-sm text-celestial-silver">{selected.meaning}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {selected.keywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded-full border border-dusty-plum/40 px-2 py-0.5 text-xs text-celestial-silver"
                >
                  {kw}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-2 text-xs uppercase tracking-[0.2em] text-celestial-silver transition-colors hover:text-aged-parchment"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

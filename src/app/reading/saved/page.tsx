"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery, Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import { getCard, type MajorArcanaId } from "@/lib/tarot/majorArcana";

export default function SavedReadingsPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <h1 className="font-display text-3xl text-starlight-lilac">Saved readings</h1>

      <AuthLoading>
        <p className="mt-8 text-sm text-celestial-silver">Loading…</p>
      </AuthLoading>

      <Unauthenticated>
        <p className="mt-8 text-sm text-celestial-silver">
          Sign in to see your saved readings.
        </p>
        <SignInButton mode="modal">
          <button
            type="button"
            className="mt-4 rounded-md border border-dusty-plum/40 px-4 py-2 text-sm text-celestial-silver transition-colors hover:border-starlight-lilac hover:text-aged-parchment"
          >
            Sign in
          </button>
        </SignInButton>
      </Unauthenticated>

      <Authenticated>
        <ReadingsList />
      </Authenticated>
    </main>
  );
}

function ReadingsList() {
  const readings = useQuery(api.readings.listByUser);

  if (readings === undefined) {
    return <p className="mt-8 text-sm text-celestial-silver">Loading…</p>;
  }

  if (readings.length === 0) {
    return (
      <p className="mt-8 text-sm text-celestial-silver">
        No saved readings yet.
      </p>
    );
  }

  return (
    <div className="mt-10 flex w-full max-w-2xl flex-col gap-4">
      {readings.map((reading) => (
        <Link
          key={reading._id}
          href={`/reading/saved/${reading._id}`}
          className="flex items-center gap-4 rounded-md border border-dusty-plum/40 bg-dusty-plum px-4 py-3 transition-colors hover:border-starlight-lilac"
        >
          <div className="flex -space-x-4">
            {reading.cardIds.slice(0, 3).map((cardId, i) => {
              const card = getCard(cardId as MajorArcanaId);
              return (
                <div
                  key={`${cardId}-${i}`}
                  className="relative aspect-[3/5] w-10 overflow-hidden rounded border border-dusty-plum/40 bg-dusty-plum"
                  style={{ zIndex: 3 - i }}
                >
                  <Image
                    src={card.artUrl}
                    alt={card.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
              );
            })}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-aged-parchment">{reading.inputText}</p>
            <p className="text-xs text-celestial-silver">
              {new Date(reading._creationTime).toLocaleDateString()}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

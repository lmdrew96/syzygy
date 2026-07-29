"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import type { NatalChart } from "@/lib/stellation/client";

export default function ChartPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <h1 className="font-display text-3xl text-starlight-lilac">My Chart</h1>

      <AuthLoading>
        <p className="mt-8 text-sm text-celestial-silver">Loading…</p>
      </AuthLoading>

      <Unauthenticated>
        <p className="mt-8 text-sm text-celestial-silver">Sign in to see your chart.</p>
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
        <ChartContent />
      </Authenticated>
    </main>
  );
}

function ChartContent() {
  const profile = useQuery(api.natal.getMyBirthProfile);
  const retryChartFetch = useMutation(api.natal.retryChartFetch);
  const [retrying, setRetrying] = useState(false);

  if (profile === undefined) {
    return <p className="mt-8 text-sm text-celestial-silver">Loading…</p>;
  }

  if (profile === null) {
    return (
      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-sm text-celestial-silver">
          You haven&apos;t added your birth data yet.
        </p>
        <Link
          href="/profile"
          className="text-sm text-starlight-lilac transition-colors hover:text-star-gold"
        >
          Add your birth data →
        </Link>
      </div>
    );
  }

  if (profile.chartStatus === "pending") {
    return <p className="mt-8 text-sm text-celestial-silver">Calculating your chart…</p>;
  }

  if (profile.chartStatus === "error") {
    return (
      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-sm text-star-gold">
          {profile.chartError ?? "Couldn't compute your chart."}
        </p>
        <button
          type="button"
          disabled={retrying}
          onClick={async () => {
            setRetrying(true);
            try {
              await retryChartFetch({});
            } finally {
              setRetrying(false);
            }
          }}
          className="rounded-md border border-dusty-plum/40 px-4 py-2 text-sm text-celestial-silver transition-colors hover:border-starlight-lilac hover:text-aged-parchment disabled:opacity-50"
        >
          {retrying ? "Retrying…" : "Retry"}
        </button>
      </div>
    );
  }

  const chart = profile.natalChart as NatalChart | undefined;
  if (!chart) {
    return <p className="mt-8 text-sm text-celestial-silver">No chart data available.</p>;
  }

  const unverified = profile.birthTimeUnknown;

  return (
    <div className="mt-10 flex w-full max-w-2xl flex-col gap-10">
      <section className="text-center text-sm text-celestial-silver">
        <p>
          {profile.birthDate}
          {!unverified && profile.birthTime ? ` · ${profile.birthTime}` : ""} —{" "}
          {profile.birthPlaceLabel}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em]">
          {profile.houseSystem === "whole_sign" ? "Whole Sign" : "Placidus"} houses
        </p>
      </section>

      <section>
        <p className="text-center text-xs uppercase tracking-[0.2em] text-celestial-silver">
          Planets
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm text-celestial-silver">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-celestial-silver/70">
                <th className="py-1 pr-3">Planet</th>
                <th className="py-1 pr-3">Sign</th>
                <th className="py-1 pr-3">Degree</th>
                <th className="py-1 pr-3">House</th>
                <th className="py-1">℞</th>
              </tr>
            </thead>
            <tbody>
              {chart.planets.map((p) => (
                <tr key={p.name} className="border-t border-dusty-plum/20">
                  <td className="py-1 pr-3 text-aged-parchment">{p.name}</td>
                  <td className="py-1 pr-3">{p.sign}</td>
                  <td className="py-1 pr-3">{p.degreeInSign.toFixed(1)}°</td>
                  <td className="py-1 pr-3">
                    {p.house}
                    {unverified && <span className="text-star-gold"> *</span>}
                  </td>
                  <td className="py-1">{p.retrograde ? "℞" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {unverified && (
          <p className="mt-2 text-center text-xs text-star-gold">
            * Birth time unknown — houses and rising sign are unverified (calculated for noon).
          </p>
        )}
      </section>

      {chart.houses.length > 0 && (
        <section>
          <p className="text-center text-xs uppercase tracking-[0.2em] text-celestial-silver">
            Houses
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-celestial-silver sm:grid-cols-3">
            {chart.houses.map((h) => (
              <li key={h.house} className="flex justify-between gap-2">
                <span>House {h.house}</span>
                <span>{h.sign}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <p className="text-center text-xs uppercase tracking-[0.2em] text-celestial-silver">
          Angles{unverified && <span className="text-star-gold"> (unverified)</span>}
        </p>
        <ul className="mt-3 flex flex-col items-center gap-1 text-sm text-celestial-silver">
          <li>
            Ascendant — {chart.angles.ascendant.sign}{" "}
            {chart.angles.ascendant.degreeInSign.toFixed(1)}°
          </li>
          <li>
            Midheaven — {chart.angles.midheaven.sign}{" "}
            {chart.angles.midheaven.degreeInSign.toFixed(1)}°
          </li>
        </ul>
      </section>

      {chart.aspects.length > 0 && (
        <section>
          <p className="text-center text-xs uppercase tracking-[0.2em] text-celestial-silver">
            Aspects
          </p>
          <ul className="mt-3 flex flex-col gap-1 text-sm text-celestial-silver">
            {chart.aspects.map((a, i) => (
              <li key={`${a.planetA}-${a.planetB}-${i}`} className="flex justify-between gap-4">
                <span>
                  {a.planetA} — {a.planetB}
                </span>
                <span className="whitespace-nowrap text-star-gold">
                  {a.aspectType} · {a.orb.toFixed(1)}°
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

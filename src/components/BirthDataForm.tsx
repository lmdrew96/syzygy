"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import Link from "next/link";
import {
  useMutation,
  useQuery,
  useAction,
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";

type HouseSystem = "whole_sign" | "placidus";

const HOUSE_SYSTEMS: Array<{ value: HouseSystem; label: string }> = [
  { value: "whole_sign", label: "Whole Sign" },
  { value: "placidus", label: "Placidus" },
];

interface PlaceResult {
  label: string;
  lat: number;
  lng: number;
}

export function BirthDataForm() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <p className="text-sm text-celestial-silver">
        Birth data isn&apos;t configured yet.
      </p>
    );
  }
  return (
    <>
      <AuthLoading>
        <p className="text-sm text-celestial-silver">Loading…</p>
      </AuthLoading>
      <Unauthenticated>
        <SignInButton mode="modal">
          <button
            type="button"
            className="rounded-md border border-dusty-plum/40 px-4 py-2 text-sm text-celestial-silver transition-colors hover:border-starlight-lilac hover:text-aged-parchment"
          >
            Sign in to add your birth data
          </button>
        </SignInButton>
      </Unauthenticated>
      <Authenticated>
        <FormInner />
      </Authenticated>
    </>
  );
}

function FormInner() {
  const profile = useQuery(api.natal.getMyBirthProfile);
  const saveBirthData = useMutation(api.natal.saveBirthData);
  const retryChartFetch = useMutation(api.natal.retryChartFetch);
  const deleteBirthProfile = useMutation(api.natal.deleteBirthProfile);
  const searchPlaces = useAction(api.natal.searchPlaces);

  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [houseSystem, setHouseSystem] = useState<HouseSystem>("whole_sign");
  const [consentChecked, setConsentChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  // Pre-fill from an existing profile exactly once, so it doesn't clobber in-progress edits.
  useEffect(() => {
    if (hydratedRef.current || profile === undefined || profile === null) return;
    hydratedRef.current = true;
    setBirthDate(profile.birthDate);
    setBirthTime(profile.birthTime ?? "");
    setBirthTimeUnknown(profile.birthTimeUnknown);
    setPlaceQuery(profile.birthPlaceLabel);
    setSelectedPlace({
      label: profile.birthPlaceLabel,
      lat: profile.birthLat,
      lng: profile.birthLng,
    });
    setHouseSystem(profile.houseSystem as HouseSystem);
  }, [profile]);

  useEffect(() => {
    if (selectedPlace && placeQuery === selectedPlace.label) return;
    if (placeQuery.trim().length < 2) return;
    const handle = setTimeout(async () => {
      try {
        const results = await searchPlaces({ query: placeQuery });
        setPlaceResults(results);
      } catch {
        setPlaceResults([]);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [placeQuery, selectedPlace, searchPlaces]);

  const alreadyConsented = profile?.consentedAt != null;
  const canSubmit =
    birthDate.length > 0 &&
    (birthTimeUnknown || birthTime.length > 0) &&
    selectedPlace !== null &&
    (alreadyConsented || consentChecked) &&
    !saving;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedPlace) return;
    setSaving(true);
    setError(null);
    try {
      await saveBirthData({
        birthDate,
        birthTime: birthTimeUnknown ? undefined : birthTime,
        birthTimeUnknown,
        birthPlaceLabel: selectedPlace.label,
        birthLat: selectedPlace.lat,
        birthLng: selectedPlace.lng,
        houseSystem,
        consentedAt: profile?.consentedAt ?? new Date().toISOString(),
      });
    } catch {
      setError("Couldn't save — try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRetry() {
    setError(null);
    try {
      await retryChartFetch({});
    } catch {
      setError("Couldn't retry — try again.");
    }
  }

  async function handleDelete() {
    setError(null);
    try {
      await deleteBirthProfile({});
      hydratedRef.current = false;
      setBirthDate("");
      setBirthTime("");
      setBirthTimeUnknown(false);
      setPlaceQuery("");
      setSelectedPlace(null);
      setConsentChecked(false);
    } catch {
      setError("Couldn't remove your birth data — try again.");
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      {profile && <StatusBanner profile={profile} onRetry={handleRetry} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-celestial-silver">
          Birth date
          <input
            type="date"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="rounded-md border border-dusty-plum/40 bg-transparent px-3 py-2 text-aged-parchment"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-celestial-silver">
          Birth time
          <input
            type="time"
            required={!birthTimeUnknown}
            disabled={birthTimeUnknown}
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className="rounded-md border border-dusty-plum/40 bg-transparent px-3 py-2 text-aged-parchment disabled:opacity-40"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-celestial-silver">
          <input
            type="checkbox"
            checked={birthTimeUnknown}
            onChange={(e) => setBirthTimeUnknown(e.target.checked)}
          />
          I don&apos;t know my birth time
        </label>

        <div className="relative flex flex-col gap-1 text-sm text-celestial-silver">
          <label htmlFor="birthPlace">Birth place</label>
          <input
            id="birthPlace"
            type="text"
            required
            autoComplete="off"
            placeholder="City, region, country"
            value={placeQuery}
            onChange={(e) => {
              const value = e.target.value;
              setPlaceQuery(value);
              setSelectedPlace(null);
              if (value.trim().length < 2) setPlaceResults([]);
            }}
            className="rounded-md border border-dusty-plum/40 bg-transparent px-3 py-2 text-aged-parchment"
          />
          {placeResults.length > 0 && !selectedPlace && (
            <ul className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-dusty-plum/40 bg-dusty-plum text-aged-parchment">
              {placeResults.map((place) => (
                <li key={`${place.label}-${place.lat}-${place.lng}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlace(place);
                      setPlaceQuery(place.label);
                      setPlaceResults([]);
                    }}
                    className="w-full px-3 py-2 text-left text-sm transition-colors hover:text-starlight-lilac"
                  >
                    {place.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="flex flex-col gap-1 text-sm text-celestial-silver">
          House system
          <select
            value={houseSystem}
            onChange={(e) => setHouseSystem(e.target.value as HouseSystem)}
            className="rounded-md border border-dusty-plum/40 bg-transparent px-3 py-2 text-aged-parchment"
          >
            {HOUSE_SYSTEMS.map((hs) => (
              <option key={hs.value} value={hs.value} className="bg-dusty-plum">
                {hs.label}
              </option>
            ))}
          </select>
        </label>

        {!alreadyConsented && (
          <label className="flex items-start gap-2 text-xs text-celestial-silver">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Your birth date, time, and location will be stored in Syzygy and sent to
              Stellation, our astrology calculation service, to compute your chart.
            </span>
          </label>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md border border-dusty-plum/40 px-4 py-2 text-sm text-celestial-silver transition-colors hover:border-starlight-lilac hover:text-aged-parchment disabled:opacity-50"
        >
          {saving ? "Saving…" : alreadyConsented ? "Update birth data" : "Save birth data"}
        </button>

        {error && <p className="text-sm text-star-gold">{error}</p>}
      </form>

      {profile && (
        <button
          type="button"
          onClick={handleDelete}
          className="self-start text-xs text-celestial-silver underline decoration-dusty-plum/40 transition-colors hover:text-star-gold"
        >
          Remove my birth data
        </button>
      )}

      {profile?.chartStatus === "ready" && (
        <Link
          href="/chart"
          className="text-sm text-starlight-lilac transition-colors hover:text-star-gold"
        >
          View your chart →
        </Link>
      )}
    </div>
  );
}

function StatusBanner({
  profile,
  onRetry,
}: {
  profile: { chartStatus: "pending" | "ready" | "error"; chartError?: string };
  onRetry: () => void;
}) {
  if (profile.chartStatus === "pending") {
    return <p className="text-sm text-celestial-silver">Calculating your chart…</p>;
  }
  if (profile.chartStatus === "error") {
    return (
      <div className="flex items-center justify-between gap-4 rounded-md border border-star-gold/40 px-3 py-2 text-sm text-star-gold">
        <span>{profile.chartError ?? "Couldn't compute your chart."}</span>
        <button type="button" onClick={onRetry} className="underline">
          Retry
        </button>
      </div>
    );
  }
  return <p className="text-sm text-celestial-silver">Chart ready.</p>;
}

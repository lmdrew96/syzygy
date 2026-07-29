import { ZODIAC_ORDER, type ZodiacSign } from "../tarot/correspondences";

export interface TransitPlanet {
  name: string;
  sign: string;
  degreeInSign: number;
  retrograde: boolean;
}

export interface TransitAspect {
  planetA: string;
  planetB: string;
  aspectType: string;
  exactAngle: number;
  orb: number;
  applying: boolean;
}

export interface TransitSnapshot {
  fetchedAt: string;
  planets: TransitPlanet[];
  aspects: TransitAspect[];
}

/** The house a planet occupies in a natal chart (1–12). */
export interface NatalPlanet extends TransitPlanet {
  house: number;
}

export interface NatalHouseCusp {
  house: number;
  sign: string;
  degreeInSign: number;
}

export interface NatalAngles {
  ascendant: { sign: string; degreeInSign: number };
  midheaven: { sign: string; degreeInSign: number };
}

export interface NatalChart {
  computedAt: string;
  birthDate: string;
  /** Null when the birth time is unknown — noon was used for the Stellation call but shouldn't be presented as real. */
  birthTime: string | null;
  timeUnknown: boolean;
  lat: number;
  lng: number;
  houseSystem: HouseSystem;
  planets: NatalPlanet[];
  /**
   * Cusp degrees for houses 1–12. Only populated for "whole_sign" (each
   * house is a full 30° sign starting at the Ascendant's sign) — Stellation
   * doesn't return cusp data for "placidus", so it comes back empty there.
   * Per-planet house numbers (above) are accurate for both systems.
   */
  houses: NatalHouseCusp[];
  angles: NatalAngles;
  aspects: TransitAspect[];
}

export type HouseSystem = "whole_sign" | "placidus";

interface StellationChartResponse {
  planets: Array<{
    name: string;
    sign: string;
    degree_in_sign: number;
    house: number;
    retrograde: boolean;
  }>;
  aspects: Array<{
    planet_a: string;
    planet_b: string;
    aspect_type: string;
    exact_angle: number;
    orb: number;
    applying: boolean;
  }>;
  angles: Array<{
    name: string;
    sign: string;
    degree_in_sign: number;
  }>;
}

interface StellationChartRequest {
  name: string;
  birth_date: string;
  birth_time: string;
  manual_lat: number;
  manual_lng: number;
  zodiac: "tropical";
  house_system: HouseSystem;
}

function requireBaseUrl(): string {
  const url = process.env.STELLATION_MCP_URL;
  if (!url) throw new Error("STELLATION_MCP_URL is not set");
  return url.replace(/\/$/, "");
}

/** Shared POST + error handling for both transit and natal chart requests. */
async function postChart(body: StellationChartRequest): Promise<StellationChartResponse> {
  const res = await fetch(`${requireBaseUrl()}/api/chart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Stellation /api/chart failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Fetches today's real planetary positions from Stellation's /api/chart by
 * requesting a "chart" for the current UTC moment at 0°N 0°E — that
 * location's timezone is UTC, so birth_date/birth_time map onto "now" with
 * no DST/offset ambiguity and no geocoding needed. House/angle data is
 * meaningless for a transit-only reading, so only planets + aspects are kept.
 */
export async function getCurrentTransits(): Promise<TransitSnapshot> {
  const now = new Date();
  const birthDate = now.toISOString().slice(0, 10);
  const birthTime = now.toISOString().slice(11, 16);

  const data = await postChart({
    name: "Syzygy transit snapshot",
    birth_date: birthDate,
    birth_time: birthTime,
    manual_lat: 0,
    manual_lng: 0,
    zodiac: "tropical",
    house_system: "whole_sign",
  });

  return {
    fetchedAt: now.toISOString(),
    planets: data.planets.map((p) => ({
      name: p.name,
      sign: p.sign,
      degreeInSign: p.degree_in_sign,
      retrograde: p.retrograde,
    })),
    aspects: data.aspects.map((a) => ({
      planetA: a.planet_a,
      planetB: a.planet_b,
      aspectType: a.aspect_type,
      exactAngle: a.exact_angle,
      orb: a.orb,
      applying: a.applying,
    })),
  };
}

const NOON_FALLBACK_TIME = "12:00";

export interface GetNatalChartParams {
  birthDate: string;
  /** Null/omitted when timeUnknown — noon is used for the Stellation call. */
  birthTime: string | null;
  timeUnknown: boolean;
  lat: number;
  lng: number;
  houseSystem: HouseSystem;
}

function wholeSignHouses(ascendantSign: string): NatalHouseCusp[] {
  const startIndex = ZODIAC_ORDER.indexOf(ascendantSign as ZodiacSign);
  if (startIndex === -1) return [];
  return ZODIAC_ORDER.map((_, i) => ({
    house: i + 1,
    sign: ZODIAC_ORDER[(startIndex + i) % ZODIAC_ORDER.length],
    degreeInSign: 0,
  }));
}

/**
 * Fetches a natal chart for real birth data from Stellation's /api/chart.
 * Verified against the live endpoint: house_system only accepts
 * "placidus" | "whole_sign", birth_time is required (hence the noon
 * fallback when unknown), and Stellation resolves the birth location's
 * timezone itself — no client-side tz conversion needed.
 */
export async function getNatalChart(params: GetNatalChartParams): Promise<NatalChart> {
  const effectiveBirthTime =
    params.timeUnknown || !params.birthTime ? NOON_FALLBACK_TIME : params.birthTime;

  const data = await postChart({
    name: "Syzygy natal chart",
    birth_date: params.birthDate,
    birth_time: effectiveBirthTime,
    manual_lat: params.lat,
    manual_lng: params.lng,
    zodiac: "tropical",
    house_system: params.houseSystem,
  });

  const ascendant = data.angles.find((a) => a.name === "Ascendant");
  const midheaven = data.angles.find((a) => a.name === "Midheaven");
  if (!ascendant || !midheaven) {
    throw new Error("Stellation /api/chart response is missing Ascendant/Midheaven angles");
  }

  return {
    computedAt: new Date().toISOString(),
    birthDate: params.birthDate,
    birthTime: params.timeUnknown ? null : params.birthTime,
    timeUnknown: params.timeUnknown,
    lat: params.lat,
    lng: params.lng,
    houseSystem: params.houseSystem,
    planets: data.planets.map((p) => ({
      name: p.name,
      sign: p.sign,
      degreeInSign: p.degree_in_sign,
      retrograde: p.retrograde,
      house: p.house,
    })),
    houses: params.houseSystem === "whole_sign" ? wholeSignHouses(ascendant.sign) : [],
    angles: {
      ascendant: { sign: ascendant.sign, degreeInSign: ascendant.degree_in_sign },
      midheaven: { sign: midheaven.sign, degreeInSign: midheaven.degree_in_sign },
    },
    aspects: data.aspects.map((a) => ({
      planetA: a.planet_a,
      planetB: a.planet_b,
      aspectType: a.aspect_type,
      exactAngle: a.exact_angle,
      orb: a.orb,
      applying: a.applying,
    })),
  };
}

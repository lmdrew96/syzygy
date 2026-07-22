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

interface StellationChartResponse {
  planets: Array<{
    name: string;
    sign: string;
    degree_in_sign: number;
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
}

function requireBaseUrl(): string {
  const url = process.env.STELLATION_MCP_URL;
  if (!url) throw new Error("STELLATION_MCP_URL is not set");
  return url.replace(/\/$/, "");
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

  const res = await fetch(`${requireBaseUrl()}/api/chart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Syzygy transit snapshot",
      birth_date: birthDate,
      birth_time: birthTime,
      manual_lat: 0,
      manual_lng: 0,
      zodiac: "tropical",
      house_system: "whole_sign",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Stellation /api/chart failed: ${res.status} ${res.statusText}`);
  }

  const data: StellationChartResponse = await res.json();

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

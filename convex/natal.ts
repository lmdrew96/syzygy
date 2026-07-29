import { mutation, query, action, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getNatalChart } from "../src/lib/stellation/client";

const houseSystemValidator = v.union(v.literal("whole_sign"), v.literal("placidus"));

export const saveBirthData = mutation({
  args: {
    birthDate: v.string(),
    birthTime: v.optional(v.string()),
    birthTimeUnknown: v.boolean(),
    birthPlaceLabel: v.string(),
    birthLat: v.number(),
    birthLng: v.number(),
    houseSystem: houseSystemValidator,
    consentedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    if (!args.birthTimeUnknown && !args.birthTime) {
      throw new Error("birthTime is required unless birthTimeUnknown is set");
    }

    const fields = {
      birthDate: args.birthDate,
      birthTime: args.birthTimeUnknown ? undefined : args.birthTime,
      birthTimeUnknown: args.birthTimeUnknown,
      birthPlaceLabel: args.birthPlaceLabel,
      birthLat: args.birthLat,
      birthLng: args.birthLng,
      houseSystem: args.houseSystem,
      consentedAt: args.consentedAt,
      chartStatus: "pending" as const,
      chartError: undefined,
      natalChart: undefined,
      chartComputedAt: undefined,
    };

    const existing = await ctx.db
      .query("natalProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .unique();

    const profileId: Id<"natalProfiles"> = existing
      ? (await ctx.db.patch("natalProfiles", existing._id, fields), existing._id)
      : await ctx.db.insert("natalProfiles", { userId: identity.tokenIdentifier, ...fields });

    await ctx.scheduler.runAfter(0, internal.natal.fetchAndCacheChart, {
      profileId,
      birthDate: args.birthDate,
      birthTime: args.birthTimeUnknown ? null : (args.birthTime ?? null),
      timeUnknown: args.birthTimeUnknown,
      lat: args.birthLat,
      lng: args.birthLng,
      houseSystem: args.houseSystem,
    });

    return null;
  },
});

export const fetchAndCacheChart = internalAction({
  args: {
    profileId: v.id("natalProfiles"),
    birthDate: v.string(),
    birthTime: v.union(v.string(), v.null()),
    timeUnknown: v.boolean(),
    lat: v.number(),
    lng: v.number(),
    houseSystem: houseSystemValidator,
  },
  handler: async (ctx, args) => {
    try {
      const chart = await getNatalChart({
        birthDate: args.birthDate,
        birthTime: args.birthTime,
        timeUnknown: args.timeUnknown,
        lat: args.lat,
        lng: args.lng,
        houseSystem: args.houseSystem,
      });
      await ctx.runMutation(internal.natal.storeChartResult, {
        profileId: args.profileId,
        result: { kind: "ready", chart },
      });
    } catch (err) {
      await ctx.runMutation(internal.natal.storeChartResult, {
        profileId: args.profileId,
        result: {
          kind: "error",
          message: err instanceof Error ? err.message : "Failed to compute natal chart",
        },
      });
    }
    return null;
  },
});

export const storeChartResult = internalMutation({
  args: {
    profileId: v.id("natalProfiles"),
    result: v.union(
      v.object({ kind: v.literal("ready"), chart: v.any() }),
      v.object({ kind: v.literal("error"), message: v.string() }),
    ),
  },
  handler: async (ctx, args) => {
    // The profile may have been deleted while the fetch was in flight.
    const profile = await ctx.db.get("natalProfiles", args.profileId);
    if (!profile) return null;

    if (args.result.kind === "ready") {
      await ctx.db.patch("natalProfiles", args.profileId, {
        chartStatus: "ready",
        natalChart: args.result.chart,
        chartComputedAt: new Date().toISOString(),
        chartError: undefined,
      });
    } else {
      await ctx.db.patch("natalProfiles", args.profileId, {
        chartStatus: "error",
        chartError: args.result.message,
      });
    }
    return null;
  },
});

export const getMyBirthProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db
      .query("natalProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .unique();
  },
});

export const retryChartFetch = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("natalProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .unique();
    if (!profile) throw new Error("No birth profile found");
    if (profile.chartStatus !== "error") throw new Error("Chart is not in an error state");

    await ctx.db.patch("natalProfiles", profile._id, {
      chartStatus: "pending",
      chartError: undefined,
    });

    await ctx.scheduler.runAfter(0, internal.natal.fetchAndCacheChart, {
      profileId: profile._id,
      birthDate: profile.birthDate,
      birthTime: profile.birthTimeUnknown ? null : (profile.birthTime ?? null),
      timeUnknown: profile.birthTimeUnknown,
      lat: profile.birthLat,
      lng: profile.birthLng,
      houseSystem: profile.houseSystem as "whole_sign" | "placidus",
    });

    return null;
  },
});

export const deleteBirthProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("natalProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .unique();
    if (!profile) return null;

    await ctx.db.delete("natalProfiles", profile._id);
    return null;
  },
});

interface PlaceResult {
  label: string;
  lat: number;
  lng: number;
}

export const searchPlaces = action({
  args: { query: v.string() },
  handler: async (_ctx, args): Promise<PlaceResult[]> => {
    const q = args.query.trim();
    if (q.length < 2) return [];

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "5");

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Syzygy/1.0 (https://syzygy.adhdesigns.dev)" },
    });
    if (!res.ok) throw new Error(`Place search failed: ${res.status} ${res.statusText}`);

    const data: Array<{ display_name: string; lat: string; lon: string }> = await res.json();
    return data.map((r) => ({
      label: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
    }));
  },
});

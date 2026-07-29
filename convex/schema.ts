import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // A reading only exists here once the user explicitly saves it — ephemeral
  // readings are never inserted at all, so there's no separate "saved" flag.
  readings: defineTable({
    // Clerk's identity.tokenIdentifier — the stable per-user key. Optional
    // because readings saved before auth was added have no owner.
    userId: v.optional(v.string()),
    inputText: v.string(),
    inputQuestion: v.optional(v.string()),
    cardIds: v.array(v.string()),
    positions: v.array(
      v.object({ cardId: v.string(), x: v.number(), y: v.number() }),
    ),
    edges: v.array(
      v.object({
        from: v.string(),
        to: v.string(),
        weight: v.number(),
        reason: v.string(),
      }),
    ),
    walkPath: v.array(
      v.object({
        cardId: v.string(),
        connectionWeight: v.optional(v.number()),
      }),
    ),
    // The Stellation transit data used at draw-time, kept as-is so a saved
    // reading stays reproducible/inspectable after the sky has moved on.
    transitSnapshot: v.optional(v.any()),
    interpretiveText: v.string(),
    // No explicit createdAt — every document already carries the system
    // field _creationTime.
  }).index("by_userId", ["userId"]),

  // One profile per user, enforced at the mutation layer (Convex has no
  // unique index) — saveBirthData upserts by looking up by_userId first.
  natalProfiles: defineTable({
    userId: v.string(),
    birthDate: v.string(),
    birthTime: v.optional(v.string()),
    birthTimeUnknown: v.boolean(),
    birthPlaceLabel: v.string(),
    birthLat: v.number(),
    birthLng: v.number(),
    houseSystem: v.string(),
    consentedAt: v.string(),
    chartStatus: v.union(v.literal("pending"), v.literal("ready"), v.literal("error")),
    chartError: v.optional(v.string()),
    // The computed NatalChart, cached on write — never re-fetched from
    // Stellation on read.
    natalChart: v.optional(v.any()),
    chartComputedAt: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
});

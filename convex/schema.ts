import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // A reading only exists here once the user explicitly saves it — ephemeral
  // readings are never inserted at all, so there's no separate "saved" flag.
  readings: defineTable({
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
  }),
});

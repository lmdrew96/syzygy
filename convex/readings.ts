import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const positionValidator = v.object({ cardId: v.string(), x: v.number(), y: v.number() });
const edgeValidator = v.object({
  from: v.string(),
  to: v.string(),
  weight: v.number(),
  reason: v.string(),
});
const walkStepValidator = v.object({
  cardId: v.string(),
  connectionWeight: v.optional(v.number()),
});

export const save = mutation({
  args: {
    inputText: v.string(),
    inputQuestion: v.optional(v.string()),
    cardIds: v.array(v.string()),
    positions: v.array(positionValidator),
    edges: v.array(edgeValidator),
    walkPath: v.array(walkStepValidator),
    transitSnapshot: v.optional(v.any()),
    interpretiveText: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("readings", args);
  },
});

export const get = query({
  args: { id: v.id("readings") },
  handler: async (ctx, args) => {
    return await ctx.db.get("readings", args.id);
  },
});

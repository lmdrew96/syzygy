# Syzygy

A generative tarot-and-astrology oracle. Every reading draws Major Arcana weighted by your input and today's actual planetary transits, then renders live as a unique constellation — no two readings ever look the same, because the sky itself has changed since last time.

## Tech Stack

- **Framework**: Next.js
- **Rendering**: p5.js (or Canvas API — TBD during scaffolding, whichever gives cleaner control over the live-drawing constellation animation)
- **Language**: TypeScript
- **Integration**: Stellation MCP (live ephemeris/transit data), reuses Majorot's Major Arcana card art/data
- **Deployment**: Vercel

## Core Principle

The astrology isn't a bolt-on and the randomness isn't arbitrary. Traditional Major Arcana → planet/zodiac correspondences (Golden Dawn/Waite attribution — e.g. The Empress↔Venus, The Tower↔Mars, The Star↔Aquarius) are the actual mechanism linking the two systems: cards connect to each other based on shared or opposing astrological rulers, and that connection strength shifts with today's real transits. User input shapes which cards can be drawn at all. Nothing here is decorative randomness — every input and every date genuinely changes the output.

## Flow

1. **Input**: user provides a word/phrase, plus an optional question.
2. **Draw**: 3–7 Major Arcana selected — weighted by input text *and* today's live transits (via Stellation), not uniform random.
3. **Graph**: edges form between drawn cards based on planetary/zodiac correspondences, strengthened by whichever planets are prominent today.
4. **Walk**: a path traces across the graph.
5. **Render**: the walk draws live as a constellation — stars pulse in as nodes (with card glyphs from Majorot's art), lines connect as the walk progresses.
6. **Interpret**: a short text fragment is generated, weaving each card's traditional meaning with its planetary resonance and today's transit relevance — one woven reading, not two stapled-together blurbs.
7. **Save (optional)**: default is ephemeral — gone on close. User can explicitly save a reading worth keeping.

## Data Model (draft — adjust once Convex schema is finalized)

```
readings {
  _id
  userId
  inputText: string
  inputQuestion: string | null
  drawnCards: Array<{
    cardId: string          // maps to Majorot's card IDs
    planetaryRuler: string
    zodiacRuler: string | null
  }>
  edges: Array<{ from: string; to: string; weight: number }>
  walkPath: Array<string>   // ordered sequence of cardIds traced by the walk
  transitSnapshot: object   // the Stellation transit data used at draw-time, for reproducibility
  interpretiveText: string
  saved: boolean
  createdAt: number
}
```

## Correspondence Table

The Major Arcana → planet/zodiac mapping is the single most important reference data in this project. Source it from established Golden Dawn/Waite attribution (don't invent one) and keep it as a standalone, well-documented constant — every other system (draw weighting, edge formation, interpretive text) depends on it being correct and easy to look up.

## Stellation Integration

Pull current planetary positions via Stellation's existing ephemeris logic/MCP at draw-time. Store the snapshot used (`transitSnapshot`) alongside each reading so a saved reading remains reproducible/inspectable even after the sky has moved on. This is read-only — Syzygy never writes back into Stellation.

## Majorot Integration

Reuse the 22 Major Arcana card art and meanings already built for Majorot rather than duplicating assets. Confirm whether this is a shared asset import or a live read from Majorot's data layer during scaffolding.

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `CONVEX_DEPLOYMENT` | Convex project deployment URL (if persistence needs a backend) | Yes, if saves are backed by Convex |
| `STELLATION_MCP_URL` | Endpoint for pulling live transit data | Yes |

## Design Constraints (do not violate)

- Correspondence table must be sourced from real tarot/astrology tradition, not invented.
- Every reading must differ meaningfully based on (a) user input and (b) the date — no reading should be reproducible from input alone without the transit snapshot.
- Default behavior is ephemeral; nothing persists unless the user explicitly saves.
- No account/login friction before a first reading — this should be usable instantly.

## Build Order

1. Input screen
2. Arcana draw + weighting engine
3. Live transit integration (Stellation)
4. Correspondence graph engine
5. Constellation render (live walk visualization)
6. Interpretive text generation
7. Reading save/persistence

Steps 1–5 form the full generative-visual experience end to end; 6–7 layer meaning and persistence on top.

## Related ChaosPatch Project

Full patch breakdown with notes lives in ChaosPatch under the `syzygy` project slug.

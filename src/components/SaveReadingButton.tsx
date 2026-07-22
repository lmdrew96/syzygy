"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { MajorArcanaId } from "@/lib/tarot/majorArcana";
import type { CardPosition } from "@/lib/tarot/layout";
import type { GraphEdge } from "@/lib/tarot/graph";
import type { WalkStep } from "@/lib/tarot/walk";
import type { TransitSnapshot } from "@/lib/stellation/client";

interface SaveReadingButtonProps {
  inputText: string;
  question?: string;
  cardIds: MajorArcanaId[];
  positions: CardPosition[];
  edges: GraphEdge[];
  walk: WalkStep[];
  transits: TransitSnapshot | null;
  interpretiveText: string;
}

export function SaveReadingButton(props: SaveReadingButtonProps) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return (
      <p className="text-sm text-foreground-muted">
        Saving isn&apos;t configured yet.
      </p>
    );
  }
  return <ConvexSaveButton {...props} />;
}

function ConvexSaveButton(props: SaveReadingButtonProps) {
  const router = useRouter();
  const save = useMutation(api.readings.save);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  async function handleSave() {
    setStatus("saving");
    try {
      const id = await save({
        inputText: props.inputText,
        inputQuestion: props.question,
        cardIds: props.cardIds,
        positions: props.positions,
        edges: props.edges,
        walkPath: props.walk.map((step) => ({
          cardId: step.cardId,
          connectionWeight: step.connectionWeight ?? undefined,
        })),
        transitSnapshot: props.transits ?? undefined,
        interpretiveText: props.interpretiveText,
      });
      router.push(`/reading/saved/${id}`);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleSave}
        disabled={status === "saving"}
        className="rounded-md border border-line-violet/40 px-4 py-2 text-sm text-foreground-muted transition-colors hover:border-line-violet-bright hover:text-foreground disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Save this reading"}
      </button>
      {status === "error" && (
        <p className="text-sm text-star-gold">Couldn&apos;t save — try again.</p>
      )}
    </div>
  );
}

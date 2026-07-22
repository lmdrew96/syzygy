"use client";

import { useEffect, useRef } from "react";
import type { MajorArcanaCard } from "@/lib/tarot/majorArcana";
import type { CardPosition } from "@/lib/tarot/layout";
import type { WalkStep } from "@/lib/tarot/walk";

interface ConstellationCanvasProps {
  cards: MajorArcanaCard[];
  positions: CardPosition[];
  walk: WalkStep[];
}

const NODE_RADIUS = 30;
const MS_PER_STEP = 700;
const REVEAL_MS = 400;

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function ConstellationCanvas({ cards, positions, walk }: ConstellationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let cancelled = false;

    const cardById = new Map(cards.map((c) => [c.id, c]));
    const posById = new Map(positions.map((p) => [p.cardId, p]));
    const images = new Map<string, HTMLImageElement>();
    for (const card of cards) {
      const img = new window.Image();
      img.src = card.artUrl;
      images.set(card.id, img);
    }

    function resize() {
      if (!canvas || !ctx) return;
      const width = canvas.parentElement?.clientWidth ?? 600;
      const height = width * 0.72;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    }

    function draw(sizeW: number, sizeH: number, elapsedMs: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, sizeW, sizeH);

      const totalMs = walk.length * MS_PER_STEP;
      const progress = totalMs === 0 ? 1 : Math.min(elapsedMs / totalMs, 1);
      const revealedSteps = Math.min(walk.length, Math.floor(progress * walk.length) + 1);

      for (let i = 1; i < revealedSteps; i++) {
        const from = posById.get(walk[i - 1].cardId);
        const to = posById.get(walk[i].cardId);
        if (!from || !to) continue;
        const isRealEdge = walk[i].connectionWeight !== null;
        ctx.beginPath();
        ctx.moveTo(from.x * sizeW, from.y * sizeH);
        ctx.lineTo(to.x * sizeW, to.y * sizeH);
        ctx.strokeStyle = isRealEdge ? "rgba(166, 143, 224, 0.85)" : "rgba(166, 143, 224, 0.3)";
        ctx.lineWidth = isRealEdge ? 1.5 : 1;
        ctx.setLineDash(isRealEdge ? [] : [4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      for (let i = 0; i < revealedSteps; i++) {
        const step = walk[i];
        const pos = posById.get(step.cardId);
        const card = cardById.get(step.cardId);
        if (!pos || !card) continue;

        const stepStart = i * MS_PER_STEP;
        const localProgress = Math.min(Math.max((elapsedMs - stepStart) / REVEAL_MS, 0), 1);
        const scale = easeOutBack(localProgress);
        const r = NODE_RADIUS * scale;
        if (r <= 0) continue;

        const cx = pos.x * sizeW;
        const cy = pos.y * sizeH;

        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.8);
        glow.addColorStop(0, "rgba(232, 200, 116, 0.45)");
        glow.addColorStop(1, "rgba(232, 200, 116, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const img = images.get(card.id);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
        } else {
          ctx.fillStyle = "#1a1730";
          ctx.fill();
        }
        ctx.restore();

        ctx.strokeStyle = "rgba(205, 211, 236, 0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    resize();
    window.addEventListener("resize", resize);

    const start = performance.now();
    function frame(now: number) {
      if (cancelled || !canvas) return;
      draw(canvas.clientWidth, canvas.clientHeight, now - start);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [cards, positions, walk]);

  return (
    <div className="w-full max-w-2xl">
      <canvas ref={canvasRef} className="w-full" />
    </div>
  );
}

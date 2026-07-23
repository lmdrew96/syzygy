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

const CARD_WIDTH = 34;
const CARD_HEIGHT = CARD_WIDTH * (5 / 3);
const CARD_CORNER_RADIUS = 6;
const MS_PER_STEP = 700;
const REVEAL_MS = 400;

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const destRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (imgRatio > destRatio) {
    sw = img.naturalHeight * destRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / destRatio;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const FLOAT_AMPLITUDE_X = 4;
const FLOAT_AMPLITUDE_Y = 5;

function floatOffset(cardId: string, elapsedMs: number): { dx: number; dy: number } {
  const hash = hashString(cardId);
  const phaseX = ((hash % 1000) / 1000) * Math.PI * 2;
  const phaseY = (((hash >> 8) % 1000) / 1000) * Math.PI * 2;
  const periodX = 3200 + (hash % 700);
  const periodY = 3800 + ((hash >> 4) % 700);
  return {
    dx: Math.sin(elapsedMs / periodX + phaseX) * FLOAT_AMPLITUDE_X,
    dy: Math.cos(elapsedMs / periodY + phaseY) * FLOAT_AMPLITUDE_Y,
  };
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
        const fromId = walk[i - 1].cardId;
        const toId = walk[i].cardId;
        const from = posById.get(fromId);
        const to = posById.get(toId);
        if (!from || !to) continue;
        const fromFloat = floatOffset(fromId, elapsedMs);
        const toFloat = floatOffset(toId, elapsedMs);
        const isRealEdge = walk[i].connectionWeight !== null;
        ctx.beginPath();
        ctx.moveTo(from.x * sizeW + fromFloat.dx, from.y * sizeH + fromFloat.dy);
        ctx.lineTo(to.x * sizeW + toFloat.dx, to.y * sizeH + toFloat.dy);
        ctx.strokeStyle = isRealEdge ? "rgba(129, 141, 184, 0.85)" : "rgba(129, 141, 184, 0.3)";
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
        const w = CARD_WIDTH * scale;
        const h = CARD_HEIGHT * scale;
        if (w <= 0 || h <= 0) continue;

        const float = floatOffset(step.cardId, elapsedMs);
        const cx = pos.x * sizeW + float.dx;
        const cy = pos.y * sizeH + float.dy;
        const glowR = Math.max(w, h) * 1.1;

        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
        glow.addColorStop(0, "rgba(194, 163, 104, 0.45)");
        glow.addColorStop(1, "rgba(194, 163, 104, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
        ctx.fill();

        const cardRadius = CARD_CORNER_RADIUS * scale;
        const x = cx - w / 2;
        const y = cy - h / 2;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, cardRadius);
        ctx.clip();
        const img = images.get(card.id);
        if (img && img.complete && img.naturalWidth > 0) {
          drawImageCover(ctx, img, x, y, w, h);
        } else {
          ctx.fillStyle = "#2f4945";
          ctx.fill();
        }
        ctx.restore();

        ctx.strokeStyle = "rgba(129, 141, 184, 0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, cardRadius);
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

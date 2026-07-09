import type { NodeObject } from "force-graph";
import type { RepoNode } from "@/types/repo-graph";
import { GROUP_COLOR_VAR } from "@/lib/repo-graph";

export type FgNode = NodeObject & RepoNode & { circular?: boolean };
export type ResolveColor = (v: string) => string;

// Card geometry, in graph units (scales with zoom automatically since the
// canvas context is already zoom-transformed when these draw functions run).
// `fontScale` (from the label-size setting) scales font size and, since text
// width depends on it, card width too, 1 is the default/base size.
const FONT_SIZE = 9;
const CARD_HEIGHT = 17.2;
const CARD_RADIUS = 4.4;
const PAD_X = 8;
const DOT_R = 3;
const GAP_DOT_TEXT = 4.4;

function cardWidth(n: FgNode, fontScale: number) {
  const charWidth = FONT_SIZE * fontScale * 0.56;
  const textWidth = n.label.length * charWidth;
  return PAD_X * 2 + DOT_R * 2 + GAP_DOT_TEXT + textWidth;
}

function cardRect(n: FgNode, fontScale: number) {
  const w = cardWidth(n, fontScale);
  const h = CARD_HEIGHT;
  return { x: (n.x ?? 0) - w / 2, y: (n.y ?? 0) - h / 2, w, h };
}

export function drawNodeCard(ctx: CanvasRenderingContext2D, n: FgNode, isSelected: boolean, resolve: ResolveColor, fontScale: number) {
  if (n.x === undefined || n.y === undefined) return;
  const { x, y, w, h } = cardRect(n, fontScale);
  const dotColor = resolve(n.circular ? "var(--chart-4)" : GROUP_COLOR_VAR[n.group]);

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, CARD_RADIUS);
  ctx.fillStyle = resolve("var(--card)");
  ctx.fill();
  if (isSelected) {
    ctx.save();
    ctx.shadowColor = resolve("var(--primary)");
    ctx.shadowBlur = 6;
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = resolve("var(--primary)");
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.lineWidth = 0.35;
    ctx.strokeStyle = resolve("var(--border)");
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(x + PAD_X + DOT_R, n.y, DOT_R, 0, 2 * Math.PI);
  ctx.fillStyle = dotColor;
  ctx.fill();

  ctx.font = `600 ${FONT_SIZE * fontScale}px 'Geist Variable', sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = resolve("var(--card-foreground)");
  ctx.fillText(n.label, x + PAD_X + DOT_R * 2 + GAP_DOT_TEXT, n.y);
}

export function drawNodeHitArea(ctx: CanvasRenderingContext2D, n: FgNode, color: string, fontScale: number) {
  if (n.x === undefined || n.y === undefined) return;
  const { x, y, w, h } = cardRect(n, fontScale);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, CARD_RADIUS);
  ctx.fill();
}

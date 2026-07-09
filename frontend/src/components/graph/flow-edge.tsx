import { BaseEdge, type Edge, type EdgeProps } from "@xyflow/react";
import type { EdgeKind } from "@/types/repo-graph";

export type EdgeHighlight = "outgoing" | "incoming" | null;

export interface OrthogonalEdgeData extends Record<string, unknown> {
  kind: EdgeKind;
  points: { x: number; y: number }[];
  /** Source file's directory accent color (`var(--dir-N)`) — see `lib/dir-colors.ts`. */
  color: string;
  highlight?: EdgeHighlight;
}

export type OrthogonalFlowEdge = Edge<OrthogonalEdgeData, "orthogonal">;

const HIGHLIGHT_COLOR_VAR: Record<Exclude<EdgeHighlight, null | undefined>, string> = {
  outgoing: "var(--chart-1)",
  incoming: "var(--chart-2)",
};

// Directory color already carries "which folder is this edge leaving," so relationship
// kind is encoded as a line pattern instead of a second, competing color channel.
const KIND_DASH: Record<EdgeKind, string | undefined> = {
  import: undefined,
  call: "1.5 3.5",
  class: "4 3",
};

const ARROW_LENGTH = 6;
const ARROW_WIDTH = 3;

/** Small triangle pointing along the final segment, since @xyflow's built-in SVG
 * <marker> defs render fill as a raw attribute rather than a styled one in some
 * versions — drawing it ourselves keeps arrowheads on the same var()-driven,
 * theme-reactive color path as the rest of this edge instead of a second code path. */
function arrowheadPoints(points: { x: number; y: number }[]) {
  const end = points[points.length - 1];
  const prev = points[points.length - 2];
  const dx = end.x - prev.x;
  const dy = end.y - prev.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const backX = end.x - ux * ARROW_LENGTH;
  const backY = end.y - uy * ARROW_LENGTH;
  const left = { x: backX + px * ARROW_WIDTH, y: backY + py * ARROW_WIDTH };
  const right = { x: backX - px * ARROW_WIDTH, y: backY - py * ARROW_WIDTH };
  return `${end.x},${end.y} ${left.x},${left.y} ${right.x},${right.y}`;
}

export function FlowOrthogonalEdge({ data }: EdgeProps<OrthogonalFlowEdge>) {
  if (!data || data.points.length < 2) return null;

  const color = data.highlight ? HIGHLIGHT_COLOR_VAR[data.highlight] : data.color;
  const baseWidth = data.kind === "call" ? 1.5 : 1;
  const width = data.highlight ? baseWidth + 1 : baseWidth;
  const path = `M ${data.points.map((p) => `${p.x} ${p.y}`).join(" L ")}`;

  return (
    <>
      <BaseEdge path={path} style={{ stroke: color, strokeWidth: width, strokeDasharray: KIND_DASH[data.kind] }} />
      <polygon points={arrowheadPoints(data.points)} style={{ fill: color }} />
    </>
  );
}

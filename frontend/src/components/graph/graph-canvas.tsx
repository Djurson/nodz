import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import ForceGraphCtor, { type ForceGraphGeneric, type NodeObject } from "force-graph";
import type { RepoEdge, RepoNode } from "@/types/repo-graph";
import { GROUP_COLOR_VAR, computeDegree, findCircularPairs } from "@/lib/repo-graph";

interface GraphCanvasProps {
  nodes: RepoNode[];
  edges: RepoEdge[];
  selectedId: string | null;
  onSelectNode: (node: RepoNode | null) => void;
}

export interface GraphCanvasHandle {
  fitView: () => void;
}

type FgNode = NodeObject & RepoNode & { circular?: boolean };

// force-graph's .d.ts models the export as a class, but the Kapsule runtime is
// actually a double-invoked factory: ForceGraph()(el). Recover proper generics
// via the still-accurate chainable-instance type, cast the factory once here.
type FgGraph<N extends NodeObject> = ForceGraphGeneric<FgGraph<N>, N>;
type FgFactory = <N extends NodeObject>() => (el: HTMLElement) => FgGraph<N>;
const createForceGraph = ForceGraphCtor as unknown as FgFactory;

// Card geometry, in graph units (scales with zoom automatically since the
// canvas context is already zoom-transformed when these draw functions run).
const FONT_SIZE = 3.4;
const CARD_HEIGHT = 8.6;
const CARD_RADIUS = 2.2;
const PAD_X = 3;
const DOT_R = 1.5;
const GAP_DOT_TEXT = 2.2;
const GAP_TEXT_BADGE = 2.8;
const GAP_BADGE_CHEVRON = 1.6;
const CHEVRON_W = 3.4;
const CHAR_WIDTH = FONT_SIZE * 0.56;
const BADGE_HEIGHT = 4.6;

function badgeWidth(degree: number) {
  return Math.max(6.5, 2.4 + String(degree).length * 2.4);
}

function cardWidth(n: FgNode) {
  const textWidth = n.label.length * CHAR_WIDTH;
  return PAD_X * 2 + DOT_R * 2 + GAP_DOT_TEXT + textWidth + GAP_TEXT_BADGE + badgeWidth(n.degree ?? 0) + GAP_BADGE_CHEVRON + CHEVRON_W;
}

export const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(function GraphCanvas({ nodes, edges, selectedId, onSelectNode }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<FgGraph<FgNode> | null>(null);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const onSelectNodeRef = useRef(onSelectNode);
  onSelectNodeRef.current = onSelectNode;

  useImperativeHandle(ref, () => ({
    fitView: () => graphRef.current?.zoomToFit(400, 60),
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    // Read from the container itself, not document.documentElement: the
    // `.dark` class lives on an inner wrapper div, not <html>.
    const style = getComputedStyle(el);
    const resolve = (v: string) => (v.startsWith("var(") ? style.getPropertyValue(v.slice(4, -1)).trim() : v);

    const graph = createForceGraph<FgNode>()(el)
      .backgroundColor("rgba(0,0,0,0)")
      .nodeId("id")
      .nodeLabel((n) => `${n.path}  ·  ${n.loc} loc  ·  degree ${n.degree}`)
      .linkColor(() => resolve("var(--border)"))
      .linkWidth((l) => ((l as unknown as RepoEdge).kind === "call" ? 1.5 : 1))
      .linkLineDash((l) => ((l as unknown as RepoEdge).kind === "class" ? [3, 2] : null))
      .linkDirectionalArrowLength(3.5)
      .linkDirectionalArrowRelPos(1)
      .linkDirectionalParticles((l) => ((l as unknown as RepoEdge).kind === "call" ? 1 : 0))
      .linkDirectionalParticleWidth(2)
      .linkDirectionalParticleColor(() => resolve("var(--primary)"))
      .onNodeClick((n) => onSelectNodeRef.current(n))
      .onBackgroundClick(() => onSelectNodeRef.current(null))
      .nodeCanvasObjectMode(() => "replace")
      .nodeCanvasObject((n, ctx) => {
        if (n.x === undefined || n.y === undefined) return;
        const w = cardWidth(n);
        const h = CARD_HEIGHT;
        const x = n.x - w / 2;
        const y = n.y - h / 2;
        const isSelected = n.id === selectedIdRef.current;
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

        ctx.font = `${FONT_SIZE}px 'Geist Variable', sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = resolve("var(--card-foreground)");
        ctx.fillText(n.label, x + PAD_X + DOT_R * 2 + GAP_DOT_TEXT, n.y);

        const degree = n.degree ?? 0;
        const bw = badgeWidth(degree);
        const bx = x + w - PAD_X - CHEVRON_W - GAP_BADGE_CHEVRON - bw;
        ctx.beginPath();
        ctx.roundRect(bx, n.y - BADGE_HEIGHT / 2, bw, BADGE_HEIGHT, BADGE_HEIGHT / 2);
        ctx.fillStyle = resolve("var(--secondary)");
        ctx.fill();
        ctx.font = `${FONT_SIZE * 0.72}px 'JetBrains Mono', monospace`;
        ctx.textAlign = "center";
        ctx.fillStyle = resolve("var(--muted-foreground)");
        ctx.fillText(String(degree), bx + bw / 2, n.y + 0.1);

        ctx.strokeStyle = resolve("var(--muted-foreground)");
        ctx.lineWidth = 0.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const cx = x + w - PAD_X - CHEVRON_W / 2;
        ctx.beginPath();
        ctx.moveTo(cx - 1.3, n.y - 0.9);
        ctx.lineTo(cx, n.y + 0.9);
        ctx.lineTo(cx + 1.3, n.y - 0.9);
        ctx.stroke();
      })
      .nodePointerAreaPaint((n, color, ctx) => {
        if (n.x === undefined || n.y === undefined) return;
        const w = cardWidth(n);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(n.x - w / 2, n.y - CARD_HEIGHT / 2, w, CARD_HEIGHT, CARD_RADIUS);
        ctx.fill();
      })
      .cooldownTicks(80)
      .onEngineStop(() => graph.zoomToFit(400, 60));

    const chargeForce = graph.d3Force("charge");
    chargeForce?.strength?.(-260);
    const linkForce = graph.d3Force("link");
    linkForce?.distance?.(95);

    graphRef.current = graph;

    const resize = () => graph.width(el.clientWidth).height(el.clientHeight);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);

    return () => {
      observer.disconnect();
      graph._destructor();
      graphRef.current = null;
    };
  }, []);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    const degree = computeDegree(nodes, edges);
    const flagged = findCircularPairs(edges);
    const graphNodes: FgNode[] = nodes.map((n) => ({
      ...n,
      degree: degree.get(n.id) ?? 0,
      circular: flagged.has(n.id),
    }));
    graph.graphData({ nodes: graphNodes, links: edges.map((e) => ({ ...e })) });
  }, [nodes, edges]);

  return <div ref={containerRef} className="h-full w-full" />;
});

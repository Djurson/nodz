import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import ForceGraphCtor from "force-graph";
import type { ForceGraphGeneric, NodeObject } from "force-graph";
import type { RepoEdge, RepoNode } from "@/types/repo-graph";
import { computeDegree, findCircularPairs } from "@/lib/repo-graph";
import { LABEL_SIZE_SCALE } from "@/types/graph-settings";
import type { GraphSettings } from "@/types/graph-settings";
import { drawNodeCard, drawNodeHitArea } from "./graph-node";
import type { ResolveColor, FgNode } from "./graph-node";

interface GraphCanvasProps {
  nodes: RepoNode[];
  edges: RepoEdge[];
  selectedId: string | null;
  onSelectNode: (node: RepoNode | null) => void;
  settings: GraphSettings;
}

export interface GraphCanvasHandle {
  fitView: () => void;
}

// force-graph's .d.ts models the export as a class, but the Kapsule runtime is
// actually a double-invoked factory: ForceGraph()(el). Recover proper generics
// via the still-accurate chainable-instance type, cast the factory once here.
type FgGraph<N extends NodeObject> = ForceGraphGeneric<FgGraph<N>, N>;
type FgFactory = <N extends NodeObject>() => (el: HTMLElement) => FgGraph<N>;
const createForceGraph = ForceGraphCtor as unknown as FgFactory;

// The dot grid is a fixed-size layer (see `.dot-grid` in style.css, 24px tiles) that
// we pan/zoom via CSS transform instead of animating background-size/-position:
// transforms are GPU-composited with no repaint, so they stay smooth at any zoom
// speed. Animating background-size/-position instead re-rasterizes the tiled gradient
// on every change, and since a tile's screen position is (distance from origin × tile
// size), even a 1px size change shifts far-out tiles by many pixels, that's what reads
// as jitter. DOT_GRID_BOX must be a multiple of 24 so `.dot-grid`'s centered pattern
// still lands on a tile boundary at the box's own center (see syncDotGridTransform).
const DOT_GRID_BOX = 6000;

// Force-layout tuning for a ~36-node/56-edge graph: weaker repulsion and a
// shorter link distance than the library defaults, since the nodes are
// compact cards rather than points, the defaults sprawl the graph far wider
// than it needs to be to stay legible. The "Layout spread" setting (0–1) lerps
// between these ranges; 0.5 (the default) lands on the tuned values above.
const CHARGE_STRENGTH_RANGE: [number, number] = [-60, -180];
const LINK_DISTANCE_RANGE: [number, number] = [40, 90];
const CHARGE_DISTANCE_MAX = 300;
const WARMUP_TICKS = 80;
const COOLDOWN_TICKS = 80;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 8;
const ZOOM_FIT_DURATION_MS = 400;
const ZOOM_FIT_PADDING_PX = 60;

// force-graph's onZoom payload is built internally as `{...transform, ...centerAt()}` —
// centerAt()'s x/y (the graph-space point at the viewport center) are spread second and
// overwrite the transform's real x/y (the screen-space translate), so what we receive as
// `centerX`/`centerY` here is actually graph-space, not the translate. Reconstruct the true
// screen-space offset from it: the viewport center (viewportSize / 2) equals
// `translate + k * graphCenter`, so `translate = viewportSize / 2 - k * graphCenter`.
//
// That offset is where graph-origin (0, 0) should land on screen. The dot-grid box is
// positioned (see JSX) so its own center, which is also its transform-origin, the CSS
// default, sits at the viewport's top-left corner when untransformed. So applying that
// same offset as a translate, plus scale(k) around that center, moves and scales the
// pattern exactly like force-graph moves and scales graph coordinates onto the canvas.
function syncDotGridTransform(dotGridEl: HTMLElement, viewportEl: HTMLElement, k: number, centerX: number, centerY: number) {
  const offsetX = viewportEl.clientWidth / 2 - centerX * k;
  const offsetY = viewportEl.clientHeight / 2 - centerY * k;
  dotGridEl.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${k})`;
}

function lerp(min: number, max: number, t: number) {
  return min + (max - min) * t;
}

// force-graph replaces link.source/target (initially the plain string ids we pass in)
// with references to the actual resolved node objects once the simulation starts, so
// an edge endpoint can be either shape depending on timing, normalize both to an id.
type FgLink = RepoEdge & { source: string | FgNode; target: string | FgNode };
function linkEndpointId(end: string | FgNode): string {
  return typeof end === "string" ? end : end.id;
}

type LinkHighlight = "outgoing" | "incoming" | null;
function linkHighlight(l: FgLink, selectedId: string | null): LinkHighlight {
  if (!selectedId) return null;
  if (linkEndpointId(l.source) === selectedId) return "outgoing";
  if (linkEndpointId(l.target) === selectedId) return "incoming";
  return null;
}

export const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(function GraphCanvas({ nodes, edges, selectedId, onSelectNode, settings }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dotGridRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<FgGraph<FgNode> | null>(null);
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const onSelectNodeRef = useRef(onSelectNode);
  onSelectNodeRef.current = onSelectNode;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useImperativeHandle(ref, () => ({
    fitView: () => graphRef.current?.zoomToFit(ZOOM_FIT_DURATION_MS, ZOOM_FIT_PADDING_PX),
  }));

  useEffect(() => {
    if (!containerRef.current || !dotGridRef.current) return;
    const el = containerRef.current;
    const dotGridEl = dotGridRef.current;

    // Read from the container itself, not document.documentElement: the
    // `.dark` class lives on an inner wrapper div, not <html>.
    const style = getComputedStyle(el);
    const resolve: ResolveColor = (v) => (v.startsWith("var(") ? style.getPropertyValue(v.slice(4, -1)).trim() : v);

    // A single scroll/pinch gesture can fire onZoom many times per animation frame —
    // coalesce to at most one transform write per frame.
    let queuedZoomFrame = 0;
    const queueDotGridSync = (k: number, centerX: number, centerY: number) => {
      cancelAnimationFrame(queuedZoomFrame);
      queuedZoomFrame = requestAnimationFrame(() => syncDotGridTransform(dotGridEl, el, k, centerX, centerY));
    };

    const graph = createForceGraph<FgNode>()(el)
      .backgroundColor("rgba(0,0,0,0)")
      .nodeId("id")
      .nodeLabel((n) => `${n.path}  ·  ${n.loc} loc  ·  degree ${n.degree}`)
      .linkColor((l) => {
        const highlight = linkHighlight(l as unknown as FgLink, selectedIdRef.current);
        if (highlight === "outgoing") return resolve("var(--chart-1)");
        if (highlight === "incoming") return resolve("var(--chart-2)");
        return resolve("var(--border)");
      })
      .linkWidth((l) => {
        const base = (l as unknown as RepoEdge).kind === "call" ? 1.5 : 1;
        return linkHighlight(l as unknown as FgLink, selectedIdRef.current) ? base + 1 : base;
      })
      .linkLineDash((l) => ((l as unknown as RepoEdge).kind === "class" ? [3, 2] : null))
      .linkVisibility((l) => settingsRef.current.visibleEdgeKinds[(l as unknown as RepoEdge).kind])
      .linkDirectionalArrowLength(3.5)
      .linkDirectionalArrowRelPos(1)
      .linkDirectionalParticles((l) => ((l as unknown as RepoEdge).kind === "call" ? 1 : 0))
      .linkDirectionalParticleWidth(2)
      .linkDirectionalParticleColor(() => resolve("var(--primary)"))
      .onNodeClick((n) => onSelectNodeRef.current(n))
      .onBackgroundClick(() => onSelectNodeRef.current(null))
      // Only show the pointer cursor over an actual node, otherwise force-graph's
      // internal canvas gets a `.clickable` class (cursor: pointer) any time
      // onBackgroundClick is set, which would stomp the grab cursor everywhere.
      .showPointerCursor((n) => n != null)
      .onZoom(({ k, x: centerX, y: centerY }) => queueDotGridSync(k, centerX, centerY))
      .minZoom(MIN_ZOOM)
      .maxZoom(MAX_ZOOM)
      .nodeCanvasObjectMode(() => "replace")
      .nodeCanvasObject((n, ctx) => drawNodeCard(ctx, n, n.id === selectedIdRef.current, resolve, LABEL_SIZE_SCALE[settingsRef.current.labelSize]))
      .nodePointerAreaPaint((n, color, ctx) => drawNodeHitArea(ctx, n, color, LABEL_SIZE_SCALE[settingsRef.current.labelSize]))
      .warmupTicks(WARMUP_TICKS)
      .cooldownTicks(COOLDOWN_TICKS)
      .onEngineStop(() => graph.zoomToFit(ZOOM_FIT_DURATION_MS, ZOOM_FIT_PADDING_PX));

    graph.d3Force("charge")?.distanceMax?.(CHARGE_DISTANCE_MAX);

    graphRef.current = graph;

    const resize = () => graph.width(el.clientWidth).height(el.clientHeight);
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);

    // force-graph doesn't track a "panning the background" state for us (it only
    // toggles its own cursor classes for node drags), so swap the cursor directly
    // on pointer down/up. Listening on window for pointerup catches releases that
    // happen after the cursor has left the canvas mid-drag.
    const setGrabbing = (grabbing: boolean) => {
      el.classList.toggle("cursor-grab", !grabbing);
      el.classList.toggle("cursor-grabbing", grabbing);
    };
    const onPointerDown = () => setGrabbing(true);
    const onPointerUp = () => setGrabbing(false);
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(queuedZoomFrame);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      graph._destructor();
      graphRef.current = null;
    };
  }, []);

  // Runs before the graphData effect below (declaration order) so the very first
  // warmup tick already uses these forces, not the range's midpoint followed by a jump.
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.d3Force("charge")?.strength?.(lerp(...CHARGE_STRENGTH_RANGE, settings.spread));
    graph.d3Force("link")?.distance?.(lerp(...LINK_DISTANCE_RANGE, settings.spread));
    graph.d3ReheatSimulation();
  }, [settings.spread]);

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

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={dotGridRef} className="dot-grid pointer-events-none absolute" style={{ width: DOT_GRID_BOX, height: DOT_GRID_BOX, left: -DOT_GRID_BOX / 2, top: -DOT_GRID_BOX / 2 }} />
      <div ref={containerRef} className="absolute inset-0 cursor-grab" />
    </div>
  );
});

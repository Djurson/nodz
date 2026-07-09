import ELK from "elkjs/lib/elk.bundled.js";
import type { ElkNode, ElkPoint } from "elkjs/lib/elk-api";
import type { Edge as RFEdge, Node as RFNode } from "@xyflow/react";
import type { RepoEdge, RepoNode } from "@/types/repo-graph";
import { buildDirTree, type DirTree } from "@/lib/repo-hierarchy";
import { assignDirColors, dirIdForPath } from "@/lib/dir-colors";
import type { DirectoryNodeData } from "@/components/graph/flow-directory";
import type { FileNodeData } from "@/components/graph/flow-node";
import type { OrthogonalEdgeData } from "@/components/graph/flow-edge";

// JetBrains Mono is fixed-width, so label width is exact from character count alone
// (no canvas measureText round-trip needed, unlike the force-graph card in graph-node.tsx).
const FILE_FONT_SIZE = 11;
const FILE_CHAR_WIDTH = FILE_FONT_SIZE * 0.62;
const FILE_PAD_X = 10;
const FILE_DOT_R = 3;
const FILE_GAP = 6;
const FILE_MIN_WIDTH = 108;
const FILE_HEIGHT = 30;

const DIR_LABEL_HEIGHT = 30;
const DIR_PADDING = 14;

const elk = new ELK();

function fileNodeWidth(label: string) {
  return Math.max(FILE_MIN_WIDTH, FILE_PAD_X * 2 + FILE_DOT_R * 2 + FILE_GAP + label.length * FILE_CHAR_WIDTH);
}

const dirElkId = (dirId: string) => `dir:${dirId}`;

function fileToElk(node: RepoNode): ElkNode {
  return { id: node.id, width: fileNodeWidth(node.label), height: FILE_HEIGHT };
}

function dirToElk(dir: DirTree): ElkNode {
  return {
    id: dirElkId(dir.id),
    layoutOptions: { "elk.padding": `[top=${DIR_LABEL_HEIGHT},left=${DIR_PADDING},bottom=${DIR_PADDING},right=${DIR_PADDING}]` },
    children: [...dir.children.map(dirToElk), ...dir.files.map(fileToElk)],
  };
}

export interface TreeLayout {
  nodes: RFNode<FileNodeData | DirectoryNodeData>[];
  edges: RFEdge<OrthogonalEdgeData>[];
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * elk's own start/end points for an edge declared above its endpoints' true container
 * (see the root-level-edges note below) land near the node's center rather than its
 * boundary. Force them onto the source's bottom-center / target's top-center — matching
 * the layered-DOWN direction — while keeping elk's inner bend points so the route still
 * dodges whatever elk routed it around; a stub point is inserted on each end so every
 * segment stays axis-aligned (no diagonal introduced by snapping only one coordinate).
 */
function snapToNodeBounds(rawPoints: ElkPoint[], sourceBox: Box, targetBox: Box): ElkPoint[] {
  const start = { x: sourceBox.x + sourceBox.width / 2, y: sourceBox.y + sourceBox.height };
  const end = { x: targetBox.x + targetBox.width / 2, y: targetBox.y };
  const inner = rawPoints.slice(1, -1);

  const points =
    inner.length === 0
      ? (() => {
          const midY = (start.y + end.y) / 2;
          return [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end];
        })()
      : [start, { x: start.x, y: inner[0].y }, ...inner, { x: end.x, y: inner[inner.length - 1].y }, end];

  return points.filter((p, i) => i === 0 || p.x !== points[i - 1].x || p.y !== points[i - 1].y);
}

/**
 * Lays out the repo as a directory-compound DAG via elk's layered algorithm with
 * orthogonal edge routing — deterministic, no physics. All edges are declared on the
 * root elk graph (rather than at each edge's true lowest-common-ancestor container),
 * which elk's `INCLUDE_CHILDREN` hierarchy mode permits; the payoff is that every edge
 * section elk returns comes back in the root's coordinate space, so those points can be
 * used directly as absolute canvas coordinates for the custom edge renderer without
 * having to walk and sum ancestor offsets ourselves — the tradeoff is elk anchors the
 * endpoints near node center (see `snapToNodeBounds`), which we correct afterward.
 */
export async function layoutRepoTree(nodes: RepoNode[], edges: RepoEdge[]): Promise<TreeLayout> {
  const dirTree = buildDirTree(nodes);
  const dirColors = assignDirColors(dirTree);
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const edgesById = new Map(edges.map((e, i) => [`e${i}`, e]));

  const graph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.layered.spacing.nodeNodeBetweenLayers": "56",
      "elk.spacing.nodeNode": "24",
      "elk.padding": "[top=24,left=24,bottom=24,right=24]",
    },
    children: [...dirTree.children.map(dirToElk), ...dirTree.files.map(fileToElk)],
    edges: edges.map((e, i) => ({ id: `e${i}`, sources: [e.source], targets: [e.target] })),
  };

  const result = await elk.layout(graph);

  const rfNodes: RFNode<FileNodeData | DirectoryNodeData>[] = [];
  const absoluteBoxes = new Map<string, Box>();

  const walk = (node: ElkNode, parentId: string | undefined, parentAbsX: number, parentAbsY: number) => {
    const absX = parentAbsX + (node.x ?? 0);
    const absY = parentAbsY + (node.y ?? 0);

    if (node.id.startsWith("dir:")) {
      const dirId = node.id.slice(4);
      rfNodes.push({
        id: node.id,
        type: "directory",
        position: { x: node.x ?? 0, y: node.y ?? 0 },
        width: node.width,
        height: node.height,
        data: { name: dirId.split("/").pop() ?? dirId, color: dirColors.get(dirId) ?? "var(--dir-1)" },
        parentId,
        extent: "parent",
        selectable: false,
        draggable: false,
        zIndex: -1,
      });
      for (const child of node.children ?? []) walk(child, node.id, absX, absY);
    } else {
      const repoNode = nodesById.get(node.id);
      if (!repoNode) return;
      rfNodes.push({
        id: node.id,
        type: "file",
        position: { x: node.x ?? 0, y: node.y ?? 0 },
        width: node.width,
        height: node.height,
        data: { node: repoNode },
        parentId,
        extent: "parent",
        draggable: false,
      });
      absoluteBoxes.set(node.id, { x: absX, y: absY, width: node.width ?? 0, height: node.height ?? 0 });
    }
  };
  for (const child of result.children ?? []) walk(child, undefined, 0, 0);

  const rfEdges: RFEdge<OrthogonalEdgeData>[] = (result.edges ?? []).map((e) => {
    const original = edgesById.get(e.id)!;
    const section = e.sections?.[0];
    const rawPoints = section ? [section.startPoint, ...(section.bendPoints ?? []), section.endPoint] : [];
    const sourceBox = absoluteBoxes.get(e.sources[0]);
    const targetBox = absoluteBoxes.get(e.targets[0]);
    const points = sourceBox && targetBox && rawPoints.length >= 2 ? snapToNodeBounds(rawPoints, sourceBox, targetBox) : rawPoints;
    const color = dirColors.get(dirIdForPath(original.source)) ?? "var(--dir-1)";
    return {
      id: e.id,
      source: e.sources[0],
      target: e.targets[0],
      type: "orthogonal",
      data: { kind: original.kind, points, color },
      zIndex: 1,
    };
  });

  return { nodes: rfNodes, edges: rfEdges };
}

import type { FileGroup, RepoEdge, RepoGraphData, RepoNode } from "@/types/repo-graph";

export const GROUP_COLOR_VAR: Record<FileGroup, string> = {
  component: "var(--chart-1)",
  hook: "var(--chart-1)",
  route: "var(--chart-5)",
  store: "var(--chart-5)",
  api: "var(--chart-2)",
  config: "var(--chart-2)",
  lib: "var(--chart-3)",
  type: "var(--muted-foreground)",
  test: "var(--muted-foreground)",
};

export const GROUP_LABEL: Record<FileGroup, string> = {
  component: "Component",
  hook: "Hook",
  route: "Route",
  store: "Store",
  api: "API",
  config: "Config",
  lib: "Lib",
  type: "Type",
  test: "Test",
};

/** Nodes/edges visible up to (and including) a given commit index. */
export function sliceAtCommit(data: RepoGraphData, commitIndex: number) {
  const nodes = data.nodes.filter((n) => n.commitIndex <= commitIndex);
  const visibleIds = new Set(nodes.map((n) => n.id));
  const edges = data.edges.filter((e) => e.commitIndex <= commitIndex && visibleIds.has(e.source) && visibleIds.has(e.target));
  return { nodes, edges };
}

/** In-degree + out-degree per node, used for sizing + bottleneck detection. */
export function computeDegree(nodes: RepoNode[], edges: RepoEdge[]): Map<string, number> {
  const degree = new Map(nodes.map((n) => [n.id, 0]));
  for (const e of edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }
  return degree;
}

/** Nodes that are the target of an edge sourced from a different top-level group. */
export function findCircularPairs(edges: RepoEdge[]): Set<string> {
  const forward = new Set(edges.map((e) => `${e.source}->${e.target}`));
  const flagged = new Set<string>();
  for (const e of edges) {
    if (forward.has(`${e.target}->${e.source}`)) {
      flagged.add(e.source);
      flagged.add(e.target);
    }
  }
  return flagged;
}

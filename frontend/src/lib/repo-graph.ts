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

export interface HotspotNode {
  node: RepoNode;
  degree: number;
}

/** Nodes with the most in+out edges, the files riskiest to change, since the
 * most other files depend on (or are depended on by) them. */
export function topConnectedNodes(nodes: RepoNode[], edges: RepoEdge[], limit = 5): HotspotNode[] {
  const degree = computeDegree(nodes, edges);
  return [...nodes]
    .map((node) => ({ node, degree: degree.get(node.id) ?? 0 }))
    .filter((h) => h.degree > 0)
    .sort((a, b) => b.degree - a.degree)
    .slice(0, limit);
}

export interface CircularPair {
  a: RepoNode;
  b: RepoNode;
}

/** Distinct node pairs that import/call/use each other both ways. */
export function findCircularDependencyPairs(nodes: RepoNode[], edges: RepoEdge[]): CircularPair[] {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const forward = new Set(edges.map((e) => `${e.source}->${e.target}`));
  const seen = new Set<string>();
  const pairs: CircularPair[] = [];
  for (const e of edges) {
    if (!forward.has(`${e.target}->${e.source}`)) continue;
    const key = [e.source, e.target].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    const a = nodesById.get(e.source);
    const b = nodesById.get(e.target);
    if (a && b) pairs.push({ a, b });
  }
  return pairs;
}

/** Nodes with the most lines of code. */
export function largestNodes(nodes: RepoNode[], limit = 5): RepoNode[] {
  return [...nodes].sort((a, b) => b.loc - a.loc).slice(0, limit);
}

export interface GroupBreakdown {
  group: FileGroup;
  count: number;
  loc: number;
}

/** File count + total LOC per FileGroup, sorted by file count descending. */
export function groupBreakdown(nodes: RepoNode[]): GroupBreakdown[] {
  const byGroup = new Map<FileGroup, GroupBreakdown>();
  for (const n of nodes) {
    const entry = byGroup.get(n.group) ?? { group: n.group, count: 0, loc: 0 };
    entry.count++;
    entry.loc += n.loc;
    byGroup.set(n.group, entry);
  }
  return [...byGroup.values()].sort((a, b) => b.count - a.count);
}

export interface FolderTreeNode {
  name: string;
  path: string;
  children: FolderTreeNode[];
  files: RepoNode[];
}

/** Builds a directory tree from nodes' slash-separated paths. */
export function buildFolderTree(nodes: RepoNode[]): FolderTreeNode {
  const root: FolderTreeNode = { name: "", path: "", children: [], files: [] };
  for (const node of nodes) {
    const parts = node.path.split("/");
    parts.pop(); // drop the filename itself; node goes in `files`, not `children`
    let current = root;
    let pathSoFar = "";
    for (const part of parts) {
      pathSoFar = pathSoFar ? `${pathSoFar}/${part}` : part;
      let child = current.children.find((c) => c.name === part);
      if (!child) {
        child = { name: part, path: pathSoFar, children: [], files: [] };
        current.children.push(child);
      }
      current = child;
    }
    current.files.push(node);
  }
  return root;
}

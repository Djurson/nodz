export type EdgeKind = "import" | "call" | "class";

export type FileGroup = "component" | "route" | "api" | "lib" | "hook" | "store" | "type" | "test" | "config";

export interface RepoNode {
  id: string;
  path: string;
  label: string;
  group: FileGroup;
  loc: number;
  commitIndex: number;
  /** derived at runtime: in-degree + out-degree */
  degree?: number;
}

export interface RepoEdge {
  source: string;
  target: string;
  kind: EdgeKind;
  commitIndex: number;
}

export interface RepoCommit {
  index: number;
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface RepoGraphData {
  repo: {
    name: string;
    owner: string;
    branch: string;
    lastSyncedAt: string;
  };
  commits: RepoCommit[];
  nodes: RepoNode[];
  edges: RepoEdge[];
}

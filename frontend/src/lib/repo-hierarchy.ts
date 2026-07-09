import type { RepoNode } from "@/types/repo-graph";

export interface DirTree {
  /** Full slash-joined path prefix this directory represents ("" only for the implicit root). */
  id: string;
  name: string;
  children: DirTree[];
  files: RepoNode[];
}

/** Groups flat repo nodes into a directory tree by splitting `node.path` on "/". */
export function buildDirTree(nodes: RepoNode[]): DirTree {
  const root: DirTree = { id: "", name: "", children: [], files: [] };
  for (const node of nodes) {
    const segments = node.path.split("/");
    segments.pop(); // filename, the node itself carries it via `label`/`path`
    let cursor = root;
    let prefix = "";
    for (const segment of segments) {
      prefix = prefix ? `${prefix}/${segment}` : segment;
      let child = cursor.children.find((c) => c.id === prefix);
      if (!child) {
        child = { id: prefix, name: segment, children: [], files: [] };
        cursor.children.push(child);
      }
      cursor = child;
    }
    cursor.files.push(node);
  }
  return root;
}

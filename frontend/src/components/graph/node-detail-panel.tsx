import { ArrowRightIcon, FileCodeIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GROUP_LABEL } from "@/lib/repo-graph";
import type { EdgeKind, RepoEdge, RepoNode } from "@/types/repo-graph";

interface NodeDetailPanelProps {
  node: RepoNode;
  edges: RepoEdge[];
  nodesById: Map<string, RepoNode>;
  isCircular: boolean;
  onSelectNode: (node: RepoNode) => void;
  onClose: () => void;
}

const KIND_LABEL: Record<EdgeKind, string> = {
  import: "imports",
  call: "calls",
  class: "uses class",
};

export function NodeDetailPanel({ node, edges, nodesById, isCircular, onSelectNode, onClose }: NodeDetailPanelProps) {
  const outgoing = edges.filter((e) => e.source === node.id);
  const incoming = edges.filter((e) => e.target === node.id);

  return (
    <aside className="absolute top-3 right-3 bottom-3 flex w-80 flex-col rounded-xl border border-border bg-card shadow-lg">
      <div className="flex items-start justify-between gap-2 border-b border-border p-3">
        <div className="flex min-w-0 items-start gap-2">
          <FileCodeIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium" title={node.path}>
              {node.label}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">{node.path}</div>
          </div>
        </div>
        <Button size="icon-xs" variant="ghost" aria-label="Close" onClick={onClose}>
          <XIcon className="size-3.5" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-border p-3">
        <Badge variant="secondary">{GROUP_LABEL[node.group]}</Badge>
        <Badge variant="outline">{node.loc} loc</Badge>
        <Badge variant="outline">{incoming.length + outgoing.length} connections</Badge>
        {isCircular && (
          <Badge variant="destructive" className="gap-1">
            <WarningCircleIcon className="size-3" />
            Circular dependency
          </Badge>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-3">
          <div>
            <div className="mb-1.5 text-[11px] font-medium text-muted-foreground uppercase">Depends on ({outgoing.length})</div>
            <div className="flex flex-col gap-1">
              {outgoing.length === 0 && <div className="text-xs text-muted-foreground/70">No outgoing relationships</div>}
              {outgoing.map((e) => (
                <EdgeRow key={`${e.source}-${e.target}-${e.kind}`} edge={e} otherId={e.target} nodesById={nodesById} onSelectNode={onSelectNode} />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-medium text-muted-foreground uppercase">Used by ({incoming.length})</div>
            <div className="flex flex-col gap-1">
              {incoming.length === 0 && <div className="text-xs text-muted-foreground/70">No incoming relationships</div>}
              {incoming.map((e) => (
                <EdgeRow key={`${e.source}-${e.target}-${e.kind}`} edge={e} otherId={e.source} nodesById={nodesById} onSelectNode={onSelectNode} reverse />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}

function EdgeRow({ edge, otherId, nodesById, onSelectNode, reverse }: { edge: RepoEdge; otherId: string; nodesById: Map<string, RepoNode>; onSelectNode: (node: RepoNode) => void; reverse?: boolean }) {
  const other = nodesById.get(otherId);
  if (!other) return null;
  return (
    <button onClick={() => onSelectNode(other)} className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-xs hover:bg-accent">
      {reverse && <ArrowRightIcon className="size-3 shrink-0 rotate-180 text-muted-foreground" />}
      <span className="truncate">{other.label}</span>
      <span className="shrink-0 text-[10px] text-muted-foreground">{KIND_LABEL[edge.kind]}</span>
      {!reverse && <ArrowRightIcon className="size-3 shrink-0 text-muted-foreground" />}
    </button>
  );
}

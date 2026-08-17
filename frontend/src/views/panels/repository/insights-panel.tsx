import { ArrowsClockwiseIcon, FileCodeIcon, LinkSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { GROUP_LABEL, findCircularDependencyPairs, largestNodes, topConnectedNodes } from "@/lib/repo-graph";
import type { RepoEdge, RepoNode } from "@/types/repo-graph";

interface InsightsPanelProps {
  nodes: RepoNode[];
  edges: RepoEdge[];
  onSelectNode?: (node: RepoNode) => void;
}

export function InsightsPanel({ nodes, edges, onSelectNode }: InsightsPanelProps) {
  const hotspots = topConnectedNodes(nodes, edges, 5);
  const circular = findCircularDependencyPairs(nodes, edges);
  const largest = largestNodes(nodes, 5);

  return (
    <ScrollArea className="h-full w-full">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Insights</h2>
          <p className="text-sm text-muted-foreground">Where this codebase concentrates risk and complexity, start here before making a change.</p>
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <LinkSimpleIcon className="size-4 text-muted-foreground" />
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Most connected files</span>
          </div>
          <p className="text-xs text-muted-foreground">Files with the most incoming + outgoing relationships. Changing these is the most likely to ripple elsewhere.</p>
          <div className="flex flex-col gap-1">
            {hotspots.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground/70">No relationships found.</p>
            ) : (
              hotspots.map(({ node, degree }) => (
                <Button key={node.id} variant="ghost" onClick={() => onSelectNode?.(node)} className="h-auto justify-between gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                  <span className="flex min-w-0 items-center gap-2">
                    <FileCodeIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm text-foreground">{node.label}</span>
                    <Badge variant="secondary" className="shrink-0">
                      {GROUP_LABEL[node.group]}
                    </Badge>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{degree} connections</span>
                </Button>
              ))
            )}
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ArrowsClockwiseIcon className="size-4 text-muted-foreground" />
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Circular dependencies</span>
          </div>
          <p className="text-xs text-muted-foreground">Pairs of files that depend on each other both ways, a common source of tangled imports and hard-to-isolate changes.</p>
          <div className="flex flex-col gap-1">
            {circular.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground/70">None found, no two files import each other directly.</p>
            ) : (
              circular.map(({ a, b }) => (
                <div key={`${a.id}-${b.id}`} className="flex items-center gap-2 rounded-lg px-3 py-2">
                  <WarningCircleIcon className="size-3.5 shrink-0 text-destructive" />
                  <Button variant="ghost" size="sm" onClick={() => onSelectNode?.(a)} className="h-auto p-0 text-sm text-foreground hover:bg-transparent hover:underline">
                    {a.label}
                  </Button>
                  <span className="text-xs text-muted-foreground">↔</span>
                  <Button variant="ghost" size="sm" onClick={() => onSelectNode?.(b)} className="h-auto p-0 text-sm text-foreground hover:bg-transparent hover:underline">
                    {b.label}
                  </Button>
                </div>
              ))
            )}
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Largest files</span>
          <p className="text-xs text-muted-foreground">By lines of code, often the best candidates to split up or read first when getting oriented.</p>
          <div className="flex flex-col gap-1">
            {largest.map((node) => (
              <Button key={node.id} variant="ghost" onClick={() => onSelectNode?.(node)} className="h-auto justify-between gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                <span className="flex min-w-0 items-center gap-2">
                  <FileCodeIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm text-foreground">{node.label}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{node.loc} lines</span>
              </Button>
            ))}
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}

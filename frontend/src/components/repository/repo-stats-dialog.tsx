import { useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { mockRepoGraph } from "@/lib/mock/repo-graph";
import { GROUP_LABEL, findCircularPairs } from "@/lib/repo-graph";
import type { EdgeKind, FileGroup } from "@/types/repo-graph";

interface RepoStatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EDGE_KIND_LABELS: Record<EdgeKind, string> = {
  import: "Imports",
  call: "Calls",
  class: "Class usage",
};

export function RepoStatsDialog({ open, onOpenChange }: RepoStatsDialogProps) {
  const { repo, commits, nodes, edges } = mockRepoGraph;

  const stats = useMemo(() => {
    const totalLoc = nodes.reduce((sum, n) => sum + n.loc, 0);

    const groupCounts = {} as Record<FileGroup, number>;
    for (const n of nodes) groupCounts[n.group] = (groupCounts[n.group] ?? 0) + 1;
    const topGroups = (Object.entries(groupCounts) as [FileGroup, number][]).sort((a, b) => b[1] - a[1]);

    const edgeKindCounts = {} as Record<EdgeKind, number>;
    for (const e of edges) edgeKindCounts[e.kind] = (edgeKindCounts[e.kind] ?? 0) + 1;

    return { totalLoc, topGroups, edgeKindCounts, circularCount: findCircularPairs(edges).size };
  }, [nodes, edges]);

  const latestCommit = commits[commits.length - 1];
  const lastSynced = new Date(repo.lastSyncedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {repo.owner}/{repo.name}
          </DialogTitle>
          <DialogDescription>
            {repo.branch} · synced {lastSynced}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Files", value: nodes.length },
            { label: "Relationships", value: edges.length },
            { label: "Commits", value: commits.length },
            { label: "Lines of code", value: stats.totalLoc.toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5 rounded-lg border border-border px-3 py-2.5">
              <span className="text-lg font-semibold text-foreground">{value}</span>
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <section className="flex flex-col gap-3">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Files by type</span>
          <div className="flex flex-wrap gap-1.5">
            {stats.topGroups.map(([group, count]) => (
              <Badge key={group} variant="outline">
                {GROUP_LABEL[group]} · {count}
              </Badge>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Relationships</span>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(EDGE_KIND_LABELS) as EdgeKind[]).map((kind) => (
              <Badge key={kind} variant="outline">
                {EDGE_KIND_LABELS[kind]} · {stats.edgeKindCounts[kind] ?? 0}
              </Badge>
            ))}
            {stats.circularCount > 0 && (
              <Badge variant="destructive">
                {stats.circularCount} file{stats.circularCount === 1 ? "" : "s"} in circular deps
              </Badge>
            )}
          </div>
        </section>

        <Separator />

        <section className="flex flex-col gap-1.5">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Latest commit</span>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <span className="font-mono text-xs text-muted-foreground">{latestCommit.sha}</span>
            <span className="truncate">{latestCommit.message}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {latestCommit.author} · {latestCommit.date}
          </span>
        </section>
      </DialogContent>
    </Dialog>
  );
}

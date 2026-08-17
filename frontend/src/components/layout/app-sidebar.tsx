import { useState } from "react";
import { ChartLineUpIcon, ClockCounterClockwiseIcon, GitBranchIcon, GraphIcon, QuestionIcon, SlidersIcon, StackIcon } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useIsMac } from "@/hooks/use-platform";
import { NodzLogo } from "@/components/internal/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RepoStatsDialog } from "@/components/repository/repo-stats-dialog";
import { mockRepoGraph } from "@/lib/mock/repo-graph";
import { MOCK_USER } from "@/lib/mock/user";
import { RepositoryView } from "@/views/repository";
import { useRepositoryContext } from "@/hooks/repository/hook";

const NAV_ITEMS: { label: string; icon: Icon; view: RepositoryView }[] = [
  { label: "Visualize", icon: GraphIcon, view: "visualize" },
  { label: "History", icon: ClockCounterClockwiseIcon, view: "history" },
  { label: "Insights", icon: ChartLineUpIcon, view: "insights" },
  { label: "Structure", icon: StackIcon, view: "structure" },
];

interface AppSidebarProps {
  view: RepositoryView;
  onViewChange: (view: RepositoryView) => void;
  onOpenSettings: () => void;
}

export function AppSidebar({ view, onViewChange, onOpenSettings }: AppSidebarProps) {
  const isMac = useIsMac();
  const { repo } = useRepositoryContext();
  const [statsOpen, setStatsOpen] = useState(false);

  return (
    <aside className={cn("flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 pb-4", isMac ? "pt-12" : "")}>
      <NodzLogo />
      <Button variant="ghost" onClick={() => setStatsOpen(true)} className="h-auto justify-start gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-2.5 py-2 text-left hover:bg-sidebar-accent">
        <GitBranchIcon className="size-4 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-sidebar-foreground">
            {repo ? `${repo.Owner}/${repo.Name}` : "—"}
          </div>
          <div className="truncate text-[11px] text-muted-foreground">{mockRepoGraph.repo.branch}</div>
        </div>
      </Button>
      <RepoStatsDialog open={statsOpen} onOpenChange={setStatsOpen} />

      <nav className="mt-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ label, icon: Icon, view: itemView }) => {
          const active = view === itemView;
          return (
            <Button
              key={label}
              variant="ghost"
              onClick={() => onViewChange(itemView)}
              className={cn(
                "h-auto justify-start gap-2.5 rounded-lg px-2.5 py-1.5 text-sm hover:bg-transparent",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}>
              <Icon weight={active ? "fill" : "regular"} className="size-4" />
              {label}
            </Button>
          );
        })}
        <Button variant="ghost" onClick={onOpenSettings} className="h-auto justify-start gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground">
          <SlidersIcon className="size-4" />
          Settings
        </Button>
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <Button variant="ghost" className="h-auto justify-start gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground">
          <QuestionIcon className="size-4" />
          Docs
        </Button>
        <div className="flex items-center gap-2 rounded-lg border border-sidebar-border px-2.5 py-2">
          <Avatar size="sm">
            <AvatarFallback className="bg-primary text-[10px] font-semibold text-primary-foreground">{MOCK_USER.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-sidebar-foreground">{MOCK_USER.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{MOCK_USER.plan}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

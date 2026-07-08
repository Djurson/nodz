import { ChartLineUpIcon, ClockCounterClockwiseIcon, GitBranchIcon, GraphIcon, QuestionIcon, SlidersIcon, StackIcon } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { AppView } from "@/App";

const NAV_ITEMS: { label: string; icon: Icon; view: AppView }[] = [
  { label: "Graph", icon: GraphIcon, view: "graph" },
  { label: "History", icon: ClockCounterClockwiseIcon, view: "history" },
];

const INERT_NAV_ITEMS: { label: string; icon: Icon }[] = [
  { label: "Insights", icon: ChartLineUpIcon },
  { label: "Structure", icon: StackIcon },
  { label: "Settings", icon: SlidersIcon },
];

interface AppSidebarProps {
  view: AppView;
  onViewChange: (view: AppView) => void;
}

export function AppSidebar({ view, onViewChange }: AppSidebarProps) {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 pb-4">
      {/* Reserves space for the native macOS traffic-light buttons (hidden-inset title bar) so they don't sit on top of the logo. */}
      <div className="h-7 shrink-0" style={{ "--wails-draggable": "drag" } as CSSProperties} />
      <div className="flex items-center gap-2 px-1 pb-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-[0_0_20px_-4px_var(--primary-glow)]">
          <GraphIcon weight="bold" className="size-4" />
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground">Nodz</span>
      </div>

      <button className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 px-2.5 py-2 text-left hover:bg-sidebar-accent">
        <GitBranchIcon className="size-4 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-sidebar-foreground">acme/orbit</div>
          <div className="truncate text-[11px] text-muted-foreground">main</div>
        </div>
      </button>

      <nav className="mt-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ label, icon: Icon, view: itemView }) => {
          const active = view === itemView;
          return (
            <button
              key={label}
              onClick={() => onViewChange(itemView)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}>
              <Icon weight={active ? "fill" : "regular"} className="size-4" />
              {label}
            </button>
          );
        })}
        {INERT_NAV_ITEMS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground">
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <button className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground">
          <QuestionIcon className="size-4" />
          Docs
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-sidebar-border px-2.5 py-2">
          <div className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">ED</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-sidebar-foreground">Emil Djurson</div>
            <div className="truncate text-[11px] text-muted-foreground">Free plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

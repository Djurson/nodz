import { ArrowLeftIcon, BellIcon, CodeIcon, CommandIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRepositoryContext } from "@/hooks/repository/hook";
import { RepositoryView, VisualizeMode } from "@/views/repository";

const VISUALIZE_MODES: { value: VisualizeMode; label: string }[] = [
  { value: "node", label: "Node Graph" },
  { value: "tree", label: "Tree Graph" },
];

interface TopBarProps {
  nodeCount: number;
  edgeCount: number;
  view: RepositoryView;
  visualizeMode: VisualizeMode;
  onVisualizeModeChange: (mode: VisualizeMode) => void;
}

export function TopBar({ nodeCount, edgeCount, view, visualizeMode, onVisualizeModeChange }: TopBarProps) {
  const { openInEditor, closeRepository } = useRepositoryContext();
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4" style={{ "--wails-draggable": "drag" } as CSSProperties}>
      <Button variant="ghost" onClick={closeRepository} className="h-auto gap-1 p-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground [--wails-draggable:no-drag]">
        <ArrowLeftIcon className="size-3.5" />
        Back to repos
      </Button>
      <div className="h-4 w-px bg-border" />
      <span className="text-xs text-muted-foreground">
        {nodeCount} files · {edgeCount} relationships
      </span>

      {view === "visualize" && (
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-secondary/40 p-0.5 [--wails-draggable:no-drag]">
          {VISUALIZE_MODES.map(({ value, label }) => (
            <Button
              key={value}
              variant="ghost"
              onClick={() => onVisualizeModeChange(value)}
              className={cn("h-auto justify-start rounded-md px-2.5 py-1 text-xs font-medium hover:bg-transparent", visualizeMode === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {label}
            </Button>
          ))}
        </div>
      )}

      <div className="ml-auto flex items-center gap-2 [--wails-draggable:no-drag]">
        <Button variant="ghost" size="sm" onClick={openInEditor} className="h-auto gap-1.5 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">
          <CodeIcon className="size-3.5" />
          Open in editor
        </Button>
        <Button variant="ghost" className="h-auto gap-2 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">
          <MagnifyingGlassIcon className="size-3.5" />
          Search files
          <span className="flex items-center gap-0.5 rounded-md border border-border bg-background px-1 py-0.5 text-[10px] text-muted-foreground/80">
            <CommandIcon className="size-2.5" />K
          </span>
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Notifications" className="relative">
          <BellIcon className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary shadow-[0_0_6px_1px_var(--primary-glow)]" />
        </Button>
      </div>
    </header>
  );
}

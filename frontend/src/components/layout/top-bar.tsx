import { ArrowLeftIcon, BellIcon, CommandIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  nodeCount: number;
  edgeCount: number;
}

export function TopBar({ nodeCount, edgeCount }: TopBarProps) {
  return (
    <header
      className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4"
      style={{ "--wails-draggable": "drag" } as CSSProperties}>
      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground [--wails-draggable:no-drag]">
        <ArrowLeftIcon className="size-3.5" />
        Back to repos
      </button>
      <div className="h-4 w-px bg-border" />
      <span className="text-xs text-muted-foreground">
        {nodeCount} files · {edgeCount} relationships
      </span>

      <div className="ml-auto flex items-center gap-2 [--wails-draggable:no-drag]">
        <button className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">
          <MagnifyingGlassIcon className="size-3.5" />
          Search files
          <span className="flex items-center gap-0.5 rounded-md border border-border bg-background px-1 py-0.5 text-[10px] text-muted-foreground/80">
            <CommandIcon className="size-2.5" />K
          </span>
        </button>
        <Button size="icon-sm" variant="ghost" aria-label="Notifications" className="relative">
          <BellIcon className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary shadow-[0_0_6px_1px_var(--primary-glow)]" />
        </Button>
      </div>
    </header>
  );
}

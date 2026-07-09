import { ArrowsOutSimpleIcon, FunnelSimpleIcon, HandIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export type ToolMode = "pan" | "search" | "filter";

interface BottomToolbarProps {
  tool: ToolMode;
  onToolChange: (tool: ToolMode) => void;
  onFitView: () => void;
}

const TOOLS: { id: ToolMode; icon: Icon; label: string }[] = [
  { id: "pan", icon: HandIcon, label: "Pan" },
  { id: "search", icon: MagnifyingGlassIcon, label: "Search files" },
  { id: "filter", icon: FunnelSimpleIcon, label: "Filter by depth" },
];

export function BottomToolbar({ tool, onToolChange, onFitView }: BottomToolbarProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-border bg-card px-2 py-2 shadow-lg">
        {TOOLS.map(({ id, icon: Icon, label }) => (
          <Button key={id} size="icon-sm" variant={tool === id ? "secondary" : "ghost"} aria-label={label} onClick={() => onToolChange(id)}>
            <Icon className="size-4" />
          </Button>
        ))}
        <Button size="icon-sm" variant="ghost" aria-label="Fit to view" onClick={onFitView}>
          <ArrowsOutSimpleIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}

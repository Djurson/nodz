import { PauseIcon, PlayIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RepoCommit } from "@/types/repo-graph";

interface HistoryScrubberProps {
  commits: RepoCommit[];
  commitIndex: number;
  onCommitIndexChange: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export function HistoryScrubber({ commits, commitIndex, onCommitIndexChange, isPlaying, onTogglePlay }: HistoryScrubberProps) {
  const commit = commits[commitIndex];

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 flex flex-col items-center gap-2">
      <div className="pointer-events-auto glass-panel flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
        <span className="font-mono">{commit.sha}</span>
        <span className="max-w-72 truncate">{commit.message}</span>
        <span className="text-muted-foreground/60">· {commit.author}</span>
        <span className="text-muted-foreground/60">· {commit.date}</span>
      </div>

      <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-card px-2 py-2 shadow-lg">
        <Button size="icon-sm" variant={isPlaying ? "secondary" : "ghost"} aria-label="Replay history" onClick={onTogglePlay}>
          {isPlaying ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
        </Button>
        <input
          type="range"
          min={0}
          max={commits.length - 1}
          step={1}
          value={commitIndex}
          onChange={(e) => onCommitIndexChange(Number(e.target.value))}
          className={cn("h-1.5 w-64 cursor-pointer appearance-none rounded-full bg-secondary accent-primary")}
        />
        <span className="w-10 shrink-0 font-mono text-[11px] text-muted-foreground">
          {commitIndex + 1}/{commits.length}
        </span>
      </div>
    </div>
  );
}

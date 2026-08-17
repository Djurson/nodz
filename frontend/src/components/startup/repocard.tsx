import { Repo } from "@/types/startup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CaretRightIcon, ClockIcon, GitBranchIcon, GitCommitIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Separator } from "@/components/ui/separator";

interface RepoCardProps extends Repo {
  onOpen: (repo: string) => void;
}

export function RepoCard({ onOpen, ...repo }: RepoCardProps) {
  return (
    <Button
      variant="ghost"
      onClick={() => onOpen(repo.path)}
      title={repo.error ?? repo.path}
      className="group relative flex h-fit flex-col items-stretch justify-start gap-5 rounded-xl border border-border/70 bg-foreground/3 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-border hover:bg-foreground/6 hover:shadow-md">
      <div className="flex items-start gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-foreground/6 text-sm font-semibold text-foreground">{repo.name.charAt(0).toUpperCase()}</div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="w-full flex justify-between items-center">
            <div className="truncate text-sm font-medium text-foreground">{repo.name}</div>
            <CaretRightIcon className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          {repo.branch && (
            <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <GitBranchIcon className="size-3 shrink-0" />
              <span className="truncate">{repo.branch}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2 w-full">
        {repo.lastCommitTitle && (
          <div className="w-full truncate flex gap-2">
            <GitCommitIcon />
            <p className="truncate text-xs text-muted-foreground">{repo.lastCommitTitle}</p>
          </div>
        )}
        <Separator />
        <div className="flex items-center justify-between gap-1.5">
          {repo.lastCommit ? (
            <span className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
              <ClockIcon className="size-3 shrink-0" />
              <span className="truncate">{repo.lastCommit}</span>
            </span>
          ) : (
            <span />
          )}
          {repo.error ? (
            <Badge variant="destructive" className="shrink-0 gap-1">
              <WarningCircleIcon className="size-3" />
              Scan failed
            </Badge>
          ) : (
            <Badge variant="secondary" className="shrink-0">
              {repo.fileCount} files
            </Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground/70">{repo.path}</p>
      </div>
    </Button>
  );
}

// Placeholder card shown when there are fewer than 8 repositories, so the
// grid still reads as an 8-slot grid instead of collapsing to however many
// repos exist.
export function GhostRepoCard() {
  return (
    <div
      aria-hidden
      className="flex h-fit flex-col items-stretch justify-start gap-5 rounded-xl border border-dashed border-border/40 p-4 opacity-40">
      <div className="flex items-start gap-2.5">
        <div className="size-9 shrink-0 rounded-lg border border-dashed border-border/40" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
          <div className="h-3.5 w-2/3 rounded bg-foreground/10" />
          <div className="h-2.5 w-1/3 rounded bg-foreground/10" />
        </div>
      </div>
      <div className="mt-auto flex w-full flex-col gap-2">
        <div className="h-2.5 w-full rounded bg-foreground/10" />
        <Separator className="opacity-40" />
        <div className="flex items-center justify-between gap-1.5">
          <div className="h-2.5 w-16 rounded bg-foreground/10" />
          <div className="h-4 w-14 rounded bg-foreground/10" />
        </div>
        <div className="h-2.5 w-1/2 rounded bg-foreground/10" />
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { reportError, reportWarning } from "@/lib/error-reporting";
import { NodzLogo } from "@/components/internal/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { FolderOpenIcon, FolderIcon, FolderPlusIcon, PlusIcon, MagnifyingGlassIcon, ArrowClockwiseIcon, CaretRightIcon, SlidersIcon } from "@phosphor-icons/react";
import { RepoCard, GhostRepoCard } from "@/components/startup/repocard";
import { OpenInFileExplorer, ScanForRepositories } from "../../wailsjs/go/main/App";
import { useAppContext } from "@/hooks/app/hook";
import { Repo } from "@/types/startup";
import { CreateRepositoryDialog } from "./panels/startup/createrepodialog";

const repoNameFromPath = (path: string) => path.split("/").filter(Boolean).pop() ?? path;

// Mock only: placeholder branch/lastCommit for repos created client-side, no real scan has run yet.
const MOCK_NEW_REPO_DEFAULTS = { branch: "main", lastCommit: "just now", lastCommitUnix: Math.floor(Date.now() / 1000) };

// Repo grid always reads as an 8-slot grid; below this count the remaining
// slots are filled with ghost placeholders instead of collapsing the layout.
const GHOST_GRID_SIZE = 8;

export default function StartupView() {
  const { baseDirectory, selectRepository, chooseBaseDirectory, loading } = useAppContext();

  const [query, setQuery] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [scanningRepos, setScanningRepos] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  async function scanRepositories() {
    setScanningRepos(true);
    try {
      const summaries = await ScanForRepositories();
      setRepos(
        summaries.map((s) => ({
          name: repoNameFromPath(s.Path),
          path: s.Path,
          fileCount: s.FileCount,
          branch: s.Branch,
          lastCommit: s.LastCommit,
          lastCommitUnix: s.LastCommitUnix,
          lastCommitTitle: s.LastCommitTitle,
          external: s.External,
          error: s.Error,
        })),
      );
      const failed = summaries.filter((s) => s.Error).length;
      if (failed > 0) {
        reportWarning(failed === 1 ? "1 repository failed to scan" : `${failed} repositories failed to scan`, "Open a repo's card for the error.");
      }
    } catch (err) {
      reportError("Failed to scan code directory", err);
    } finally {
      setScanningRepos(false);
    }
  }

  useEffect(() => {
    if (baseDirectory) void scanRepositories();
  }, [baseDirectory]);

  function revealCodeDirectory() {
    if (!baseDirectory) return;
    OpenInFileExplorer(baseDirectory).catch((err) => reportError("Failed to open file explorer", err));
  }

  function addExternalRepository() {
    // Mock only: stands in for a native folder picker (bound Wails method) that
    // lets the user point at a repo living outside the primary code directory.
    const n = repos.filter((repo) => repo.external).length + 1;
    const name = `external-repo-${n}`;
    setRepos((prev) => [...prev, { name, path: `~/Documents/${name}`, ...MOCK_NEW_REPO_DEFAULTS, fileCount: 3, external: true }]);
  }

  const filteredRepos = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q ? repos.filter((repo) => repo.name.toLowerCase().includes(q)) : repos;
    return [...matches].sort((a, b) => (b.lastCommitUnix ?? 0) - (a.lastCommitUnix ?? 0));
  }, [repos, query]);

  const showGhosts = !query.trim() && repos.length < GHOST_GRID_SIZE;
  const ghostCount = showGhosts ? GHOST_GRID_SIZE - repos.length : 0;

  if (!baseDirectory) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-5 px-6" style={{ "--wails-draggable": "drag" } as CSSProperties}>
        <Button variant="ghost" size="icon-sm" aria-label="Settings" onClick={() => setSettingsOpen(true)} className="absolute top-4 right-4 [--wails-draggable:no-drag]">
          <SlidersIcon />
        </Button>
        <NodzLogo size="large" tone="mono" />
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-xl font-semibold text-foreground">Point Nodz at your code</h1>
          <p className="max-w-sm text-sm text-muted-foreground">Pick the folder where your repositories live locally. Nodz scans it for git projects you can open.</p>
        </div>
        <Button size="lg" variant="secondary" onClick={chooseBaseDirectory} disabled={loading.directories} className="border border-border/70 bg-foreground/6 text-foreground shadow-none hover:bg-foreground/10 [--wails-draggable:no-drag]">
          <FolderOpenIcon />
          {loading.directories ? "Scanning…" : "Choose code directory"}
        </Button>
        <p className="text-xs text-muted-foreground">You can change this anytime in Settings.</p>
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-end px-4 pt-4" style={{ "--wails-draggable": "drag" } as CSSProperties}>
        <div className="flex items-center gap-1.5 pb-4 [--wails-draggable:no-drag]">
          <Button variant="ghost" size="sm" onClick={scanRepositories} disabled={scanningRepos} title="Rescan directory">
            <ArrowClockwiseIcon />
            Rescan
          </Button>
          <Button variant="ghost" size="sm" onClick={revealCodeDirectory}>
            <FolderIcon />
            {baseDirectory}
            <CaretRightIcon />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
            <SlidersIcon />
          </Button>
        </div>
      </div>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      <Separator />

      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-10">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Your repositories</h2>

          <div className="relative w-full max-w-sm">
            <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search repositories…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
          </div>
          <span className="mt-2 text-xs text-muted-foreground">
            {filteredRepos.length} of {repos.length} repositories
          </span>

          <div className="mt-3 flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={addExternalRepository}>
              <FolderPlusIcon />
              Add repository
            </Button>
            <CreateRepositoryDialog rescanRepoList={scanRepositories}>
              <PlusIcon />
              New repository
            </CreateRepositoryDialog>
          </div>

          {scanningRepos && repos.length === 0 ? (
            <p className="pt-12 text-center text-sm text-muted-foreground">Scanning {baseDirectory}…</p>
          ) : filteredRepos.length === 0 && !showGhosts ? (
            <p className="pt-12 text-center text-sm text-muted-foreground">{repos.length === 0 ? "No repositories found." : `No repositories match “${query}”.`}</p>
          ) : (
            <div className="mt-8 grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filteredRepos.map((repo) => (
                <RepoCard key={repo.path} {...repo} onOpen={selectRepository} />
              ))}
              {Array.from({ length: ghostCount }).map((_, i) => (
                <GhostRepoCard key={`ghost-${i}`} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

import { CaretRightIcon, FileCodeIcon, FolderIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { collectLanguageBreakdown, countFiles, languageColor } from "@/lib/structure/tree";
import { useRepositoryContext } from "@/hooks/repository/hook";
import type { reposcan } from "../../../../wailsjs/go/models";

function basename(path: string): string {
  return path.split("/").pop() || path;
}

function FileRow({ file, depth }: { file: reposcan.FileEntry; depth: number }) {
  const { openFile } = useRepositoryContext();

  return (
    <Button variant="ghost" onClick={openFile} title={file.Path} className="h-auto w-full justify-start gap-1.5 rounded-md py-1 pr-2 text-sm font-normal text-muted-foreground hover:bg-muted" style={{ paddingLeft: depth * 16 + 8 }}>
      <FileCodeIcon className="size-3.5 shrink-0" />
      <span className="truncate">{basename(file.Path)}</span>
    </Button>
  );
}

function FolderTreeRows({ node, depth }: { node: reposcan.FolderNode; depth: number }) {
  return (
    <>
      {node.Children.map((child) => (
        <details key={child.Path} className="[&[open]>summary>svg:first-child]:rotate-90">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md py-1 pr-2 text-sm text-foreground hover:bg-muted" style={{ paddingLeft: depth * 16 + 8 }}>
            <CaretRightIcon className="size-3 shrink-0 text-muted-foreground transition-transform" />
            <FolderIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{child.Name}</span>
            <span className="ml-auto shrink-0 text-xs text-muted-foreground">{countFiles(child)}</span>
          </summary>
          <FolderTreeRows node={child} depth={depth + 1} />
          {child.Files.map((file) => (
            <FileRow key={file.Path} file={file} depth={depth + 1} />
          ))}
        </details>
      ))}
    </>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StructurePanel() {
  const { repo } = useRepositoryContext();
  if (!repo) {
    console.error("No repository loaded");
    return;
  }

  const languageStats = collectLanguageBreakdown(repo);
  const tree = repo.Tree;
  const total = countFiles(tree) || 1;

  return (
    <ScrollArea className="h-full w-full">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Structure</h2>
          <p className="text-sm text-muted-foreground">How this codebase is organized, what kind of files make it up, and where they live.</p>
        </div>

        <section className="flex flex-col gap-3">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Files by language</span>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
            {languageStats.map(({ language, count }) => (
              <div key={language} style={{ width: `${(count / total) * 100}%`, backgroundColor: languageColor(language) }} title={`${language} · ${count}`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {languageStats.map(({ language, count, bytes }) => (
              <div key={language} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: languageColor(language) }} />
                <span className="text-foreground">{language || "Other"}</span>
                <span>
                  {count} · {formatBytes(bytes)} · {Math.round((count / total) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-1">
          <span className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">File tree</span>
          <p className="mb-1 text-xs text-muted-foreground">Click a file to open it in your configured editor (Settings → General → Code editor).</p>
          <FolderTreeRows node={tree} depth={0} />
          {tree.Files.map((file) => (
            <FileRow key={file.Path} file={file} depth={0} />
          ))}
        </section>
      </div>
    </ScrollArea>
  );
}

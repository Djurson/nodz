import { reposcan } from "../../../wailsjs/go/models";

type RepoLanguageStats = {
  count: number;
  bytes: number;
};

/** Total file count in a folder subtree, including nested children. */
export function countFiles(node: Pick<reposcan.FolderNode, "Children" | "Files">): number {
  return node.Files.length + node.Children.reduce((sum, child) => sum + countFiles(child), 0);
}

const LANGUAGE_COLOR_VARS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

/** Deterministic color per language, stable across renders/sessions since it hashes the name rather than assignment order. */
export function languageColor(language: string): string {
  let hash = 0;
  for (let i = 0; i < language.length; i++) hash = (hash * 31 + language.charCodeAt(i)) | 0;
  return LANGUAGE_COLOR_VARS[Math.abs(hash) % LANGUAGE_COLOR_VARS.length];
}

export function collectLanguageBreakdown(repo: Pick<reposcan.DetailedRepository, "Tree">) {
  const stats: Map<string, RepoLanguageStats> = new Map();

  function walkNode(node: Pick<reposcan.FolderNode, "Children" | "Files">) {
    for (const file of node.Files) {
      const entry = stats.get(file.Language) ?? { count: 0, bytes: 0 };
      entry.count += 1;
      entry.bytes += file.Size;
      stats.set(file.Language, entry);
    }

    for (const child of node.Children) {
      walkNode(child);
    }
  }

  walkNode(repo.Tree);

  return [...stats.entries()].map(([language, { count, bytes }]) => ({ language, count, bytes })).sort((a, b) => b.count - a.count);
}

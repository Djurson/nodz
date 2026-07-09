import type { DirTree } from "@/lib/repo-hierarchy";

const DIR_PALETTE_SIZE = 8;

/** Assigns each directory a stable accent color (cycling through `--dir-1..8` in
 * style.css) by tree-walk encounter order, used for both its compound-box tint and
 * the color of edges sourced from files inside it. */
export function assignDirColors(root: DirTree): Map<string, string> {
  const colors = new Map<string, string>();
  let i = 0;
  const walk = (dir: DirTree) => {
    if (dir.id !== "") {
      colors.set(dir.id, `var(--dir-${(i % DIR_PALETTE_SIZE) + 1})`);
      i++;
    }
    for (const child of dir.children) walk(child);
  };
  walk(root);
  return colors;
}

/** The directory id (matching `DirTree.id`) that a file's path belongs to. */
export function dirIdForPath(path: string): string {
  const segments = path.split("/");
  segments.pop();
  return segments.join("/");
}

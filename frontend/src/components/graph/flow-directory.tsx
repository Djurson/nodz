import { FolderIcon } from "@phosphor-icons/react";
import type { Node, NodeProps } from "@xyflow/react";

export interface DirectoryNodeData extends Record<string, unknown> {
  name: string;
  /** Accent color (`var(--dir-N)`) shared with edges sourced from files in this directory. */
  color: string;
}

export type DirectoryFlowNode = Node<DirectoryNodeData, "directory">;

export function FlowDirectoryNode({ data }: NodeProps<DirectoryFlowNode>) {
  return (
    <div
      className="h-full w-full rounded-lg border"
      style={{
        backgroundColor: `color-mix(in oklch, ${data.color} 13%, transparent)`,
        borderColor: `color-mix(in oklch, ${data.color} 45%, transparent)`,
      }}>
      <div className="flex items-center gap-1 px-2 py-1.5 font-mono text-[10px] font-medium tracking-wide uppercase" style={{ color: `color-mix(in oklch, ${data.color} 75%, var(--muted-foreground))` }}>
        <FolderIcon className="size-3" />
        {data.name}
      </div>
    </div>
  );
}

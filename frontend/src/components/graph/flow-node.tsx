import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { GROUP_COLOR_VAR } from "@/lib/repo-graph";
import type { RepoNode } from "@/types/repo-graph";

export interface FileNodeData extends Record<string, unknown> {
  node: RepoNode;
}

export type FileFlowNode = Node<FileNodeData, "file">;

export function FlowFileNode({ data, selected }: NodeProps<FileFlowNode>) {
  const { node } = data;
  return (
    <div
      title={`${node.path} · ${node.loc} loc`}
      className={cn(
        "flex h-full w-full items-center gap-1.5 rounded-md border bg-card px-2.5 font-mono text-[11px] font-semibold text-card-foreground shadow-sm transition-shadow",
        selected ? "border-primary shadow-[0_0_10px_-2px_var(--primary-glow)]" : "border-border",
      )}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: GROUP_COLOR_VAR[node.group] }} />
      <span className="truncate">{node.label}</span>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

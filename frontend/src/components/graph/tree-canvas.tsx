import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Background, ReactFlow, ReactFlowProvider, useReactFlow, type EdgeTypes, type NodeTypes } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { RepoEdge, RepoNode } from "@/types/repo-graph";
import type { GraphSettings } from "@/types/graph-settings";
import type { GraphCanvasHandle } from "@/components/graph/graph-canvas";
import { layoutRepoTree, type TreeLayout } from "@/lib/elk-tree-layout";
import { FlowFileNode, type FileNodeData } from "@/components/graph/flow-node";
import { FlowDirectoryNode } from "@/components/graph/flow-directory";
import { FlowOrthogonalEdge, type EdgeHighlight } from "@/components/graph/flow-edge";

interface TreeCanvasProps {
  nodes: RepoNode[];
  edges: RepoEdge[];
  selectedId: string | null;
  onSelectNode: (node: RepoNode | null) => void;
  settings: GraphSettings;
}

const NODE_TYPES: NodeTypes = { file: FlowFileNode, directory: FlowDirectoryNode };
const EDGE_TYPES: EdgeTypes = { orthogonal: FlowOrthogonalEdge };
const FIT_VIEW_OPTIONS = { duration: 300, padding: 0.15 };

export const TreeCanvas = forwardRef<GraphCanvasHandle, TreeCanvasProps>(function TreeCanvas(props, ref) {
  return (
    <ReactFlowProvider>
      <TreeCanvasInner {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

const TreeCanvasInner = forwardRef<GraphCanvasHandle, TreeCanvasProps>(function TreeCanvasInner({ nodes, edges, selectedId, onSelectNode, settings }, ref) {
  const { fitView } = useReactFlow();
  const [layout, setLayout] = useState<TreeLayout | null>(null);
  const [isLayingOut, setIsLayingOut] = useState(true);

  useImperativeHandle(ref, () => ({ fitView: () => fitView(FIT_VIEW_OPTIONS) }));

  useEffect(() => {
    let cancelled = false;
    setIsLayingOut(true);
    layoutRepoTree(nodes, edges).then((result) => {
      if (cancelled) return;
      setLayout(result);
      setIsLayingOut(false);
    });
    return () => {
      cancelled = true;
    };
  }, [nodes, edges]);

  useEffect(() => {
    if (layout) fitView(FIT_VIEW_OPTIONS);
  }, [layout, fitView]);

  const displayNodes = useMemo(() => {
    if (!layout) return [];
    return layout.nodes.map((n) => (n.type === "file" ? { ...n, selected: n.id === selectedId } : n));
  }, [layout, selectedId]);

  const displayEdges = useMemo(() => {
    if (!layout) return [];
    return layout.edges
      .filter((e) => settings.visibleEdgeKinds[e.data!.kind])
      .map((e) => {
        const highlight: EdgeHighlight = !selectedId ? null : e.source === selectedId ? "outgoing" : e.target === selectedId ? "incoming" : null;
        return { ...e, data: { ...e.data!, highlight } };
      });
  }, [layout, selectedId, settings.visibleEdgeKinds]);

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodeClick={(_, node) => (node.type === "file" ? onSelectNode((node.data as FileNodeData).node) : undefined)}
        onPaneClick={() => onSelectNode(null)}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesFocusable={false}
        elementsSelectable
        minZoom={0.2}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
        fitView>
        <Background gap={24} size={1} color="var(--canvas-dot)" />
      </ReactFlow>

      {isLayingOut && !layout && <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">Laying out repo tree…</div>}
    </div>
  );
});

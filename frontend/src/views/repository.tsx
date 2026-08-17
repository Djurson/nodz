import { useEffect, useMemo, useRef, useState } from "react";
import { TreeCanvas } from "@/components/graph/tree-canvas";
import { NodeDetailPanel } from "@/components/graph/node-detail-panel";
import { InsightsPanel } from "@/views/panels/repository/insights-panel";
import { StructurePanel } from "@/views/panels/repository/structure-panel";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { BottomToolbar, type ToolMode } from "@/components/layout/bottom-toolbar";
import { HistoryScrubber } from "@/components/layout/history-scrubber";
import { TopBar } from "@/components/layout/top-bar";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { mockRepoGraph } from "@/lib/mock/repo-graph";
import { findCircularPairs, sliceAtCommit } from "@/lib/repo-graph";
import { DEFAULT_GRAPH_SETTINGS } from "@/types/graph-settings";
import type { RepoNode } from "@/types/repo-graph";
import { GraphCanvas, GraphCanvasHandle } from "@/views/panels/repository/graph-panel";

export type RepositoryView = "visualize" | "history" | "insights" | "structure";
export type VisualizeMode = "node" | "tree";

export default function RepositoryLayout() {
  const [view, setView] = useState<RepositoryView>("visualize");
  const [visualizeMode, setVisualizeMode] = useState<VisualizeMode>("node");
  const [settingDialogOpen, setSettingsDialogOpen] = useState(false);
  const [graphSettings, setGraphSettings] = useState(DEFAULT_GRAPH_SETTINGS);
  const [commitIndex, setCommitIndex] = useState(mockRepoGraph.commits.length - 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tool, setTool] = useState<ToolMode>("pan");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const graphRef = useRef<GraphCanvasHandle>(null);

  const effectiveCommitIndex = view === "history" ? commitIndex : mockRepoGraph.commits.length - 1;
  const { nodes, edges } = useMemo(() => sliceAtCommit(mockRepoGraph, effectiveCommitIndex), [effectiveCommitIndex]);
  const nodesById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const circular = useMemo(() => findCircularPairs(edges), [edges]);
  const selectedNode: RepoNode | undefined = selectedId ? nodesById.get(selectedId) : undefined;

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setCommitIndex((i) => {
        const next = i + 1;
        if (next >= mockRepoGraph.commits.length) {
          setIsPlaying(false);
          return i;
        }
        return next;
      });
    }, 900);
    return () => clearInterval(id);
  }, [isPlaying]);

  useEffect(() => {
    if (selectedId && !nodesById.has(selectedId)) setSelectedId(null);
  }, [selectedId, nodesById]);

  useEffect(() => {
    if (view !== "history") setIsPlaying(false);
  }, [view]);

  return (
    <>
      <AppSidebar view={view} onViewChange={setView} onOpenSettings={() => setSettingsDialogOpen(true)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar nodeCount={nodes.length} edgeCount={edges.length} view={view} visualizeMode={visualizeMode} onVisualizeModeChange={setVisualizeMode} />

        <div className="relative min-h-0 flex-1">
          {view === "insights" ? (
            <InsightsPanel nodes={nodes} edges={edges} onSelectNode={(n) => setSelectedId(n.id)} />
          ) : view === "structure" ? (
            <StructurePanel />
          ) : visualizeMode === "tree" ? (
            <TreeCanvas ref={graphRef} nodes={nodes} edges={edges} selectedId={selectedId} onSelectNode={(n) => setSelectedId(n?.id ?? null)} settings={graphSettings} />
          ) : (
            <GraphCanvas ref={graphRef} nodes={nodes} edges={edges} selectedId={selectedId} onSelectNode={(n) => setSelectedId(n?.id ?? null)} settings={graphSettings} />
          )}

          {selectedNode && <NodeDetailPanel node={selectedNode} edges={edges} nodesById={nodesById} isCircular={circular.has(selectedNode.id)} onSelectNode={(n) => setSelectedId(n.id)} onClose={() => setSelectedId(null)} />}

          {view === "visualize" && <BottomToolbar tool={tool} onToolChange={setTool} onFitView={() => graphRef.current?.fitView()} />}
          {view === "history" && (
            <HistoryScrubber
              commits={mockRepoGraph.commits}
              commitIndex={commitIndex}
              onCommitIndexChange={(i) => {
                setIsPlaying(false);
                setCommitIndex(i);
              }}
              isPlaying={isPlaying}
              onTogglePlay={() => {
                setIsPlaying((p) => {
                  if (!p && commitIndex === mockRepoGraph.commits.length - 1) setCommitIndex(0);
                  return !p;
                });
              }}
            />
          )}
        </div>
      </div>

      <SettingsDialog open={settingDialogOpen} onOpenChange={setSettingsDialogOpen} settings={graphSettings} onSettingsChange={setGraphSettings} />
    </>
  );
}

import type { EdgeKind } from "@/types/repo-graph";

export type LabelSize = "sm" | "md" | "lg";

export interface GraphSettings {
  visibleEdgeKinds: Record<EdgeKind, boolean>;
  labelSize: LabelSize;
  /** 0 (compact) – 1 (spacious); maps to force-layout charge/link tuning. */
  spread: number;
}

export const DEFAULT_GRAPH_SETTINGS: GraphSettings = {
  visibleEdgeKinds: { import: true, call: true, class: true },
  labelSize: "md",
  spread: 0.5,
};

export const LABEL_SIZE_SCALE: Record<LabelSize, number> = {
  sm: 0.82,
  md: 1,
  lg: 1.22,
};

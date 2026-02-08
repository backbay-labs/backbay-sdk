/**
 * FlowDiagram3D Types
 *
 * Type definitions for the 3D workflow/pipeline visualization component.
 */

export type StageStatus = "pending" | "running" | "complete" | "failed" | "skipped";

export interface FlowStage {
  id: string;
  label: string;
  status: StageStatus;
  description?: string;
  duration?: string;
  progress?: number;
  icon?: string;
}

export interface FlowConnection {
  from: string;
  to: string;
  condition?: string;
  animated?: boolean;
}

export interface FlowDiagram3DProps {
  stages: FlowStage[];
  connections: FlowConnection[];
  layout?: "linear" | "branching" | "parallel";
  direction?: "horizontal" | "vertical";
  onStageClick?: (id: string) => void;
  activeStageId?: string | null;
}

export const STATUS_COLORS: Record<StageStatus, string> = {
  pending: "#475569",
  running: "#22D3EE",
  complete: "#10B981",
  failed: "#F43F5E",
  skipped: "#334155",
};

export const STATUS_LABELS: Record<StageStatus, string> = {
  pending: "PENDING",
  running: "RUNNING",
  complete: "COMPLETE",
  failed: "FAILED",
  skipped: "SKIPPED",
};

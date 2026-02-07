/**
 * SpatialWorkspace Types
 *
 * Types for the 3D spatial visualization of Backbay entities.
 */

import type * as THREE from "three";
import type {
  VisionTopology,
  VisionTopologyEdge,
  VisionTopologyNode,
} from "../../lib/vision-types";
import type {
  Job,
  JobStatus,
  Node,
  NodeType,
  NodeStatus,
  Receipt,
  ReceiptStatus,
  Dispute,
  DisputeStatus,
  TrustTier,
} from "@backbay/contract";

// Re-export entity types for convenience
export type {
  Job,
  JobStatus,
  Node,
  NodeType,
  NodeStatus,
  Receipt,
  ReceiptStatus,
  Dispute,
  DisputeStatus,
  TrustTier,
};

// -----------------------------------------------------------------------------
// Layout Types
// -----------------------------------------------------------------------------

export type WorkspaceLayout = "clustered" | "force-directed" | "orbital";

export interface WorkspaceLayoutOptions {
  /** Animate layout transitions */
  animate?: boolean;
  /** Animation duration in ms */
  animationDuration?: number;
  /** Force simulation strength */
  forceStrength?: number;
  /** Repulsion between nodes */
  repulsion?: number;
  /** Center gravity */
  gravity?: number;
}

// -----------------------------------------------------------------------------
// Visual Types
// -----------------------------------------------------------------------------

export interface EntityVisual {
  color: string;
  opacity: number;
  pulse: boolean;
  icon: string;
  shape?: "sphere" | "box" | "octahedron" | "icosahedron" | "torus" | "ring";
  size?: number;
  emissive?: string;
  emissiveIntensity?: number;
}

export interface EntityPosition {
  id: string;
  position: THREE.Vector3;
  velocity?: THREE.Vector3;
}

export interface TopologySlice {
  nodes: VisionTopologyNode[];
  edges?: VisionTopologyEdge[];
}

// -----------------------------------------------------------------------------
// Job Cluster Types
// -----------------------------------------------------------------------------

export interface JobClusterProps {
  jobs: Job[];
  selectedIds?: string[];
  hoveredId?: string | null;
  onJobClick?: (job: Job) => void;
  onJobHover?: (job: Job | null) => void;
  layout?: WorkspaceLayout;
  position?: [number, number, number];
  onTopologyChange?: (slice: TopologySlice) => void;
}

/** Visual mapping for job statuses */
export const JOB_VISUALS: Record<JobStatus, EntityVisual> = {
  queued: {
    color: "#00f0ff",
    opacity: 0.4,
    pulse: false,
    icon: "circle-dashed",
    shape: "sphere",
    size: 0.3,
  },
  running: {
    color: "#00f0ff",
    opacity: 1.0,
    pulse: true,
    icon: "loader",
    shape: "sphere",
    size: 0.4,
    emissive: "#00f0ff",
    emissiveIntensity: 0.3,
  },
  completed: {
    color: "#00ff88",
    opacity: 0.8,
    pulse: false,
    icon: "check",
    shape: "sphere",
    size: 0.35,
  },
  blocked: {
    color: "#ffaa00",
    opacity: 0.9,
    pulse: true,
    icon: "alert-triangle",
    shape: "sphere",
    size: 0.35,
    emissive: "#ffaa00",
    emissiveIntensity: 0.2,
  },
  quarantine: {
    color: "#ff0055",
    opacity: 1.0,
    pulse: true,
    icon: "shield-x",
    shape: "sphere",
    size: 0.35,
    emissive: "#ff0055",
    emissiveIntensity: 0.4,
  },
};

// -----------------------------------------------------------------------------
// Node Graph Types
// -----------------------------------------------------------------------------

export interface NodeGraphProps {
  nodes: Node[];
  selectedIds?: string[];
  hoveredId?: string | null;
  onNodeClick?: (node: Node) => void;
  onNodeHover?: (node: Node | null) => void;
  showConnections?: boolean;
  layout?: WorkspaceLayout;
  position?: [number, number, number];
  onTopologyChange?: (slice: TopologySlice) => void;
}

/** Visual mapping for node types */
export const NODE_VISUALS: Record<NodeType, EntityVisual> = {
  operator: {
    color: "#00f0ff",
    opacity: 1.0,
    pulse: false,
    icon: "cpu",
    shape: "octahedron",
    size: 0.4,
  },
  fab: {
    color: "#ff00aa",
    opacity: 1.0,
    pulse: false,
    icon: "box",
    shape: "box",
    size: 0.35,
  },
  verifier: {
    color: "#00ff88",
    opacity: 1.0,
    pulse: false,
    icon: "shield-check",
    shape: "icosahedron",
    size: 0.3,
  },
  relay: {
    color: "#ffaa00",
    opacity: 1.0,
    pulse: false,
    icon: "radio",
    shape: "torus",
    size: 0.25,
  },
};

/** Status-based opacity modifiers */
export const NODE_STATUS_MODIFIERS: Record<NodeStatus, { opacity: number; pulse: boolean }> = {
  online: { opacity: 1.0, pulse: false },
  degraded: { opacity: 0.7, pulse: true },
  offline: { opacity: 0.3, pulse: false },
};

// -----------------------------------------------------------------------------
// Receipt Orbit Types
// -----------------------------------------------------------------------------

export interface ReceiptOrbitProps {
  receipts: Receipt[];
  parentPosition: [number, number, number];
  orbitRadius?: number;
  selectedIds?: string[];
  hoveredId?: string | null;
  onReceiptClick?: (receipt: Receipt) => void;
  onReceiptHover?: (receipt: Receipt | null) => void;
  onTopologyChange?: (slice: TopologySlice) => void;
  origin?: [number, number, number];
}

/** Visual mapping for receipt statuses */
export const RECEIPT_VISUALS: Record<ReceiptStatus, EntityVisual> = {
  pending: {
    color: "#00f0ff",
    opacity: 0.3,
    pulse: false,
    icon: "clock",
    shape: "ring",
    size: 0.15,
  },
  passed: {
    color: "#00ff88",
    opacity: 1.0,
    pulse: false,
    icon: "check-circle",
    shape: "ring",
    size: 0.18,
    emissive: "#00ff88",
    emissiveIntensity: 0.2,
  },
  failed: {
    color: "#ff0055",
    opacity: 1.0,
    pulse: true,
    icon: "x-circle",
    shape: "ring",
    size: 0.18,
    emissive: "#ff0055",
    emissiveIntensity: 0.3,
  },
};

// -----------------------------------------------------------------------------
// Trust Rings Types
// -----------------------------------------------------------------------------

export interface TrustRingsProps {
  currentTier: TrustTier;
  position?: [number, number, number];
  showLabels?: boolean;
  interactive?: boolean;
  onTierClick?: (tier: TrustTier) => void;
}

/** Trust tier ring configuration */
export const TRUST_RING_CONFIG: Record<TrustTier, { radius: number; color: string; metalness: number; roughness: number }> = {
  bronze: { radius: 2.0, color: "#cd7f32", metalness: 0.6, roughness: 0.4 },
  silver: { radius: 3.5, color: "#c0c0c0", metalness: 0.8, roughness: 0.2 },
  gold: { radius: 5.0, color: "#ffd700", metalness: 0.9, roughness: 0.1 },
};

// -----------------------------------------------------------------------------
// Dispute Types
// -----------------------------------------------------------------------------

export interface DisputeBeaconProps {
  dispute: Dispute;
  parentPosition: [number, number, number];
  onDisputeClick?: (dispute: Dispute) => void;
}

/** Severity based on dispute age */
export type DisputeSeverity = "low" | "medium" | "high";

export function getDisputeSeverity(dispute: Dispute): DisputeSeverity {
  const ageMs = Date.now() - new Date(dispute.opened_at).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  if (ageHours < 24) return "low";
  if (ageHours < 72) return "medium";
  return "high";
}

/** Visual mapping for dispute severity */
export const DISPUTE_SEVERITY_VISUALS: Record<DisputeSeverity, { color: string; pulseSpeed: number; size: number }> = {
  low: { color: "#ffaa00", pulseSpeed: 1.0, size: 0.2 },
  medium: { color: "#ff5500", pulseSpeed: 1.5, size: 0.25 },
  high: { color: "#ff0055", pulseSpeed: 2.0, size: 0.3 },
};

// -----------------------------------------------------------------------------
// Workspace Container Types
// -----------------------------------------------------------------------------

export interface WorkspaceFilter {
  jobStatuses?: JobStatus[];
  nodeTypes?: NodeType[];
  nodeStatuses?: NodeStatus[];
  receiptStatuses?: ReceiptStatus[];
  trustTiers?: TrustTier[];
  disputeStatuses?: DisputeStatus[];
  showJobs?: boolean;
  showNodes?: boolean;
  showReceipts?: boolean;
  showDisputes?: boolean;
  showTrustRings?: boolean;
}

export interface WorkspaceSelection {
  type: "job" | "node" | "receipt" | "dispute";
  id: string;
}

export interface SpatialWorkspaceProps {
  // Data
  jobs?: Job[];
  nodes?: Node[];
  receipts?: Receipt[];
  disputes?: Dispute[];
  currentTrustTier?: TrustTier;

  // Selection
  selection?: WorkspaceSelection[];
  onSelectionChange?: (selection: WorkspaceSelection[]) => void;

  // Hover
  hovered?: WorkspaceSelection | null;
  onHoverChange?: (hovered: WorkspaceSelection | null) => void;

  // Filters
  filters?: WorkspaceFilter;

  // Layout
  layout?: WorkspaceLayout;
  layoutOptions?: WorkspaceLayoutOptions;

  // Camera
  autoRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;

  // Customization
  className?: string;
  style?: React.CSSProperties;

  // Vision topology
  topologyId?: string;
  topologyUpdateMs?: number;
  onTopologyChange?: (topology: VisionTopology) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

// -----------------------------------------------------------------------------
// Default Configuration
// -----------------------------------------------------------------------------

export const DEFAULT_WORKSPACE_CONFIG = {
  layout: "clustered" as WorkspaceLayout,
  autoRotate: true,
  enableZoom: true,
  enablePan: true,
  layoutOptions: {
    animate: true,
    animationDuration: 500,
    forceStrength: 0.5,
    repulsion: 100,
    gravity: 0.1,
  },
  filters: {
    showJobs: true,
    showNodes: true,
    showReceipts: true,
    showDisputes: true,
    showTrustRings: true,
  },
};

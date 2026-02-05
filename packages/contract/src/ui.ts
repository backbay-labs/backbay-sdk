/**
 * UI contracts for Backbay's agentic 3D visualization system.
 * Defines types for the ambient field, spatial workspace, and agent console.
 */

// ─────────────────────────────────────────────────────────────
// Ambient Field Types
// ─────────────────────────────────────────────────────────────

export type FieldStyle = "constellation" | "pcb" | "water";

export type FieldEventType =
  | "impulse"
  | "anchor_create"
  | "anchor_update"
  | "anchor_remove"
  | "tether"
  | "ripple";

export type FieldEventSource =
  | "job"
  | "receipt"
  | "node"
  | "market"
  | "dispute"
  | "trust";

export type FieldColor =
  | "cyan"
  | "magenta"
  | "emerald"
  | "amber"
  | "rose"
  | "gold"
  | "muted";

export interface FieldEvent {
  id: string;
  type: FieldEventType;
  source: FieldEventSource;
  entityId: string;
  /** UV coordinates (0-1) for positioning on the field plane */
  position?: { x: number; y: number };
  /** Intensity of the effect (0-1) */
  intensity: number;
  color: FieldColor;
  /** Duration in ms for transient effects */
  duration?: number;
  /** Additional metadata for complex effects */
  metadata?: Record<string, unknown>;
}

export interface FieldAnchor {
  id: string;
  entityId: string;
  source: FieldEventSource;
  position: { x: number; y: number };
  strength: number;
  color: FieldColor;
  createdAt: number;
}

export interface FieldTether {
  id: string;
  fromAnchorId: string;
  toAnchorId: string;
  strength: number;
  color: FieldColor;
}

export interface FieldConfig {
  style: FieldStyle;
  /** Particle density (0-1) */
  density: number;
  /** Response sensitivity to events (0-1) */
  reactivity: number;
  /** Device pixel ratio for canvas */
  dpr: number;
  /** Max impulses to track simultaneously */
  maxImpulses: number;
  /** Max anchors to display */
  maxAnchors: number;
  /** Impulse decay time in ms */
  impulseDecayMs: number;
}

// ─────────────────────────────────────────────────────────────
// Spatial Workspace Types
// ─────────────────────────────────────────────────────────────

export type WorkspaceLayout = "clustered" | "force-directed" | "hierarchical";

export type EntityType =
  | "job"
  | "receipt"
  | "node"
  | "offer"
  | "task"
  | "dispute";

export interface WorkspaceFilter {
  /** Filter by entity types */
  entityTypes?: EntityType[];
  /** Filter jobs by status */
  jobStatuses?: string[];
  /** Filter receipts by status */
  receiptStatuses?: string[];
  /** Filter nodes by type */
  nodeTypes?: string[];
  /** Filter by trust tier */
  trustTiers?: string[];
  /** Filter by time range */
  timeRange?: {
    start: string;
    end: string;
  };
  /** Search query */
  query?: string;
}

export interface WorkspaceSelection {
  entityType: EntityType;
  entityId: string;
}

export interface WorkspaceCamera {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  zoom: number;
}

// ─────────────────────────────────────────────────────────────
// Agent Console Types
// ─────────────────────────────────────────────────────────────

export type ConsoleMode = "ambient" | "quick" | "full" | "focused";

export type AgentState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

export type AgentMood = "neutral" | "positive" | "concerned" | "alert";

export interface ConstellationNode {
  id: string;
  label: string;
  icon: string;
  color: FieldColor;
  /** Relevance score affects size/brightness (0-1) */
  relevance: number;
  /** Action to trigger on click */
  action?: string;
  /** Additional data for the action */
  actionData?: Record<string, unknown>;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  /** Keyboard shortcut */
  shortcut?: string;
  /** Action identifier */
  action: string;
  /** Required context for this action to be available */
  requiredContext?: {
    entityTypes?: EntityType[];
    minSelection?: number;
    maxSelection?: number;
  };
}

// ─────────────────────────────────────────────────────────────
// Entity Visual Mappings
// ─────────────────────────────────────────────────────────────

export interface EntityVisual {
  color: FieldColor;
  opacity: number;
  pulse: boolean;
  icon: string;
  shape?: "sphere" | "box" | "octahedron" | "icosahedron" | "torus";
  size?: number;
}

/** Job status to visual mapping */
export const JOB_STATUS_VISUALS: Record<string, EntityVisual> = {
  queued: {
    color: "cyan",
    opacity: 0.4,
    pulse: false,
    icon: "circle-dashed",
  },
  running: { color: "cyan", opacity: 1.0, pulse: true, icon: "loader" },
  completed: { color: "emerald", opacity: 0.8, pulse: false, icon: "check" },
  blocked: {
    color: "amber",
    opacity: 0.9,
    pulse: true,
    icon: "alert-triangle",
  },
  quarantine: { color: "rose", opacity: 1.0, pulse: true, icon: "shield-x" },
};

/** Receipt status to visual mapping */
export const RECEIPT_STATUS_VISUALS: Record<string, EntityVisual> = {
  pending: { color: "cyan", opacity: 0.3, pulse: false, icon: "clock" },
  passed: {
    color: "emerald",
    opacity: 1.0,
    pulse: false,
    icon: "check-circle",
  },
  failed: { color: "rose", opacity: 1.0, pulse: true, icon: "x-circle" },
};

/** Node type to visual mapping */
export const NODE_TYPE_VISUALS: Record<string, EntityVisual> = {
  operator: {
    color: "cyan",
    opacity: 1.0,
    pulse: false,
    icon: "cpu",
    shape: "octahedron",
    size: 0.4,
  },
  fab: {
    color: "magenta",
    opacity: 1.0,
    pulse: false,
    icon: "box",
    shape: "box",
    size: 0.35,
  },
  verifier: {
    color: "emerald",
    opacity: 1.0,
    pulse: false,
    icon: "shield-check",
    shape: "icosahedron",
    size: 0.3,
  },
  relay: {
    color: "amber",
    opacity: 1.0,
    pulse: false,
    icon: "radio",
    shape: "torus",
    size: 0.25,
  },
};

/** Trust tier to material properties */
export const TRUST_TIER_MATERIALS: Record<
  string,
  { color: string; metalness: number; roughness: number }
> = {
  bronze: { color: "#cd7f32", metalness: 0.6, roughness: 0.4 },
  silver: { color: "#c0c0c0", metalness: 0.8, roughness: 0.2 },
  gold: { color: "#ffd700", metalness: 0.9, roughness: 0.1 },
};

// ─────────────────────────────────────────────────────────────
// Color Palette
// ─────────────────────────────────────────────────────────────

export const BACKBAY_COLORS: Record<FieldColor, string> = {
  cyan: "#00f0ff",
  emerald: "#00ff88",
  amber: "#ffaa00",
  rose: "#ff0055",
  magenta: "#ff00aa",
  gold: "#ffd700",
  muted: "#666666",
};

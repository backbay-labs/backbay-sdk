/**
 * Nexus Adapter
 *
 * Maps NexusItem entities to CrystallineOrganism props for hierarchical
 * workspace visualization. Enables NexusNodes to be rendered as
 * emotion-driven organisms with consistent visual language.
 */

import * as THREE from "three";
import type {
  CrystallineOrganismProps,
  OrganismType,
  OrganismState,
  OrganismPower,
} from "../CrystallineOrganism";
import type { EntityAdapter } from "./adapters";

// -----------------------------------------------------------------------------
// Nexus Types (mirrored from NexusNode.tsx for decoupling)
// -----------------------------------------------------------------------------

export type NexusItemType =
  | "terminal"
  | "browser-tab"
  | "agent-task"
  | "industry"
  | "workcell"
  | "trade"
  | "cluster"
  | "index"
  | "app-window";

export type NexusItemStatus =
  | "idle"
  | "active"
  | "running"
  | "error"
  | "complete"
  | "pending";

export interface NexusItem {
  id: string;
  type: NexusItemType;
  label: string;
  status: NexusItemStatus;
  activityLevel: number; // 0-1 normalized
  /** 3D position in scene (used by NexusOrganismNode) */
  position: THREE.Vector3;
  metadata?: {
    favicon?: string;
    workcellId?: string;
    taskId?: string;
    tradeId?: string;
    industryCode?: string;
    /** Jobs associated with this item (for workspace drill-down) */
    jobIds?: string[];
    /** Nodes associated with this item */
    nodeIds?: string[];
    /** Receipt count for status rings */
    receiptCounts?: {
      passed: number;
      failed: number;
      pending: number;
    };
  };
}

// -----------------------------------------------------------------------------
// Type Mappings
// -----------------------------------------------------------------------------

/**
 * Maps NexusItemType to OrganismType geometry.
 *
 * Semantic mapping:
 * - terminal → kernel (octahedron): Central command/control
 * - browser-tab → relay (torus): Connection/communication point
 * - agent-task → agent (icosahedron): AI/autonomous process
 * - industry → workcell (dodecahedron): Industry sector
 * - workcell → workcell (dodecahedron): Cyntra sandbox
 * - trade → task (tetrahedron): Action/transaction
 * - cluster → kernel (octahedron): Group container
 * - index → relay (torus): Reference/lookup point
 * - app-window → agent (icosahedron): Application instance
 */
const NEXUS_TYPE_TO_ORGANISM: Record<NexusItemType, OrganismType> = {
  terminal: "kernel",
  "browser-tab": "relay",
  "agent-task": "agent",
  industry: "workcell",
  workcell: "workcell",
  trade: "task",
  cluster: "kernel",
  index: "relay",
  "app-window": "agent",
};

/**
 * Maps NexusItemStatus to OrganismState for emotion-driven visualization.
 */
const NEXUS_STATUS_TO_STATE: Record<NexusItemStatus, OrganismState> = {
  idle: "idle",
  active: "busy",
  running: "busy",
  error: "error",
  complete: "success",
  pending: "listening",
};

// -----------------------------------------------------------------------------
// Nexus Adapter
// -----------------------------------------------------------------------------

export const nexusAdapter: EntityAdapter<NexusItem> = {
  toOrganism(item: NexusItem): CrystallineOrganismProps {
    return {
      id: item.id,
      type: this.getType(item),
      label: item.label,
      state: this.getState(item),
      power: this.getPower(item),
    };
  },

  getState(item: NexusItem): OrganismState {
    return NEXUS_STATUS_TO_STATE[item.status] ?? "idle";
  },

  getType(item: NexusItem): OrganismType {
    return NEXUS_TYPE_TO_ORGANISM[item.type] ?? "agent";
  },

  getPower(item: NexusItem): OrganismPower {
    // High activity → elevated power for more intense glow
    if (item.activityLevel > 0.7) return "elevated";

    // Error and running states demand attention
    if (item.status === "error") return "elevated";
    if (item.status === "running") return "elevated";

    // Clusters and terminals are important → standard+
    if (item.type === "cluster" || item.type === "terminal") {
      return item.activityLevel > 0.3 ? "elevated" : "standard";
    }

    return "standard";
  },
};

// -----------------------------------------------------------------------------
// Batch Conversion Helpers
// -----------------------------------------------------------------------------

/**
 * Convert array of NexusItems to CrystallineOrganismProps.
 */
export function nexusItemsToOrganisms(
  items: NexusItem[]
): CrystallineOrganismProps[] {
  return items.map((item) => nexusAdapter.toOrganism(item));
}

/**
 * Get organism scale factor based on NexusItem activity level.
 * Matches the existing NexusNode scaling behavior.
 */
export function getNexusOrganismScale(item: NexusItem): number {
  // Scale based on activity level: 0.8 to 1.2
  return 0.8 + item.activityLevel * 0.4;
}

/**
 * Check if a NexusItem can be sprawled into (has detail workspace).
 */
export function canSprawlInto(item: NexusItem): boolean {
  return (
    item.type === "cluster" ||
    item.type === "workcell" ||
    item.type === "industry" ||
    item.type === "terminal"
  );
}

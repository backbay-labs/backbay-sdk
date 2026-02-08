import type * as THREE from "three";

// -----------------------------------------------------------------------------
// Action Types
// -----------------------------------------------------------------------------

export type ActionKind = "fs" | "network" | "exec" | "codepatch" | "query" | "message";
export type PolicyStatus = "allowed" | "denied" | "exception" | "uncovered" | "approval-required";

export interface RiverAction {
  id: string;
  kind: ActionKind;
  label: string;
  agentId: string;
  timestamp: number;
  duration?: number;
  policyStatus: PolicyStatus;
  riskScore: number;
  noveltyScore: number;
  blastRadius: number;
  consequence?: string;
  signalIds?: string[];
  predecessors?: string[];
  successors?: string[];
}

// -----------------------------------------------------------------------------
// Policy Types
// -----------------------------------------------------------------------------

export interface PolicySegment {
  id: string;
  label: string;
  startT: number;
  endT: number;
  side: "left" | "right" | "both";
  type: "hard-deny" | "soft" | "record-only";
  coverageGap?: boolean;
}

// -----------------------------------------------------------------------------
// Causal Types
// -----------------------------------------------------------------------------

export type CausalLinkType = "direct" | "indirect" | "temporal";

export interface CausalLink {
  fromId: string;
  toId: string;
  strength: number;
  type?: CausalLinkType;
}

// -----------------------------------------------------------------------------
// Color Maps
// -----------------------------------------------------------------------------

export const ACTION_KIND_COLORS: Record<ActionKind, string> = {
  fs: "#22D3EE",
  network: "#8B5CF6",
  exec: "#F59E0B",
  codepatch: "#10B981",
  query: "#F43F5E",
  message: "#CBD5E1",
};

export const POLICY_STATUS_COLORS: Record<PolicyStatus, string> = {
  allowed: "#10B981",
  denied: "#EF4444",
  exception: "#F59E0B",
  uncovered: "transparent",
  "approval-required": "#8B5CF6",
};

export const POLICY_SEGMENT_COLORS: Record<PolicySegment["type"], string> = {
  "hard-deny": "#ff0055",
  soft: "#F59E0B",
  "record-only": "#00f0ff",
};

// -----------------------------------------------------------------------------
// Component Props
// -----------------------------------------------------------------------------

export interface ActionNodeProps {
  action: RiverAction;
  position: [number, number, number];
  selected: boolean;
  dimmed: boolean;
  onClick?: (action: RiverAction) => void;
  onHover?: (action: RiverAction | null) => void;
}

export interface PolicyRailProps {
  segments: PolicySegment[];
  curve: THREE.CatmullRomCurve3;
  riverWidth: number;
}

export interface CausalThreadProps {
  links: CausalLink[];
  actionPositions: Map<string, THREE.Vector3>;
  selectedActionId: string | null;
}

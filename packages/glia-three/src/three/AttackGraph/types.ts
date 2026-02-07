/**
 * AttackGraph Types
 *
 * Type definitions for MITRE ATT&CK attack graph visualization.
 */

export type AttackTactic =
  | "reconnaissance"
  | "resource-development"
  | "initial-access"
  | "execution"
  | "persistence"
  | "privilege-escalation"
  | "defense-evasion"
  | "credential-access"
  | "discovery"
  | "lateral-movement"
  | "collection"
  | "command-and-control"
  | "exfiltration"
  | "impact";

export interface AttackTechnique {
  id: string;
  name: string;
  tactic: AttackTactic;
  detected: boolean;
  confidence: number;
  timestamp?: Date;
  evidence?: string[];
}

export interface AttackChain {
  id: string;
  name: string;
  techniques: AttackTechnique[];
  actor?: string;
  campaign?: string;
  status: "active" | "contained" | "remediated";
}

export interface AttackGraphProps {
  chains: AttackChain[];
  layout?: "killchain" | "matrix" | "timeline";
  selectedTechnique?: string;
  onTechniqueClick?: (technique: AttackTechnique) => void;
  showMitreIds?: boolean;
  highlightDetected?: boolean;
  animateProgression?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const ATTACK_TACTIC_ORDER: AttackTactic[] = [
  "reconnaissance",
  "resource-development",
  "initial-access",
  "execution",
  "persistence",
  "privilege-escalation",
  "defense-evasion",
  "credential-access",
  "discovery",
  "lateral-movement",
  "collection",
  "command-and-control",
  "exfiltration",
  "impact",
];

export const ATTACK_TACTIC_LABELS: Record<AttackTactic, string> = {
  reconnaissance: "Recon",
  "resource-development": "Resource Dev",
  "initial-access": "Initial Access",
  execution: "Execution",
  persistence: "Persistence",
  "privilege-escalation": "Priv Esc",
  "defense-evasion": "Defense Evasion",
  "credential-access": "Credential Access",
  discovery: "Discovery",
  "lateral-movement": "Lateral Movement",
  collection: "Collection",
  "command-and-control": "C2",
  exfiltration: "Exfiltration",
  impact: "Impact",
};

export const ATTACK_CHAIN_STATUS_COLORS: Record<AttackChain["status"], string> = {
  active: "#ff4455",
  contained: "#ffb84d",
  remediated: "#22ff88",
};

export const ATTACK_DETECTION_COLORS = {
  detected: "#22ff88",
  undetected: "#ffb347",
};

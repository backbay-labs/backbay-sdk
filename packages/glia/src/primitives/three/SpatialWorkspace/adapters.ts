/**
 * Entity Adapters
 *
 * Maps Backbay contract entities (Job, Node, Receipt, Dispute) to CrystallineOrganism props.
 * This adapter layer enables the SpatialWorkspace to use the unified emotion-driven
 * visualization system from CrystallineOrganism.
 */

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
import type {
  CrystallineOrganismProps,
  OrganismType,
  OrganismState,
  OrganismPower,
} from "../CrystallineOrganism";

// -----------------------------------------------------------------------------
// Adapter Interface
// -----------------------------------------------------------------------------

export interface EntityAdapter<T> {
  toOrganism(entity: T): CrystallineOrganismProps;
  getState(entity: T): OrganismState;
  getType(entity: T): OrganismType;
  getPower(entity: T): OrganismPower;
}

// -----------------------------------------------------------------------------
// Job Adapter
// -----------------------------------------------------------------------------

const JOB_STATUS_TO_STATE: Record<JobStatus, OrganismState> = {
  queued: "idle",
  running: "busy",
  completed: "success",
  blocked: "thinking",
  quarantine: "error",
};

export const jobAdapter: EntityAdapter<Job> = {
  toOrganism(job: Job): CrystallineOrganismProps {
    return {
      id: job.id,
      type: this.getType(job),
      label: job.type || job.id.slice(0, 8),
      state: this.getState(job),
      power: this.getPower(job),
    };
  },

  getState(job: Job): OrganismState {
    return JOB_STATUS_TO_STATE[job.status] ?? "idle";
  },

  getType(_job: Job): OrganismType {
    return "task"; // Jobs are always tetrahedrons
  },

  getPower(job: Job): OrganismPower {
    if (job.status === "running") return "elevated";
    if (job.status === "quarantine") return "elevated";
    return "standard";
  },
};

// -----------------------------------------------------------------------------
// Node Adapter
// -----------------------------------------------------------------------------

const NODE_TYPE_TO_ORGANISM: Record<NodeType, OrganismType> = {
  operator: "kernel",
  fab: "workcell",
  verifier: "agent",
  relay: "relay",
};

const NODE_STATUS_TO_STATE: Record<NodeStatus, OrganismState> = {
  online: "idle",
  degraded: "thinking",
  offline: "sleep",
};

const TRUST_TIER_TO_POWER: Record<TrustTier, OrganismPower> = {
  bronze: "standard",
  silver: "elevated",
  gold: "intense",
};

export const nodeAdapter: EntityAdapter<Node> = {
  toOrganism(node: Node): CrystallineOrganismProps {
    return {
      id: node.id,
      type: this.getType(node),
      label: node.id.slice(0, 8),
      state: this.getState(node),
      power: this.getPower(node),
    };
  },

  getState(node: Node): OrganismState {
    return NODE_STATUS_TO_STATE[node.status] ?? "idle";
  },

  getType(node: Node): OrganismType {
    return NODE_TYPE_TO_ORGANISM[node.type] ?? "agent";
  },

  getPower(node: Node): OrganismPower {
    return TRUST_TIER_TO_POWER[node.trust_tier] ?? "standard";
  },
};

// -----------------------------------------------------------------------------
// Receipt Adapter
// -----------------------------------------------------------------------------

const RECEIPT_STATUS_TO_STATE: Record<ReceiptStatus, OrganismState> = {
  pending: "listening",
  passed: "success",
  failed: "error",
};

export const receiptAdapter: EntityAdapter<Receipt> = {
  toOrganism(receipt: Receipt): CrystallineOrganismProps {
    return {
      id: receipt.id,
      type: this.getType(receipt),
      label: receipt.id.slice(0, 6),
      state: this.getState(receipt),
      power: this.getPower(receipt),
    };
  },

  getState(receipt: Receipt): OrganismState {
    return RECEIPT_STATUS_TO_STATE[receipt.status] ?? "idle";
  },

  getType(_receipt: Receipt): OrganismType {
    // Receipts are micro-tasks - use minimal task geometry
    return "task";
  },

  getPower(receipt: Receipt): OrganismPower {
    // Receipts are small - always minimal
    return "minimal";
  },
};

// -----------------------------------------------------------------------------
// Dispute Adapter
// -----------------------------------------------------------------------------

export const disputeAdapter: EntityAdapter<Dispute> = {
  toOrganism(dispute: Dispute): CrystallineOrganismProps {
    return {
      id: dispute.id,
      type: this.getType(dispute),
      label: `Dispute ${dispute.id.slice(0, 6)}`,
      state: this.getState(dispute),
      power: this.getPower(dispute),
    };
  },

  getState(dispute: Dispute): OrganismState {
    // Map dispute status to organism state
    const statusMap: Record<DisputeStatus, OrganismState> = {
      pending: "error",     // Pending disputes need attention
      resolved: "success",  // Resolved disputes are complete
      rejected: "idle",     // Rejected disputes are dismissed
    };
    return statusMap[dispute.status] ?? "error";
  },

  getType(_dispute: Dispute): OrganismType {
    // Disputes are task-like items that need resolution
    return "task";
  },

  getPower(dispute: Dispute): OrganismPower {
    // Calculate severity based on age
    const ageMs = Date.now() - new Date(dispute.opened_at).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    if (ageHours >= 72) return "intense";
    if (ageHours >= 24) return "elevated";
    return "standard";
  },
};

// -----------------------------------------------------------------------------
// Batch Conversion Helpers
// -----------------------------------------------------------------------------

export function jobsToOrganisms(jobs: Job[]): CrystallineOrganismProps[] {
  return jobs.map((job) => jobAdapter.toOrganism(job));
}

export function nodesToOrganisms(nodes: Node[]): CrystallineOrganismProps[] {
  return nodes.map((node) => nodeAdapter.toOrganism(node));
}

export function receiptsToOrganisms(receipts: Receipt[]): CrystallineOrganismProps[] {
  return receipts.map((receipt) => receiptAdapter.toOrganism(receipt));
}

export function disputesToOrganisms(disputes: Dispute[]): CrystallineOrganismProps[] {
  return disputes.map((dispute) => disputeAdapter.toOrganism(dispute));
}

// -----------------------------------------------------------------------------
// Cyntra Kernel Types (for Phase 6)
// -----------------------------------------------------------------------------

export interface CyntraKernelStatus {
  workcells: CyntraWorkcellStatus[];
  pending_issues: number;
  active_runs: number;
}

export interface CyntraWorkcellStatus {
  id: string;
  branch: string;
  toolchain: string;
  state: "idle" | "running" | "blocked";
  current_run?: string;
}

export interface CyntraRunStatus {
  id: string;
  issue_id: string;
  state: "queued" | "running" | "verifying" | "completed" | "failed";
  toolchain: string;
  started_at?: string;
  completed_at?: string;
}

export interface CyntraIssueStatus {
  id: string;
  title: string;
  state: "open" | "in_progress" | "resolved" | "wontfix";
  labels: string[];
}

// -----------------------------------------------------------------------------
// Cyntra Entity Adapters
// -----------------------------------------------------------------------------

const WORKCELL_STATE_TO_ORGANISM: Record<CyntraWorkcellStatus["state"], OrganismState> = {
  idle: "idle",
  running: "busy",
  blocked: "error",
};

export const cyntraWorkcellAdapter: EntityAdapter<CyntraWorkcellStatus> = {
  toOrganism(wc: CyntraWorkcellStatus): CrystallineOrganismProps {
    return {
      id: wc.id,
      type: this.getType(wc),
      label: wc.branch.split("/").pop() || wc.id.slice(0, 8),
      state: this.getState(wc),
      power: this.getPower(wc),
    };
  },
  getState(wc: CyntraWorkcellStatus): OrganismState {
    return WORKCELL_STATE_TO_ORGANISM[wc.state] ?? "idle";
  },
  getType(_wc: CyntraWorkcellStatus): OrganismType {
    return "workcell";
  },
  getPower(wc: CyntraWorkcellStatus): OrganismPower {
    return wc.current_run ? "elevated" : "standard";
  },
};

const RUN_STATE_TO_ORGANISM: Record<CyntraRunStatus["state"], OrganismState> = {
  queued: "idle",
  running: "busy",
  verifying: "thinking",
  completed: "success",
  failed: "error",
};

export const cyntraRunAdapter: EntityAdapter<CyntraRunStatus> = {
  toOrganism(run: CyntraRunStatus): CrystallineOrganismProps {
    return {
      id: run.id,
      type: this.getType(run),
      label: run.issue_id.slice(0, 8),
      state: this.getState(run),
      power: this.getPower(run),
    };
  },
  getState(run: CyntraRunStatus): OrganismState {
    return RUN_STATE_TO_ORGANISM[run.state] ?? "idle";
  },
  getType(_run: CyntraRunStatus): OrganismType {
    return "agent";
  },
  getPower(run: CyntraRunStatus): OrganismPower {
    return run.state === "running" ? "elevated" : "standard";
  },
};

const ISSUE_STATE_TO_ORGANISM: Record<CyntraIssueStatus["state"], OrganismState> = {
  open: "idle",
  in_progress: "busy",
  resolved: "success",
  wontfix: "sleep",
};

export const cyntraIssueAdapter: EntityAdapter<CyntraIssueStatus> = {
  toOrganism(issue: CyntraIssueStatus): CrystallineOrganismProps {
    return {
      id: issue.id,
      type: this.getType(issue),
      label: issue.title.slice(0, 20),
      state: this.getState(issue),
      power: this.getPower(issue),
    };
  },
  getState(issue: CyntraIssueStatus): OrganismState {
    return ISSUE_STATE_TO_ORGANISM[issue.state] ?? "idle";
  },
  getType(_issue: CyntraIssueStatus): OrganismType {
    return "task";
  },
  getPower(issue: CyntraIssueStatus): OrganismPower {
    return issue.state === "in_progress" ? "elevated" : "standard";
  },
};

// Batch converters
export function workcellsToOrganisms(workcells: CyntraWorkcellStatus[]): CrystallineOrganismProps[] {
  return workcells.map((wc) => cyntraWorkcellAdapter.toOrganism(wc));
}

export function runsToOrganisms(runs: CyntraRunStatus[]): CrystallineOrganismProps[] {
  return runs.map((run) => cyntraRunAdapter.toOrganism(run));
}

export function issuesToOrganisms(issues: CyntraIssueStatus[]): CrystallineOrganismProps[] {
  return issues.map((issue) => cyntraIssueAdapter.toOrganism(issue));
}

// Core Entity Types for Backbay Apps (v0)

export type TrustTier = "bronze" | "silver" | "gold";
export type NodeStatus = "online" | "offline" | "degraded";
export type JobStatus = "queued" | "running" | "completed" | "blocked" | "quarantine";
export type ReceiptStatus = "pending" | "passed" | "failed";
export type ListingPriceType = "fixed" | "auction" | "negotiated";
export type ListingStatus = "active" | "sold" | "cancelled";
export type LeaseStatus = "available" | "leased";
export type VenueStatus = "active" | "paused";
export type RealmStatus = "active" | "building" | "archived";
export type ContractStatus = "open" | "claimed" | "active" | "completed";
export type DisputeStatus = "pending" | "resolved" | "rejected";

// PORTFOLIO
export type PositionAssetType = "asset" | "lease" | "index" | "node";

export interface Position {
  id: string;
  asset_type: PositionAssetType;
  asset_id: string;
  asset_name: string;
  quantity: number;
  value: number;
  pnl_percent: number;
  pnl_absolute: number;
}

export interface ExposureBreakdown {
  label: string;
  percent: number;
}

export interface PortfolioSummary {
  total_value: number;
  net_pnl_absolute: number;
  net_pnl_percent: number;
  alpha: number;
  efficiency: number;
}

// VAULT
export interface PendingWithdrawal {
  id: string;
  amount: number;
  requested_at: string;
  available_at: string;
}

export interface VaultState {
  collateral_deposited: number;
  collateral_locked: number;
  collateral_available: number;
  credits_balance: number;
  burn_rate: number;
  trust_tier: TrustTier;
  max_exposure: number;
  current_exposure: number;
  max_parallel_jobs: number;
  active_jobs: number;
  slashing_at_risk: number;
  policy_violations: number;
  disputes_pending: number;
  pending_withdrawals: PendingWithdrawal[];
}

export interface TierUpgradeRequirement {
  label: string;
  current: number;
  required: number;
  met: boolean;
}

// NODES
export type NodeType = "operator" | "fab" | "verifier" | "relay";

export interface NodeOffer {
  id: string;
  resource_type: string;
  rate: number;
  rate_unit: string;
  min_term: string;
  max_term: string;
}

export interface Node {
  id: string;
  type: NodeType;
  trust_tier: TrustTier;
  status: NodeStatus;
  uptime_percent: number;
  joined_at: string;
  runs_completed: number;
  capabilities: string[];
  policies: string[];
  offers: NodeOffer[];
}

// PLAY
export interface Realm {
  id: string;
  name: string;
  status: RealmStatus;
  population: number;
  treasury: number;
  active_contracts: number;
}

export type ContractType = "asset" | "compute" | "service";

export interface Contract {
  id: string;
  realm_id: string;
  title: string;
  type: ContractType;
  reward: number;
  reward_unit: string;
  status: ContractStatus;
  due_date?: string;
}

export interface Mission {
  id: string;
  realm_id: string;
  type: string;
  description: string;
  budget: number;
  deadline_days: number;
  quality_tier: TrustTier;
}

// OPS
export type JobType = "render" | "verify" | "anchor" | "export" | "generate";
export type StepStatus = "pending" | "running" | "completed" | "failed";

export interface JobStep {
  index: number;
  name: string;
  status: StepStatus;
  duration_ms?: number;
}

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  node_id?: string;
  cost_estimate: number;
  priority: "low" | "normal" | "high";
  created_at: string;
  steps: JobStep[];
  gate_status?: "pass" | "fail" | "pending";
  receipt_id?: string;
  kernel_issue_id?: string;
  kernel_run_id?: string;
  kernel_stream_url?: string;
  kernel_ws_url?: string;
  logs: string[];
}

export interface OpsStats {
  throughput_per_day: number;
  cost_24h: number;
  pass_rate: number;
  queue_count: number;
  running_count: number;
}

// VERIFY
export interface PolicyVerification {
  policy_id: string;
  verified: boolean;
}

export interface GateOutcome {
  gate_name: string;
  result: "pass" | "fail";
  score?: number | string;
  threshold?: number | string;
}

export type AnchorProvider = "ipfs" | "arweave";

export interface Anchor {
  provider: AnchorProvider;
  uri: string;
  anchored_at: string;
}

export interface ReceiptHashes {
  input: string;
  output: string;
  proof: string;
}

export interface Receipt {
  id: string;
  job_id: string;
  node_id: string;
  status: ReceiptStatus;
  created_at: string;
  hashes: ReceiptHashes;
  policies: PolicyVerification[];
  gates: GateOutcome[];
  anchors: Anchor[];
}

export interface Dispute {
  id: string;
  receipt_id: string;
  status: DisputeStatus;
  opened_at: string;
  reason: string;
}

// EXCHANGE
export interface Listing {
  id: string;
  asset_id: string;
  asset_name: string;
  price: number;
  price_type: ListingPriceType;
  trust_tier: TrustTier;
  verified: boolean;
  status: ListingStatus;
}

export interface LeaseOffer {
  id: string;
  resource_type: string;
  rate: number;
  rate_unit: string;
  min_term: string;
  max_term: string;
  status: LeaseStatus;
}

export interface Venue {
  id: string;
  name: string;
  status: VenueStatus;
  listings_count: number;
  volume_24h: number;
  fee_rate: number;
  allowed_tiers: string[];
}

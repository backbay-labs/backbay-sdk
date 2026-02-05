// Aegis Marketplace semantics (app-plane API)

export type OfferType = "builder" | "verifier" | "responder";
export type PriceModel = "fixed" | "per_minute" | "per_artifact";
export type OfferStatus = "active" | "paused" | "retired";

export type TaskStatus = "open" | "claimed" | "running" | "completed" | "verified" | "settled";

export type AttestationVerdict = "approve" | "reject";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentCategory =
  | "data_exfil"
  | "policy_violation"
  | "malicious_patch"
  | "supply_chain_compromise"
  | "jailbreak_attempt";
export type IncidentStatus = "reported" | "triaged" | "verified" | "resolved" | "paid";
export type IncidentVerdict = "confirm" | "reject";

export interface OfferCreateRequest {
  offer_type: OfferType;
  capabilities_hash?: string;
  price_model: PriceModel;
  price: number;
  min_stake?: number;
  sla_latency_seconds: number;
  max_runtime_seconds?: number;
  policy_hashes_allowed?: string[];
}

export interface Offer extends OfferCreateRequest {
  offer_id: string;
  owner: string;
  status?: OfferStatus;
  created_at?: string;
  updated_at?: string;
}

export interface TaskCreateRequest {
  offer_id: string;
  manifest_hash: string;
  policy_hash: string;
  bundle_requirements_hash?: string;
  deadline_ts: number;
  escrow_amount: number;
  verifier_quorum?: number;
}

export interface TaskClaimRequest {
  claimer: string;
  signature?: string;
}

export interface TaskCompleteRequest {
  receipt_hash: string;
  bundle_uri?: string;
}

export interface Task extends TaskCreateRequest {
  task_id: string;
  requester: string;
  status?: TaskStatus;
  receipt_hash?: string;
  bundle_uri?: string;
  claimer?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttestationRequest {
  verdict: AttestationVerdict;
  signature: string;
  proof_pointer?: string;
}

export interface Attestation {
  receipt_id: string;
  verifier: string;
  verdict: AttestationVerdict;
  proof_pointer?: string;
  timestamp: number;
}

export interface EncryptionEnvelope {
  version: string;
  bundle_hash: string;
  cipher: string;
  nonce: string;
  sealed_keys: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
}

export interface IncidentCreateRequest {
  ioc_hashes?: string[];
  severity: IncidentSeverity;
  category: IncidentCategory;
  policy_hash?: string;
  bundle_hash: string;
  bundle_uri: string;
  bounty?: number;
  envelope?: EncryptionEnvelope | Record<string, unknown>;
}

export interface IncidentVerifyRequest {
  verdict: IncidentVerdict;
  notes?: string;
}

export interface DecryptGrantRequest {
  recipient: string;
  expires_at: number;
}

export interface Incident extends IncidentCreateRequest {
  incident_id: string;
  reporter: string;
  bounty?: number;
  status?: IncidentStatus;
  created_at?: string;
  updated_at?: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
}


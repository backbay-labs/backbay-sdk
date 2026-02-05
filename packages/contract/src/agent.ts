/**
 * Agent domain contracts for Backbay verified autonomy platform.
 * Defines types for agent sessions, messages, calls, and recommendations.
 * Dates are represented as ISO strings for client/server interoperability.
 */

import type { TrustTier } from "./entities";

// ─────────────────────────────────────────────────────────────
// Session enums
// ─────────────────────────────────────────────────────────────

export type SessionIntent =
  | "GENERAL"
  | "JOB_MANAGEMENT"
  | "RECEIPT_VERIFICATION"
  | "MARKETPLACE_BROWSE"
  | "MARKETPLACE_CREATE"
  | "DISPUTE_RESOLUTION"
  | "NODE_MANAGEMENT"
  | "TRUST_UPGRADE"
  | "PORTFOLIO_REVIEW";

export type SessionMode = "CONVERSATIONAL" | "COMMAND" | "GUIDED";

export type SessionStatus = "active" | "archived" | "expired";

// ─────────────────────────────────────────────────────────────
// Message enums
// ─────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

// ─────────────────────────────────────────────────────────────
// Recommendation enums
// ─────────────────────────────────────────────────────────────

export type RecommendationType =
  | "CREATE_JOB"
  | "RETRY_JOB"
  | "CANCEL_JOB"
  | "VERIFY_RECEIPT"
  | "OPEN_DISPUTE"
  | "CREATE_OFFER"
  | "CLAIM_TASK"
  | "UPGRADE_TIER"
  | "DEPOSIT_COLLATERAL"
  | "VIEW_DETAILS";

export type RecommendationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "MODIFIED"
  | "REJECTED"
  | "EXPIRED";

// ─────────────────────────────────────────────────────────────
// Call type enum
// ─────────────────────────────────────────────────────────────

export type CallType =
  | "ASSISTANT"
  | "TOOL_USE"
  | "VERIFICATION"
  | "RECOMMENDATION"
  | "SUMMARIZATION";

// ─────────────────────────────────────────────────────────────
// Agent Session
// ─────────────────────────────────────────────────────────────

export interface AgentSession {
  id: string;
  userId: string;
  title: string | null;
  status: SessionStatus;
  intent: SessionIntent | null;
  mode: SessionMode | null;
  /** Associated job ID if session is job-focused */
  jobId: string | null;
  /** Associated receipt ID if session is receipt-focused */
  receiptId: string | null;
  /** User's trust tier at session creation */
  trustTier: TrustTier;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Agent Message
// ─────────────────────────────────────────────────────────────

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

export interface AgentMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  /** Tool calls made during this message */
  toolCalls: ToolCall[] | null;
  /** Structured metadata for UI rendering */
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Agent Call (LLM invocation tracking)
// ─────────────────────────────────────────────────────────────

export interface AgentCall {
  id: string;
  userId: string;
  sessionId: string | null;
  messageId: string | null;
  /** Link to verification receipt if call was verified */
  receiptId: string | null;
  modelName: string;
  callType: CallType;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  createdAt: string;
}

export interface AgentCallStats {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalLatencyMs: number;
  averageLatencyMs: number;
  verifiedCallsCount: number;
  verifiedCallsPercent: number;
}

// ─────────────────────────────────────────────────────────────
// Agent Recommendation
// ─────────────────────────────────────────────────────────────

export interface AgentRecommendation {
  id: string;
  userId: string;
  sessionId: string | null;
  type: RecommendationType;
  /** Structured payload for the recommendation action */
  payload: Record<string, unknown>;
  status: RecommendationStatus;
  /** Reason/explanation for the recommendation */
  rationale: string | null;
  /** Associated entity IDs */
  jobId: string | null;
  receiptId: string | null;
  nodeId: string | null;
  offerId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

// ─────────────────────────────────────────────────────────────
// Request types
// ─────────────────────────────────────────────────────────────

export interface CreateSessionRequest {
  intent?: SessionIntent;
  mode?: SessionMode;
  title?: string;
  jobId?: string;
  receiptId?: string;
}

export interface UpdateSessionRequest {
  title?: string;
  status?: SessionStatus;
  intent?: SessionIntent;
  mode?: SessionMode;
}

export interface SendMessageRequest {
  content: string;
  /** Optional context to include with message */
  context?: {
    selectedEntityIds?: string[];
    currentView?: string;
  };
}

// ─────────────────────────────────────────────────────────────
// Response types
// ─────────────────────────────────────────────────────────────

export interface SendMessageResponse {
  userMessage: AgentMessage;
  assistantMessage: AgentMessage;
  call: {
    id: string;
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
  };
  /** Recommendations generated from this exchange */
  recommendations: AgentRecommendation[];
}

export interface AcceptRecommendationResponse {
  recommendation: AgentRecommendation;
  applied: {
    success: boolean;
    message: string;
    createdId?: string;
  };
}

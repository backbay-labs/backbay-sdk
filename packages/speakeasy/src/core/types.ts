/**
 * Core types for BayChat identity and messaging
 */

// =============================================================================
// Identity Types
// =============================================================================

/**
 * BayChat identity - Ed25519 keypair with derived metadata
 */
export interface BayChatIdentity {
  /** Ed25519 public key (32 bytes, hex encoded) */
  publicKey: string;
  /** Ed25519 secret key (64 bytes, hex encoded) - only present for local identity */
  secretKey?: string;
  /** SHA256(publicKey) truncated to 16 hex chars */
  fingerprint: string;
  /** Sigil derived from fingerprint */
  sigil: SpeakeasySigil;
  /** BIP39 mnemonic for recovery (24 words) - only shown once on creation */
  seedPhrase?: string[];
  /** Human-readable nickname (optional, not cryptographically bound) */
  nickname?: string;
  /** Creation timestamp */
  createdAt: number;
}

/**
 * Sigil types matching SpeakeasyDirectory
 */
export type SpeakeasySigil =
  | 'diamond'
  | 'eye'
  | 'wave'
  | 'crown'
  | 'spiral'
  | 'key'
  | 'star'
  | 'moon';

/**
 * Serialized identity for storage (excludes secret key)
 */
export interface SerializedIdentity {
  publicKey: string;
  fingerprint: string;
  sigil: SpeakeasySigil;
  nickname?: string;
  createdAt: number;
}

// =============================================================================
// Message Types
// =============================================================================

/**
 * Base message structure - all messages extend this
 */
export interface BaseMessage {
  /** SHA256(content + sender + timestamp + nonce) */
  id: string;
  /** Message type discriminator */
  type: MessageType;
  /** Sender's Ed25519 public key (hex) */
  sender: string;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Random nonce for uniqueness */
  nonce: string;
  /** Ed25519 signature over message hash (hex) */
  signature: string;
}

export type MessageType =
  | 'chat'
  | 'sentinel_request'
  | 'sentinel_response'
  | 'bounty_created'
  | 'bounty_claimed'
  | 'bounty_submitted'
  | 'bounty_verified'
  | 'bounty_settled'
  | 'presence'
  | 'typing';

/**
 * Regular chat message
 */
export interface ChatMessage extends BaseMessage {
  type: 'chat';
  /** Message content (plaintext) */
  content: string;
  /** Message ID being replied to */
  replyTo?: string;
  /** Public keys of @mentioned users */
  mentions?: string[];
}

/**
 * Request to a sentinel AI
 */
export interface SentinelRequest extends BaseMessage {
  type: 'sentinel_request';
  /** Sentinel name: 'opus' | 'baia' | 'alpha' | etc. */
  sentinel: string;
  /** User's prompt */
  prompt: string;
  /** Recent messages for context */
  context?: ChatMessage[];
  /** Requested evidence tier */
  evidenceTier?: EvidenceTier;
}

/**
 * Response from a sentinel AI
 */
export interface SentinelResponse extends BaseMessage {
  type: 'sentinel_response';
  /** Original request ID */
  replyTo: string;
  /** Response content */
  content: string;
  /** SHA256 of proof.json (Run Capsule) */
  capsuleId: string;
  /** IPFS CID or vault URI of capsule */
  capsuleUri: string;
  /** Evidence tier of verification */
  evidenceTier: EvidenceTier;
}

/**
 * Evidence tier for verification depth
 */
export type EvidenceTier = 'T0' | 'T1' | 'T2' | 'T3';

/**
 * Presence announcement
 */
export interface PresenceMessage extends BaseMessage {
  type: 'presence';
  /** Online status */
  status: 'online' | 'away' | 'offline';
  /** Current speakeasy ID */
  speakeasyId?: string;
}

/**
 * Typing indicator
 */
export interface TypingMessage extends BaseMessage {
  type: 'typing';
  /** Speakeasy ID where typing */
  speakeasyId: string;
  /** Whether currently typing */
  isTyping: boolean;
}

// =============================================================================
// Bounty Types
// =============================================================================

export interface BountyCreatedMessage extends BaseMessage {
  type: 'bounty_created';
  /** On-chain bounty ID */
  bountyId: string;
  /** Bounty description */
  description: string;
  /** Reward amount in wei */
  reward: string;
  /** Deadline timestamp */
  deadline: number;
  /** IPFS CID of acceptance criteria */
  criteriaHash: string;
  /** Base L2 escrow transaction hash */
  escrowTx: string;
  /** Evidence tier required */
  evidenceTier: EvidenceTier;
}

export interface BountyClaimedMessage extends BaseMessage {
  type: 'bounty_claimed';
  bountyId: string;
  /** Claimer's public key */
  claimer: string;
  /** Claim transaction hash */
  claimTx: string;
}

export interface BountySubmittedMessage extends BaseMessage {
  type: 'bounty_submitted';
  bountyId: string;
  /** Solution capsule ID */
  capsuleId: string;
  /** Solution capsule URI */
  capsuleUri: string;
  /** Submit transaction hash */
  submitTx: string;
}

export interface BountyVerifiedMessage extends BaseMessage {
  type: 'bounty_verified';
  bountyId: string;
  /** Verifier's public key */
  verifier: string;
  /** Verification verdict */
  verdict: 'approve' | 'reject';
  /** Attestation transaction hash */
  attestationTx: string;
}

export interface BountySettledMessage extends BaseMessage {
  type: 'bounty_settled';
  bountyId: string;
  /** Winner's public key */
  winner: string;
  /** Settlement transaction hash */
  settlementTx: string;
}

/**
 * Union type of all message types
 */
export type AnyMessage =
  | ChatMessage
  | SentinelRequest
  | SentinelResponse
  | PresenceMessage
  | TypingMessage
  | BountyCreatedMessage
  | BountyClaimedMessage
  | BountySubmittedMessage
  | BountyVerifiedMessage
  | BountySettledMessage;

// =============================================================================
// Sentinel Types
// =============================================================================

/**
 * Known sentinel configuration
 */
export interface SentinelConfig {
  /** Display name */
  name: string;
  /** Ed25519 public key (hex) */
  publicKey: string;
  /** Kernel toolchain to use */
  toolchain: string;
  /** Description */
  description: string;
  /** Associated sigil */
  sigil: SpeakeasySigil;
}

// =============================================================================
// Verification Types
// =============================================================================

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  sentinel?: string;
}

export interface DeepVerificationResult {
  valid: boolean;
  reason?: string;
  gateResults?: GateResult[];
  executionTrace?: string;
}

export interface GateResult {
  gateType: string;
  passed: boolean;
  score?: number;
  detailsHash: string;
}

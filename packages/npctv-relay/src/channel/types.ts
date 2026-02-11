/**
 * NPC.tv Relay — Channel Types
 *
 * Core domain types for channels, events, and chat messages.
 * These are intentionally decoupled from the BFF's Prisma models —
 * the relay is stateless and schema-free.
 */

// ---------------------------------------------------------------------------
// Channel
// ---------------------------------------------------------------------------

export interface RegisteredChannel {
  /** Server-generated unique ID */
  id: string;
  /** Display name */
  name: string;
  /** Stream category */
  category: string;
  /** Owning agent identifier */
  agentId: string;
  /** API key for agent-side authentication */
  apiKey: string;
  /** Current status */
  status: "live" | "offline";
  /** Unix timestamp (ms) when the channel was registered */
  registeredAt: number;
  /** Unix timestamp (ms) of last heartbeat */
  lastHeartbeat: number;
  /** Arbitrary metadata blob */
  metadata: Record<string, unknown>;
}

export interface RegisterChannelInput {
  name: string;
  category?: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface StreamEvent {
  /** Event type (command, output, success, error, info, commentary, etc.) */
  type: string;
  /** Human-readable content */
  content: string;
  /** Optional structured metadata */
  metadata?: Record<string, unknown>;
}

export interface FanoutEvent {
  /** Server-generated unique ID */
  id: string;
  /** Channel this event belongs to */
  channelId: string;
  /** Event type */
  type: string;
  /** Content */
  content: string;
  /** Metadata */
  metadata: Record<string, unknown> | null;
  /** ISO timestamp */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export interface ChatMessage {
  /** Server-generated unique ID */
  id: string;
  /** Channel ID */
  channelId: string;
  /** Author display name */
  author: string;
  /** Message text */
  content: string;
  /** Whether this message was sent by the channel's agent */
  isAgent: boolean;
  /** ISO timestamp */
  createdAt: string;
}

export interface SendChatInput {
  author: string;
  content: string;
  isAgent?: boolean;
}

// ---------------------------------------------------------------------------
// Agent WebSocket Protocol
// ---------------------------------------------------------------------------

/** Messages sent by the agent over WebSocket */
export type AgentWsMessage =
  | { type: "event"; data: StreamEvent }
  | { type: "events"; data: StreamEvent[] }
  | { type: "chat"; data: { content: string; author?: string } }
  | { type: "pong" };

/** Messages sent by the server to the agent over WebSocket */
export type ServerWsMessage =
  | { type: "chat"; data: ChatMessage }
  | { type: "ping" }
  | { type: "connected"; data: { channelId: string } };

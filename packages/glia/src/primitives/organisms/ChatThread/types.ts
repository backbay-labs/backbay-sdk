/**
 * Types for the ChatThread component system.
 */

import type { ToolCallStatus } from '../../molecules/ToolCallCard';

/** Role of a chat message sender */
export type ChatMessageRole = 'user' | 'assistant' | 'system' | 'tool';

/** A code block within a message */
export interface MessageCodeBlock {
  language: string;
  code: string;
  title?: string;
}

/** A tool call within a message */
export interface MessageToolCall {
  id: string;
  name: string;
  args?: Record<string, unknown>;
  status: ToolCallStatus;
  result?: unknown;
  error?: string;
  duration?: number;
}

/** Content part of a message — can be text, code, or tool call */
export type MessageContentPart =
  | { type: 'text'; text: string }
  | { type: 'code'; code: MessageCodeBlock }
  | { type: 'tool_call'; toolCall: MessageToolCall };

/** A single chat message */
export interface ChatMessage {
  /** Unique message ID */
  id: string;
  /** Sender role */
  role: ChatMessageRole;
  /** Message content parts */
  content: MessageContentPart[];
  /** Timestamp (ISO string or Date) */
  timestamp?: string | Date;
  /** Whether this message is currently being streamed */
  isStreaming?: boolean;
  /** Avatar URL or initials for the sender */
  avatar?: string;
  /** Display name for the sender */
  senderName?: string;
}

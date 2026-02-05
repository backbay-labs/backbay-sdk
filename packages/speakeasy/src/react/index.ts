/**
 * Speakeasy React Hooks
 *
 * React bindings for Speakeasy identity and P2P messaging.
 */

// Identity hook
export { useIdentity } from './useIdentity';
export type { UseIdentityActions, UseIdentityReturn, UseIdentityState } from './useIdentity';

// Transport hook
export { useTransport } from './useTransport';
export type {
  UseTransportActions,
  UseTransportOptions,
  UseTransportReturn,
  UseTransportState,
} from './useTransport';

// Messages hook
export { useMessages } from './useMessages';
export type {
  UseMessagesActions,
  UseMessagesOptions,
  UseMessagesReturn,
  UseMessagesState,
} from './useMessages';

// Re-export core types for convenience
export type {
  AnyMessage,
  BayChatIdentity,
  ChatMessage,
  EvidenceTier,
  MessageType,
  SentinelConfig,
  SentinelRequest,
  SentinelResponse,
  SpeakeasySigil,
  VerificationResult,
} from '../core';

// Re-export transport types for convenience
export type {
  ConnectionState,
  KnownPeer,
  MessageEnvelope,
  SpeakeasyTopic,
} from '../transport';

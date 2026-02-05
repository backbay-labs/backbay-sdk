/**
 * Network layer types for Speakeasy P2P
 */

import type { Libp2p } from 'libp2p';
import type { PubSub } from '@libp2p/interface';
import type { PeerId } from '@libp2p/interface';
import type { AnyMessage, BayChatIdentity } from '../core';

// =============================================================================
// Node Types
// =============================================================================

/**
 * BayChat libp2p node with Gossipsub
 * Using PubSub interface for flexibility with different gossipsub versions
 */
export type BayChatNode = Libp2p<{
  pubsub: PubSub;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}>;

/**
 * Node configuration
 */
export interface NodeConfig {
  /** Bootstrap peers for initial discovery */
  bootstrapPeers?: string[];
  /** Relay servers for NAT traversal */
  relayServers?: string[];
  /** Enable WebRTC transport */
  enableWebRTC?: boolean;
  /** Enable WebSocket transport */
  enableWebSocket?: boolean;
  /** Listen addresses */
  listenAddresses?: string[];
}

/**
 * Connection state
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

// =============================================================================
// Topic Types
// =============================================================================

/**
 * Topic configuration for a speakeasy
 */
export interface SpeakeasyTopic {
  /** Speakeasy ID (used in topic name) */
  id: string;
  /** Topic name: /baychat/speakeasy/<id>/messages */
  messageTopic: string;
  /** Topic name: /baychat/speakeasy/<id>/presence */
  presenceTopic: string;
  /** Topic name: /baychat/speakeasy/<id>/typing */
  typingTopic: string;
}

/**
 * Global topics
 */
export interface GlobalTopics {
  /** Discovery topic for finding peers */
  discovery: string;
  /** Sentinel announcements */
  sentinels: string;
}

// =============================================================================
// Message Envelope
// =============================================================================

/**
 * Network message envelope (wraps signed messages)
 */
export interface MessageEnvelope {
  /** Protocol version */
  version: 1;
  /** Message type for routing */
  type: 'message' | 'presence' | 'typing' | 'sync_request' | 'sync_response';
  /** Signed message payload */
  payload: AnyMessage;
  /** TTL for gossip (hops remaining) */
  ttl: number;
  /** Timestamp when envelope was created */
  created: number;
}

// =============================================================================
// Peer Types
// =============================================================================

/**
 * Known peer information
 */
export interface KnownPeer {
  /** libp2p peer ID */
  peerId: PeerId;
  /** BayChat public key (if known) */
  publicKey?: string;
  /** Multiaddresses */
  addrs: string[];
  /** Last seen timestamp */
  lastSeen: number;
  /** Is this a sentinel? */
  isSentinel?: boolean;
  /** Sentinel name if applicable */
  sentinelName?: string;
}

/**
 * Peer discovery event
 */
export interface PeerDiscoveryEvent {
  peerId: PeerId;
  multiaddrs: string[];
}

/**
 * Peer connection event
 */
export interface PeerConnectionEvent {
  peerId: PeerId;
  direction: 'inbound' | 'outbound';
}

// =============================================================================
// Events
// =============================================================================

/**
 * Network event types
 */
export interface NetworkEvents {
  'peer:discovery': PeerDiscoveryEvent;
  'peer:connect': PeerConnectionEvent;
  'peer:disconnect': { peerId: PeerId };
  'message:received': { topic: string; envelope: MessageEnvelope; from: PeerId };
  'connection:state': { state: ConnectionState; error?: Error };
  'subscription:change': { topic: string; subscribed: boolean };
}

/**
 * Event handler type
 */
export type NetworkEventHandler<K extends keyof NetworkEvents> = (
  event: NetworkEvents[K]
) => void;

// =============================================================================
// Transport Interface
// =============================================================================

/**
 * Transport layer interface
 */
export interface Transport {
  /** Start the transport */
  start(): Promise<void>;
  /** Stop the transport */
  stop(): Promise<void>;
  /** Get connection state */
  getState(): ConnectionState;
  /** Get local peer ID */
  getPeerId(): PeerId | null;
  /** Subscribe to a speakeasy */
  joinSpeakeasy(speakeasyId: string): Promise<SpeakeasyTopic>;
  /** Unsubscribe from a speakeasy */
  leaveSpeakeasy(speakeasyId: string): Promise<void>;
  /** Publish a message to a topic */
  publish(topic: string, envelope: MessageEnvelope): Promise<void>;
  /** Get connected peers */
  getPeers(): KnownPeer[];
  /** Add event listener */
  on<K extends keyof NetworkEvents>(event: K, handler: NetworkEventHandler<K>): void;
  /** Remove event listener */
  off<K extends keyof NetworkEvents>(event: K, handler: NetworkEventHandler<K>): void;
}

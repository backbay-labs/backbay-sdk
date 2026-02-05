/**
 * BayChat P2P Transport Layer
 *
 * Wraps libp2p with Gossipsub for decentralized message propagation.
 */

import { createLibp2p } from 'libp2p';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { noise } from '@chainsafe/libp2p-noise';
import { webRTC } from '@libp2p/webrtc';
import { webSockets } from '@libp2p/websockets';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { identify } from '@libp2p/identify';
import { bootstrap } from '@libp2p/bootstrap';
import { multiaddr } from '@multiformats/multiaddr';
import type { PeerId } from '@libp2p/interface';

import type {
  BayChatNode,
  ConnectionState,
  KnownPeer,
  MessageEnvelope,
  NetworkEventHandler,
  NetworkEvents,
  NodeConfig,
  SpeakeasyTopic,
  Transport,
} from './types';
import { createSpeakeasyTopics, getAllSpeakeasyTopics, GLOBAL_TOPICS } from './topics';

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: NodeConfig = {
  enableWebRTC: true,
  enableWebSocket: true,
  bootstrapPeers: [],
  relayServers: [],
  listenAddresses: [],
};

// =============================================================================
// Transport Implementation
// =============================================================================

/**
 * Create a new BayChat transport
 */
export function createTransport(config: NodeConfig = {}): Transport {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  let node: BayChatNode | null = null;
  let state: ConnectionState = 'disconnected';
  const peers = new Map<string, KnownPeer>();
  const subscriptions = new Set<string>();
  const eventHandlers = new Map<keyof NetworkEvents, Set<NetworkEventHandler<any>>>();

  // Event emitter helpers
  function emit<K extends keyof NetworkEvents>(event: K, data: NetworkEvents[K]): void {
    const handlers = eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  function setState(newState: ConnectionState, error?: Error): void {
    state = newState;
    emit('connection:state', { state: newState, error });
  }

  // Build transport configuration
  function buildTransports() {
    const transports = [];

    if (mergedConfig.enableWebSocket) {
      transports.push(webSockets());
    }

    if (mergedConfig.enableWebRTC) {
      transports.push(webRTC());
    }

    // Always include circuit relay for NAT traversal
    transports.push(circuitRelayTransport());

    return transports;
  }

  // Build peer discovery configuration
  function buildPeerDiscovery() {
    const discovery = [];

    if (mergedConfig.bootstrapPeers && mergedConfig.bootstrapPeers.length > 0) {
      discovery.push(
        bootstrap({
          list: mergedConfig.bootstrapPeers,
        })
      );
    }

    return discovery;
  }

  return {
    async start(): Promise<void> {
      if (node) {
        return; // Already started
      }

      setState('connecting');

      try {
        node = await createLibp2p({
          transports: buildTransports(),
          connectionEncrypters: [noise()],
          services: {
            pubsub: gossipsub({
              allowPublishToZeroTopicPeers: true,
              emitSelf: false,
              fallbackToFloodsub: true,
              // Message validation - return Uint8Array for deduplication
              msgIdFn: (msg) => {
                // Use first 64 bytes of message content as ID for deduplication
                const data = msg.data;
                return data.slice(0, 64);
              },
            }),
            identify: identify(),
          },
          peerDiscovery: buildPeerDiscovery(),
        });

        // Set up event handlers
        const currentNode = node;
        currentNode.addEventListener('peer:discovery', (event) => {
          const peer = event.detail;
          emit('peer:discovery', {
            peerId: peer.id,
            multiaddrs: peer.multiaddrs.map((ma) => ma.toString()),
          });
        });

        currentNode.addEventListener('peer:connect', (event) => {
          const peerId = event.detail;
          peers.set(peerId.toString(), {
            peerId,
            addrs: [],
            lastSeen: Date.now(),
          });
          emit('peer:connect', { peerId, direction: 'outbound' });
        });

        currentNode.addEventListener('peer:disconnect', (event) => {
          const peerId = event.detail;
          peers.delete(peerId.toString());
          emit('peer:disconnect', { peerId });
        });

        // Set up pubsub message handler
        currentNode.services.pubsub.addEventListener('message', (event) => {
          const detail = event.detail as { topic: string; data: Uint8Array; from?: PeerId };
          const { topic, data } = detail;
          // 'from' may not exist in all libp2p versions
          const from = detail.from ?? currentNode.peerId;

          try {
            const envelope = JSON.parse(new TextDecoder().decode(data)) as MessageEnvelope;
            emit('message:received', { topic, envelope, from });
          } catch (err) {
            console.error('Failed to parse message:', err);
          }
        });

        // Subscribe to global topics
        await currentNode.services.pubsub.subscribe(GLOBAL_TOPICS.discovery);
        await currentNode.services.pubsub.subscribe(GLOBAL_TOPICS.sentinels);

        await currentNode.start();
        setState('connected');
      } catch (error) {
        setState('error', error as Error);
        throw error;
      }
    },

    async stop(): Promise<void> {
      if (!node) {
        return;
      }

      // Unsubscribe from all topics
      for (const topic of subscriptions) {
        await node.services.pubsub.unsubscribe(topic);
      }
      subscriptions.clear();

      await node.stop();
      node = null;
      peers.clear();
      setState('disconnected');
    },

    getState(): ConnectionState {
      return state;
    },

    getPeerId(): PeerId | null {
      return node?.peerId ?? null;
    },

    async joinSpeakeasy(speakeasyId: string): Promise<SpeakeasyTopic> {
      if (!node) {
        throw new Error('Transport not started');
      }

      const topics = createSpeakeasyTopics(speakeasyId);
      const allTopics = getAllSpeakeasyTopics(speakeasyId);

      for (const topic of allTopics) {
        if (!subscriptions.has(topic)) {
          await node.services.pubsub.subscribe(topic);
          subscriptions.add(topic);
          emit('subscription:change', { topic, subscribed: true });
        }
      }

      return topics;
    },

    async leaveSpeakeasy(speakeasyId: string): Promise<void> {
      if (!node) {
        return;
      }

      const allTopics = getAllSpeakeasyTopics(speakeasyId);

      for (const topic of allTopics) {
        if (subscriptions.has(topic)) {
          await node.services.pubsub.unsubscribe(topic);
          subscriptions.delete(topic);
          emit('subscription:change', { topic, subscribed: false });
        }
      }
    },

    async publish(topic: string, envelope: MessageEnvelope): Promise<void> {
      if (!node) {
        throw new Error('Transport not started');
      }

      const data = new TextEncoder().encode(JSON.stringify(envelope));
      await node.services.pubsub.publish(topic, data);
    },

    getPeers(): KnownPeer[] {
      return Array.from(peers.values());
    },

    on<K extends keyof NetworkEvents>(event: K, handler: NetworkEventHandler<K>): void {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, new Set());
      }
      eventHandlers.get(event)!.add(handler);
    },

    off<K extends keyof NetworkEvents>(event: K, handler: NetworkEventHandler<K>): void {
      const handlers = eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    },
  };
}

// =============================================================================
// Message Envelope Helpers
// =============================================================================

/**
 * Create a message envelope
 */
export function createEnvelope(
  type: MessageEnvelope['type'],
  payload: MessageEnvelope['payload'],
  ttl = 10
): MessageEnvelope {
  return {
    version: 1,
    type,
    payload,
    ttl,
    created: Date.now(),
  };
}

/**
 * Check if an envelope is still valid (not expired)
 */
export function isEnvelopeValid(envelope: MessageEnvelope, maxAgeMs = 5 * 60 * 1000): boolean {
  const age = Date.now() - envelope.created;
  return age <= maxAgeMs && envelope.ttl > 0;
}

/**
 * Decrement TTL for forwarding
 */
export function decrementTtl(envelope: MessageEnvelope): MessageEnvelope {
  return {
    ...envelope,
    ttl: envelope.ttl - 1,
  };
}

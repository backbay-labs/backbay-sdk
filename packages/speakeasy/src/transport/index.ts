/**
 * Speakeasy Transport
 *
 * libp2p-based P2P transport with Gossipsub for decentralized messaging.
 */

// Types
export type {
  BayChatNode,
  ConnectionState,
  GlobalTopics,
  KnownPeer,
  MessageEnvelope,
  NetworkEventHandler,
  NetworkEvents,
  NodeConfig,
  PeerConnectionEvent,
  PeerDiscoveryEvent,
  SpeakeasyTopic,
  Transport,
} from './types';

// Topics
export {
  createSpeakeasyTopics,
  getAllSpeakeasyTopics,
  GLOBAL_TOPICS,
  isGlobalTopic,
  parseSpeakeasyTopic,
  TOPIC_PREFIX,
} from './topics';

// Transport
export {
  createEnvelope,
  createTransport,
  decrementTtl,
  isEnvelopeValid,
} from './transport';

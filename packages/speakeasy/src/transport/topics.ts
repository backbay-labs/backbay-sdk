/**
 * Gossipsub Topic Management
 *
 * Topic naming conventions for BayChat P2P network.
 */

import type { GlobalTopics, SpeakeasyTopic } from './types';

// =============================================================================
// Constants
// =============================================================================

/** Protocol prefix for all topics */
export const TOPIC_PREFIX = '/baychat/v1';

/** Global topic names */
export const GLOBAL_TOPICS: GlobalTopics = {
  discovery: `${TOPIC_PREFIX}/discovery`,
  sentinels: `${TOPIC_PREFIX}/sentinels`,
};

// =============================================================================
// Topic Builders
// =============================================================================

/**
 * Create topic names for a speakeasy
 *
 * @param speakeasyId - Speakeasy identifier
 * @returns Topic configuration
 */
export function createSpeakeasyTopics(speakeasyId: string): SpeakeasyTopic {
  const base = `${TOPIC_PREFIX}/speakeasy/${speakeasyId}`;
  return {
    id: speakeasyId,
    messageTopic: `${base}/messages`,
    presenceTopic: `${base}/presence`,
    typingTopic: `${base}/typing`,
  };
}

/**
 * Parse a topic name to extract speakeasy ID and type
 *
 * @param topic - Full topic name
 * @returns Parsed info or null if not a speakeasy topic
 */
export function parseSpeakeasyTopic(
  topic: string
): { speakeasyId: string; type: 'messages' | 'presence' | 'typing' } | null {
  const prefix = `${TOPIC_PREFIX}/speakeasy/`;
  if (!topic.startsWith(prefix)) {
    return null;
  }

  const remainder = topic.slice(prefix.length);
  const parts = remainder.split('/');

  if (parts.length !== 2) {
    return null;
  }

  const [speakeasyId, type] = parts;

  if (type !== 'messages' && type !== 'presence' && type !== 'typing') {
    return null;
  }

  return { speakeasyId, type };
}

/**
 * Check if a topic is a global topic
 */
export function isGlobalTopic(topic: string): boolean {
  return topic === GLOBAL_TOPICS.discovery || topic === GLOBAL_TOPICS.sentinels;
}

/**
 * Get all topic names for a speakeasy (for subscription)
 */
export function getAllSpeakeasyTopics(speakeasyId: string): string[] {
  const topics = createSpeakeasyTopics(speakeasyId);
  return [topics.messageTopic, topics.presenceTopic, topics.typingTopic];
}

/**
 * React hook for Speakeasy messages
 */

import { useCallback, useMemo, useState } from 'react';
import {
  createSignedMessage,
  verifyMessage,
  type AnyMessage,
  type BayChatIdentity,
  type ChatMessage,
  type SentinelRequest,
} from '../core';

export interface UseMessagesState {
  /** All messages (sorted by timestamp) */
  messages: AnyMessage[];
  /** Messages pending verification */
  pendingVerification: Set<string>;
  /** Failed verification message IDs */
  verificationFailed: Set<string>;
}

export interface UseMessagesActions {
  /** Add a message (will verify signature) */
  addMessage: (message: AnyMessage) => Promise<void>;
  /** Create and sign a chat message */
  sendChat: (content: string, replyTo?: string) => Promise<ChatMessage>;
  /** Create and sign a sentinel request */
  sendSentinelRequest: (
    sentinel: string,
    prompt: string,
    context?: ChatMessage[]
  ) => Promise<SentinelRequest>;
  /** Clear all messages */
  clear: () => void;
}

export type UseMessagesReturn = UseMessagesState & UseMessagesActions;

export interface UseMessagesOptions {
  /** Current user identity (for signing) */
  identity: BayChatIdentity | null;
  /** Skip verification for messages from self */
  skipSelfVerification?: boolean;
  /** Maximum messages to keep in memory */
  maxMessages?: number;
}

/**
 * Hook for managing chat messages
 *
 * Handles message storage, signature verification, and message creation.
 *
 * @example
 * ```tsx
 * function Chat({ identity }: { identity: BayChatIdentity }) {
 *   const { messages, sendChat, addMessage } = useMessages({ identity });
 *
 *   // Add incoming messages from transport
 *   useEffect(() => {
 *     transport.on('message', (envelope) => {
 *       addMessage(envelope.payload);
 *     });
 *   }, []);
 *
 *   const handleSend = async (content: string) => {
 *     const message = await sendChat(content);
 *     transport.publish(topic, message);
 *   };
 *
 *   return <MessageList messages={messages} onSend={handleSend} />;
 * }
 * ```
 */
export function useMessages(options: UseMessagesOptions): UseMessagesReturn {
  const { identity, skipSelfVerification = true, maxMessages = 1000 } = options;

  const [messages, setMessages] = useState<AnyMessage[]>([]);
  const [pendingVerification, setPendingVerification] = useState<Set<string>>(new Set());
  const [verificationFailed, setVerificationFailed] = useState<Set<string>>(new Set());

  // Track seen message IDs for deduplication
  const seenIds = useMemo(() => new Set<string>(), []);

  const addMessage = useCallback(
    async (message: AnyMessage): Promise<void> => {
      // Deduplicate
      if (seenIds.has(message.id)) {
        return;
      }
      seenIds.add(message.id);

      // Check if from self (skip verification if configured)
      const isFromSelf = identity && message.sender === identity.publicKey;

      if (!isFromSelf || !skipSelfVerification) {
        // Mark as pending verification
        setPendingVerification((prev) => new Set(prev).add(message.id));

        // Verify signature
        const result = await verifyMessage(message);

        // Remove from pending
        setPendingVerification((prev) => {
          const next = new Set(prev);
          next.delete(message.id);
          return next;
        });

        if (!result.valid) {
          // Mark as failed
          setVerificationFailed((prev) => new Set(prev).add(message.id));
          console.warn('Message verification failed:', message.id, result.reason);
          return; // Don't add invalid messages
        }
      }

      // Add to messages (sorted by timestamp)
      setMessages((prev) => {
        const updated = [...prev, message].sort((a, b) => a.timestamp - b.timestamp);

        // Trim if over max
        if (updated.length > maxMessages) {
          const removed = updated.slice(0, updated.length - maxMessages);
          removed.forEach((m) => seenIds.delete(m.id));
          return updated.slice(-maxMessages);
        }

        return updated;
      });
    },
    [identity, skipSelfVerification, maxMessages, seenIds]
  );

  const sendChat = useCallback(
    async (content: string, replyTo?: string): Promise<ChatMessage> => {
      if (!identity) {
        throw new Error('No identity for signing');
      }

      const message = await createSignedMessage(
        {
          type: 'chat' as const,
          content,
          replyTo,
        },
        identity
      );

      // Add to local messages immediately
      await addMessage(message);

      return message;
    },
    [identity, addMessage]
  );

  const sendSentinelRequest = useCallback(
    async (
      sentinel: string,
      prompt: string,
      context?: ChatMessage[]
    ): Promise<SentinelRequest> => {
      if (!identity) {
        throw new Error('No identity for signing');
      }

      const message = await createSignedMessage(
        {
          type: 'sentinel_request' as const,
          sentinel,
          prompt,
          context,
        },
        identity
      );

      // Add to local messages immediately
      await addMessage(message);

      return message;
    },
    [identity, addMessage]
  );

  const clear = useCallback(() => {
    setMessages([]);
    setPendingVerification(new Set());
    setVerificationFailed(new Set());
    seenIds.clear();
  }, [seenIds]);

  return {
    messages,
    pendingVerification,
    verificationFailed,
    addMessage,
    sendChat,
    sendSentinelRequest,
    clear,
  };
}

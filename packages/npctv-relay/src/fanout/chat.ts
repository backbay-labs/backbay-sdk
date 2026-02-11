/**
 * NPC.tv Relay — Chat Fanout
 *
 * Manages SSE subscriber sets per channel for chat messages,
 * plus a rolling in-memory buffer of recent messages.
 */

import { env } from "../env";
import type { ChatMessage, SendChatInput } from "../channel/types";

/** Generate a short unique message ID */
function messageId(): string {
  return `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export type ChatCallback = (message: ChatMessage) => void;

export class ChatFanout {
  private subscribers = new Map<string, Set<ChatCallback>>();

  /** Rolling buffer of recent messages per channel */
  private buffers = new Map<string, ChatMessage[]>();

  /**
   * Subscribe to chat messages on a channel.
   * Returns an unsubscribe function.
   */
  subscribe(channelId: string, callback: ChatCallback): () => void {
    let subs = this.subscribers.get(channelId);
    if (!subs) {
      subs = new Set();
      this.subscribers.set(channelId, subs);
    }
    subs.add(callback);

    return () => {
      subs!.delete(callback);
      if (subs!.size === 0) {
        this.subscribers.delete(channelId);
      }
    };
  }

  /**
   * Send a chat message: add to buffer and fan out to all subscribers.
   * Returns the created ChatMessage.
   */
  send(channelId: string, input: SendChatInput): ChatMessage {
    const message: ChatMessage = {
      id: messageId(),
      channelId,
      author: input.author,
      content: input.content,
      isAgent: input.isAgent ?? false,
      createdAt: new Date().toISOString(),
    };

    // Add to rolling buffer
    this.addToBuffer(channelId, message);

    // Fan out to SSE subscribers
    this.emitRaw(channelId, message);

    return message;
  }

  /**
   * Emit a pre-built ChatMessage (e.g., from Redis pub/sub).
   */
  emitRaw(channelId: string, message: ChatMessage): void {
    const subs = this.subscribers.get(channelId);
    if (!subs) return;

    for (const callback of subs) {
      try {
        callback(message);
      } catch {
        // Individual subscriber errors are non-fatal
      }
    }
  }

  /**
   * Get recent chat messages from the in-memory buffer.
   * Returns newest-first, limited by `limit` (default 50).
   */
  getRecent(channelId: string, limit = 50): ChatMessage[] {
    const buffer = this.buffers.get(channelId);
    if (!buffer) return [];

    // Buffer is stored oldest-first; return newest-first, limited
    return buffer.slice(-limit).reverse();
  }

  /** Get subscriber count for a channel */
  getSubscriberCount(channelId: string): number {
    return this.subscribers.get(channelId)?.size ?? 0;
  }

  /** Remove all subscribers and buffer for a channel */
  clear(channelId: string): void {
    this.subscribers.delete(channelId);
    this.buffers.delete(channelId);
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private addToBuffer(channelId: string, message: ChatMessage): void {
    let buffer = this.buffers.get(channelId);
    if (!buffer) {
      buffer = [];
      this.buffers.set(channelId, buffer);
    }

    buffer.push(message);

    // Trim to rolling window
    if (buffer.length > env.CHAT_BUFFER_SIZE) {
      buffer.splice(0, buffer.length - env.CHAT_BUFFER_SIZE);
    }
  }
}

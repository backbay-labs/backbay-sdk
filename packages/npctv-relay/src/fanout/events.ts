/**
 * NPC.tv Relay — Event Fanout
 *
 * Manages SSE subscriber sets per channel for stream events.
 * When an agent pushes an event, it's fanned out to all
 * connected viewers in O(subscribers) time.
 */

import type { FanoutEvent, StreamEvent } from "../channel/types";

/** Generate a short unique event ID */
function eventId(): string {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export type EventCallback = (event: FanoutEvent) => void;

export class EventFanout {
  private subscribers = new Map<string, Set<EventCallback>>();

  /**
   * Subscribe to events on a channel.
   * Returns an unsubscribe function — call it when the SSE connection closes.
   */
  subscribe(channelId: string, callback: EventCallback): () => void {
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
   * Emit a raw StreamEvent from an agent to all subscribers on a channel.
   * The event is enriched with an ID and timestamp before fanout.
   */
  emit(channelId: string, event: StreamEvent): FanoutEvent {
    const fanoutEvent: FanoutEvent = {
      id: eventId(),
      channelId,
      type: event.type,
      content: event.content,
      metadata: event.metadata ?? null,
      createdAt: new Date().toISOString(),
    };

    this.emitRaw(channelId, fanoutEvent);
    return fanoutEvent;
  }

  /**
   * Emit a pre-built FanoutEvent (e.g., from Redis pub/sub).
   */
  emitRaw(channelId: string, event: FanoutEvent): void {
    const subs = this.subscribers.get(channelId);
    if (!subs) return;

    for (const callback of subs) {
      try {
        callback(event);
      } catch {
        // Individual subscriber errors are non-fatal
      }
    }
  }

  /** Get subscriber count for a channel */
  getSubscriberCount(channelId: string): number {
    return this.subscribers.get(channelId)?.size ?? 0;
  }

  /** Get total subscriber count across all channels */
  get totalSubscribers(): number {
    let total = 0;
    for (const subs of this.subscribers.values()) {
      total += subs.size;
    }
    return total;
  }

  /** Remove all subscribers for a channel (e.g., on deregister) */
  clear(channelId: string): void {
    this.subscribers.delete(channelId);
  }
}

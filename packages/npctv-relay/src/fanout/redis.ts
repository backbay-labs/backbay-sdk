/**
 * NPC.tv Relay — Redis Pub/Sub Adapter
 *
 * Optional adapter for horizontal scaling. When REDIS_URL is configured,
 * events and chat messages are published to Redis channels so other
 * relay instances can pick them up and fan out to their local subscribers.
 *
 * When REDIS_URL is not set, this is a transparent no-op wrapper.
 *
 * Redis channel naming:
 *   - npctv:events:{channelId}  — stream events
 *   - npctv:chat:{channelId}    — chat messages
 */

import type { FanoutEvent, ChatMessage } from "../channel/types";
import type { EventFanout } from "./events";
import type { ChatFanout } from "./chat";

/**
 * Redis fanout adapter.
 *
 * When instantiated with a Redis URL, it:
 *  1. Publishes all local emit() calls to Redis
 *  2. Subscribes to `npctv:*` patterns and fans incoming messages
 *     out to local subscribers via EventFanout / ChatFanout
 *
 * This keeps the EventFanout and ChatFanout classes pure in-memory
 * and unaware of Redis.
 */
export class RedisFanout {
  private enabled: boolean;
  private redisUrl: string | undefined;

  // In a production implementation, these would be actual Redis client instances.
  // For now, we stub the interface so the wiring is correct and the adapter
  // can be implemented when Redis is needed.
  private publisher: unknown = null;
  private subscriber: unknown = null;

  constructor(
    redisUrl: string | undefined,
    private eventFanout: EventFanout,
    private chatFanout: ChatFanout,
  ) {
    this.redisUrl = redisUrl;
    this.enabled = !!redisUrl;

    if (this.enabled) {
      console.log(`[redis] Redis fanout enabled: ${redisUrl}`);
      this.connect().catch((err) => {
        console.error("[redis] Failed to connect:", err);
        this.enabled = false;
      });
    }
  }

  /** Whether Redis pub/sub is active */
  get isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Publish an event to Redis (in addition to local fanout).
   * No-op if Redis is not configured.
   */
  publishEvent(channelId: string, event: FanoutEvent): void {
    if (!this.enabled) return;

    this.publish(`npctv:events:${channelId}`, JSON.stringify(event));
  }

  /**
   * Publish a chat message to Redis (in addition to local fanout).
   * No-op if Redis is not configured.
   */
  publishChat(channelId: string, message: ChatMessage): void {
    if (!this.enabled) return;

    this.publish(`npctv:chat:${channelId}`, JSON.stringify(message));
  }

  /** Graceful shutdown */
  async destroy(): Promise<void> {
    // Close Redis connections when implemented
    this.enabled = false;
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private async connect(): Promise<void> {
    // TODO: Implement actual Redis connection when horizontal scaling is needed.
    //
    // Implementation sketch:
    //   1. Create two connections (publisher + subscriber) using `ioredis` or `redis`
    //   2. Publisher: used by publishEvent() and publishChat()
    //   3. Subscriber: psubscribe("npctv:*")
    //      - On message from `npctv:events:{channelId}`:
    //          Parse FanoutEvent, call this.eventFanout.emitRaw(channelId, event)
    //      - On message from `npctv:chat:{channelId}`:
    //          Parse ChatMessage, call this.chatFanout.emitRaw(channelId, msg)
    //   4. Deduplicate: include a `sourceInstanceId` in published messages
    //      so an instance doesn't re-emit its own messages.
    //
    // For now, log that Redis is configured but not yet connected.
    console.log("[redis] Redis pub/sub stub — implement with ioredis when scaling horizontally");
  }

  private publish(_channel: string, _message: string): void {
    // No-op stub until Redis client is wired
  }
}

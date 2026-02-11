/**
 * NPC.tv Relay — Channel Registry
 *
 * In-memory registry of active streaming channels. Channels register
 * with the relay and receive an API key for authentication. A background
 * timer marks channels as offline if they miss their heartbeat window.
 *
 * This is intentionally stateless — all state lives in memory. On restart,
 * agents re-register via WebSocket or HTTP.
 */

import { env } from "../env";
import type { RegisteredChannel, RegisterChannelInput } from "./types";

/** Generate a random hex string */
function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Generate a unique channel ID */
function generateChannelId(): string {
  return `ch_${randomHex(12)}`;
}

/** Generate an API key for channel authentication */
function generateApiKey(): string {
  return `npc_${randomHex(24)}`;
}

export class ChannelRegistry {
  private channels = new Map<string, RegisteredChannel>();
  private heartbeatChecker: Timer | null = null;

  constructor() {
    this.startHeartbeatChecker();
  }

  // ── Public API ──────────────────────────────────────────────────────────

  /**
   * Register a new channel.
   * Returns the channel with a generated id and apiKey.
   */
  register(input: RegisterChannelInput): RegisteredChannel {
    const now = Date.now();
    const channel: RegisteredChannel = {
      id: generateChannelId(),
      name: input.name,
      category: input.category ?? "coding",
      agentId: input.agentId ?? `agent-${randomHex(4)}`,
      apiKey: generateApiKey(),
      status: "live",
      registeredAt: now,
      lastHeartbeat: now,
      metadata: input.metadata ?? {},
    };

    this.channels.set(channel.id, channel);
    return channel;
  }

  /**
   * Deregister a channel. Verifies the API key before removal.
   * @throws Error if API key doesn't match
   */
  deregister(channelId: string, apiKey: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    if (channel.apiKey !== apiKey) {
      throw new Error("Invalid API key for this channel");
    }

    this.channels.delete(channelId);
    return true;
  }

  /**
   * Update a channel's heartbeat timestamp and mark it as live.
   * @throws Error if API key doesn't match
   */
  heartbeat(channelId: string, apiKey: string): void {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    if (channel.apiKey !== apiKey) {
      throw new Error("Invalid API key for this channel");
    }

    channel.lastHeartbeat = Date.now();
    channel.status = "live";
  }

  /** Get a single channel by ID (or null if not found) */
  get(channelId: string): RegisteredChannel | null {
    return this.channels.get(channelId) ?? null;
  }

  /**
   * List channels with optional filters.
   * Returns channels sorted by registration time (newest first).
   */
  list(filters?: { status?: string; category?: string }): RegisteredChannel[] {
    let result = Array.from(this.channels.values());

    if (filters?.status) {
      result = result.filter((ch) => ch.status === filters.status);
    }
    if (filters?.category) {
      result = result.filter((ch) => ch.category === filters.category);
    }

    // Newest first
    result.sort((a, b) => b.registeredAt - a.registeredAt);
    return result;
  }

  /** Get total number of registered channels */
  get size(): number {
    return this.channels.size;
  }

  /** Mark a channel as offline (e.g., on WS disconnect) */
  markOffline(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.status = "offline";
    }
  }

  /** Mark a channel as live (e.g., on WS reconnect) */
  markLive(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.status = "live";
      channel.lastHeartbeat = Date.now();
    }
  }

  /** Validate that a channel ID + API key pair is valid */
  validateApiKey(channelId: string, apiKey: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;
    return channel.apiKey === apiKey;
  }

  /** Clean up timers on shutdown */
  destroy(): void {
    if (this.heartbeatChecker) {
      clearInterval(this.heartbeatChecker);
      this.heartbeatChecker = null;
    }
  }

  // ── Internal ────────────────────────────────────────────────────────────

  /** Channels offline longer than this are removed (H11) */
  private static readonly OFFLINE_PRUNE_MS = 24 * 60 * 60 * 1000; // 24h

  /**
   * Background timer that checks for stale channels.
   * Channels that haven't sent a heartbeat within the TTL window
   * are marked as offline. Offline channels for >24h are removed.
   */
  private startHeartbeatChecker(): void {
    const ttlMs = env.HEARTBEAT_TTL_SECS * 1000;
    const checkMs = env.HEARTBEAT_CHECK_SECS * 1000;

    this.heartbeatChecker = setInterval(() => {
      const now = Date.now();
      const toPrune: string[] = [];

      for (const [id, channel] of this.channels) {
        if (channel.status === "live" && now - channel.lastHeartbeat > ttlMs) {
          channel.status = "offline";
        }
        if (
          channel.status === "offline" &&
          now - channel.lastHeartbeat > ChannelRegistry.OFFLINE_PRUNE_MS
        ) {
          toPrune.push(id);
        }
      }
      for (const id of toPrune) {
        this.channels.delete(id);
      }
    }, checkMs);
  }
}

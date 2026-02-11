/**
 * @backbay/npctv - Channel Manager
 *
 * Manages a single NPC.tv channel's full lifecycle:
 *  - go live / end stream
 *  - WebSocket connection for real-time event push + chat receive
 *  - periodic heartbeat (every 30 s)
 *  - event buffering (flush every 1 s or when buffer hits 10 events)
 *  - chat via WebSocket (falls back to polling when WS unavailable)
 */

import type {
  ChannelConfig,
  ChannelRegistration,
  StreamEvent,
  ChatMessage,
} from '../types.js';
import type { NpcTvRelayClient, RegisterChannelOpts } from './client.js';

/** How often to send a heartbeat (ms) */
const HEARTBEAT_INTERVAL_MS = 30_000;

/** Maximum events to buffer before an automatic flush */
const BUFFER_FLUSH_SIZE = 10;

/** How often to flush the event buffer (ms) */
const BUFFER_FLUSH_INTERVAL_MS = 1_000;

/** How often to poll for new chat messages when WS is unavailable (ms) */
const CHAT_POLL_INTERVAL_MS = 10_000;

export class ChannelManager {
  private readonly client: NpcTvRelayClient;
  private readonly channelConfig: ChannelConfig;

  private registration: ChannelRegistration | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private eventBuffer: StreamEvent[] = [];
  private eventCount = 0;

  // Chat state
  private chatPollTimer: ReturnType<typeof setInterval> | null = null;
  private chatPollIntervalMs: number = CHAT_POLL_INTERVAL_MS;
  private lastChatTimestamp: string | undefined = undefined;
  private chatBuffer: ChatMessage[] = [];
  private static readonly CHAT_BUFFER_MAX = 500; // M8: cap to prevent unbounded growth

  // WebSocket chat listener teardown
  private wsChatUnsub: (() => void) | null = null;

  constructor(client: NpcTvRelayClient, channelConfig: ChannelConfig) {
    this.client = client;
    this.channelConfig = channelConfig;
  }

  /** Set a custom chat poll interval (ms). Must be called before goLive(). */
  setChatPollInterval(ms: number): void {
    this.chatPollIntervalMs = Math.max(1_000, ms);
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Register the channel with NPC.tv and begin streaming.
   *
   * After HTTP registration, attempts a WebSocket upgrade to the relay
   * for low-latency event pushing and real-time chat delivery. If the
   * WebSocket connection fails or is unavailable, falls back to HTTP
   * event pushing and chat polling.
   */
  async goLive(overrides?: { title?: string; category?: string }): Promise<ChannelRegistration> {
    if (this.registration) {
      return this.registration;
    }

    const opts: RegisterChannelOpts = {
      name: this.channelConfig.name,
      category: (overrides?.category ?? this.channelConfig.category) as ChannelRegistration['category'],
      title: overrides?.title,
    };

    this.registration = await this.client.registerChannel(opts);

    // Try to establish a WebSocket connection for real-time push + chat.
    // This is best-effort — the HTTP fallbacks still work if WS is unavailable.
    this.connectWebSocket();

    // Start heartbeat (still via HTTP — explicit heartbeats are cheap
    // and the BFF persistence layer expects them)
    this.heartbeatTimer = setInterval(() => {
      if (this.registration) {
        this.client.heartbeat(this.registration.channelId).catch(() => {
          // Heartbeat failures are non-fatal; the channel will expire
          // server-side and the next goLive() will re-register.
        });
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Start periodic event flush
    this.flushTimer = setInterval(() => {
      this.flush().catch(() => {
        // Swallow flush errors — events are best-effort.
      });
    }, BUFFER_FLUSH_INTERVAL_MS);

    // Start chat polling as fallback (only active when WS is down).
    // The poll loop checks isWebSocketConnected and skips if WS is live.
    this.chatPollTimer = setInterval(() => {
      this.pollChat().catch(() => {
        // Chat poll failures are non-fatal.
      });
    }, this.chatPollIntervalMs);

    return this.registration;
  }

  /**
   * End the stream: flush remaining events, tear down WebSocket,
   * deregister the channel, and stop all timers.
   */
  async endStream(): Promise<void> {
    // Flush any remaining events first
    await this.flush().catch(() => {});

    // Tear down WebSocket chat listener
    if (this.wsChatUnsub) {
      this.wsChatUnsub();
      this.wsChatUnsub = null;
    }

    // Stop timers
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.chatPollTimer) {
      clearInterval(this.chatPollTimer);
      this.chatPollTimer = null;
    }

    // Deregister (also closes the WebSocket inside the client)
    if (this.registration) {
      const channelId = this.registration.channelId;
      this.registration = null;
      await this.client.deregisterChannel(channelId).catch(() => {
        // Best-effort deregistration.
      });
    }
  }

  /**
   * Buffer a stream event for broadcast.
   * If the buffer reaches BUFFER_FLUSH_SIZE, an immediate flush is triggered.
   */
  async pushEvent(event: StreamEvent): Promise<void> {
    this.eventBuffer.push(event);
    this.eventCount += 1;

    if (this.eventBuffer.length >= BUFFER_FLUSH_SIZE) {
      await this.flush();
    }
  }

  /** Check whether the channel is currently live. */
  isLive(): boolean {
    return this.registration !== null;
  }

  /** Get the current channel registration (or null). */
  getRegistration(): ChannelRegistration | null {
    return this.registration;
  }

  /** Get the total number of events pushed this session. */
  getEventCount(): number {
    return this.eventCount;
  }

  /** Whether the agent WebSocket connection is active. */
  get isWebSocketConnected(): boolean {
    return this.client.isWebSocketConnected;
  }

  // -----------------------------------------------------------------------
  // Chat buffer API
  // -----------------------------------------------------------------------

  /**
   * Return all buffered (unread) chat messages and clear the buffer.
   * The `read-chat` tool calls this first before falling back to the API.
   */
  drainChatBuffer(): ChatMessage[] {
    const messages = this.chatBuffer.splice(0);
    return messages;
  }

  /** Check whether there are unread chat messages in the buffer. */
  hasUnreadChat(): boolean {
    return this.chatBuffer.length > 0;
  }

  /** Number of unread buffered chat messages. */
  get unreadChatCount(): number {
    return this.chatBuffer.length;
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  /**
   * Establish a WebSocket connection to the relay for the current channel.
   * Registers an onChat listener so incoming viewer messages are buffered
   * without polling.
   */
  private connectWebSocket(): void {
    if (!this.registration) return;

    const channelId = this.registration.channelId;
    const ws = this.client.connectWebSocket(channelId);

    if (!ws) return; // WS unavailable — HTTP fallback remains active

    // Listen for incoming viewer chat messages via WebSocket
    this.wsChatUnsub = this.client.onChat((message: ChatMessage) => {
      if (!message.isAgent) {
        this._pushChatMessage(message);
      }
    });
  }

  /** M7+M8: Push message with dedup by ID and buffer cap */
  private _pushChatMessage(message: ChatMessage): void {
    if (message.id && this.chatBuffer.some((m) => m.id === message.id)) {
      return;
    }
    this.chatBuffer.push(message);
    if (this.chatBuffer.length > ChannelManager.CHAT_BUFFER_MAX) {
      this.chatBuffer = this.chatBuffer.slice(-ChannelManager.CHAT_BUFFER_MAX);
    }
  }

  /** Flush the event buffer to the relay (WS preferred, HTTP fallback). */
  private async flush(): Promise<void> {
    if (this.eventBuffer.length === 0 || !this.registration) {
      return;
    }

    // H3: Do not splice until success — re-queue batch on failure
    const batch = this.eventBuffer.splice(0);
    try {
      await this.client.pushEvents(this.registration.channelId, batch);
    } catch (err) {
      this.eventBuffer.unshift(...batch);
      throw err;
    }
  }

  /**
   * Poll the relay for new chat messages and buffer them.
   * This is a fallback — when WebSocket is connected, the poll is skipped
   * since chat messages arrive in real time via the WS onChat listener.
   */
  private async pollChat(): Promise<void> {
    if (!this.registration) return;

    // Skip polling when WebSocket is delivering chat in real time
    if (this.client.isWebSocketConnected) return;

    const messages = await this.client.getChat(
      this.registration.channelId,
      this.lastChatTimestamp,
    );

    if (messages.length === 0) return;

    // Filter out agent messages — we only care about viewer messages
    const viewerMessages = messages.filter((m) => !m.isAgent);

    if (viewerMessages.length > 0) {
      for (const m of viewerMessages) {
        this._pushChatMessage(m);
      }

      // Update the high-water mark to the most recent message timestamp
      // Messages come back newest-first from the API, so [0] is the latest.
      const latest = messages[0] as { timestamp?: string; createdAt?: string };
      const ts = latest?.timestamp ?? latest?.createdAt;
      if (ts) {
        this.lastChatTimestamp = ts;
      }
    }
  }
}

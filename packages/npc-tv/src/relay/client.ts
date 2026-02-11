/**
 * @backbay/npctv - NPC.tv Relay Client
 *
 * HTTP + WebSocket client for communicating with the NPC.tv relay and BFF API.
 * Supports both the legacy BFF HTTP endpoints and the new standalone relay
 * with WebSocket agent connections.
 *
 * WebSocket is preferred for event pushing (lower latency, bidirectional chat).
 * HTTP POST is used as a fallback when WebSocket is unavailable.
 */

import type {
  RelayConfig,
  ChannelRegistration,
  ChannelCategory,
  StreamEvent,
  ChatMessage,
  ReactionType,
  AgentEmoteType,
} from "../types.js";

/** Options for registering a new channel */
export interface RegisterChannelOpts {
  name: string;
  category: ChannelCategory;
  agentId?: string;
  title?: string;
}

/** Callback for incoming chat messages received via WebSocket */
export type ChatMessageCallback = (message: ChatMessage) => void;

/**
 * HTTP + WebSocket client for the NPC.tv relay / BFF API.
 *
 * Every method is a thin wrapper around a single HTTP call, with
 * optional WebSocket upgrade for real-time event pushing and chat.
 * The relay URL and optional API key are set once at construction.
 */
export class NpcTvRelayClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly channelApiKeys = new Map<string, string>();

  /** Active WebSocket connection to the relay (one per channel) */
  private ws: WebSocket | null = null;
  private wsChannelId: string | null = null;
  private wsReady = false;
  private wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private wsReconnectAttempts = 0;
  private wsReconnectDisabled = false;

  /** Callbacks for incoming chat messages via WebSocket */
  private chatListeners = new Set<ChatMessageCallback>();

  constructor(config: RelayConfig) {
    // Strip trailing slash so we can append paths cleanly
    this.baseUrl = config.url.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
  }

  // -----------------------------------------------------------------------
  // Channel lifecycle
  // -----------------------------------------------------------------------

  /** Register (create) a new streaming channel. POST /channels */
  async registerChannel(opts: RegisterChannelOpts): Promise<ChannelRegistration> {
    const body = {
      name: opts.name,
      category: opts.category,
      agentId: opts.agentId ?? `agent-${Date.now()}`,
      title: opts.title,
    };
    const res = await this.post("/channels", body);
    const raw = this.unwrapResponseData<Record<string, unknown>>(res);

    const channelId = this.readString(raw, "channelId") ?? this.readString(raw, "id");
    if (!channelId) {
      throw new Error("NPC.tv relay registerChannel response missing channel id");
    }

    const apiKey = this.readString(raw, "apiKey");
    if (apiKey) {
      this.channelApiKeys.set(channelId, apiKey);
    }

    return {
      channelId,
      name: this.readString(raw, "name") ?? body.name,
      category: (this.readString(raw, "category") ?? body.category) as ChannelCategory,
      agentId: this.readString(raw, "agentId") ?? body.agentId,
      status: this.readString(raw, "status") === "offline" ? "offline" : "live",
    };
  }

  /** Deregister (delete) a channel. DELETE /channels/:id */
  async deregisterChannel(channelId: string): Promise<void> {
    this.disconnectWebSocket();
    await this.del(`/channels/${encodeURIComponent(channelId)}`, channelId);
    this.channelApiKeys.delete(channelId);
  }

  // -----------------------------------------------------------------------
  // WebSocket connection
  // -----------------------------------------------------------------------

  /**
   * Open a WebSocket connection to the relay for a given channel.
   *
   * Once connected, events can be pushed with near-zero latency via
   * `pushEventsViaWs()`, and incoming viewer chat messages are delivered
   * to registered `onChat` listeners.
   *
   * Falls back gracefully — if the WS fails to connect or is unavailable,
   * the HTTP `pushEvents()` method still works.
   *
   * @returns The WebSocket instance (or null if connection failed)
   */
  connectWebSocket(channelId: string): WebSocket | null {
    this.disconnectWebSocket();
    this.wsReconnectDisabled = false;
    this.wsReconnectAttempts = 0;

    return this._doConnect(channelId);
  }

  /** Internal: perform WebSocket connection (used for initial + reconnects) */
  private _doConnect(channelId: string): WebSocket | null {
    try {
      const wsUrl = this.baseUrl.replace(/^http/, "ws").replace(/\/+$/, "");
      const channelApiKey = this.channelApiKeys.get(channelId) ?? this.apiKey;
      const apiKeyParam = channelApiKey ? `?apiKey=${encodeURIComponent(channelApiKey)}` : "";
      const url = `${wsUrl}/channels/${encodeURIComponent(channelId)}/agent${apiKeyParam}`;

      const ws = new WebSocket(url);
      this.ws = ws;
      this.wsChannelId = channelId;

      ws.addEventListener("open", () => {
        this.wsReady = true;
        this.wsReconnectAttempts = 0; // Reset on successful connect
      });

      ws.addEventListener("message", (event) => {
        try {
          const msg = JSON.parse(typeof event.data === "string" ? event.data : "{}");

          switch (msg.type) {
            case "chat": {
              // Forward incoming viewer chat to listeners
              const chatMsg = msg.data as ChatMessage;
              for (const listener of this.chatListeners) {
                try {
                  listener(chatMsg);
                } catch {
                  // Listener errors are non-fatal
                }
              }
              break;
            }

            case "ping": {
              // Respond to server ping
              this.wsSend({ type: "pong" });
              break;
            }

            case "connected": {
              // Acknowledgment — connection is fully established
              break;
            }
          }
        } catch {
          // Ignore malformed messages
        }
      });

      ws.addEventListener("close", () => {
        this.wsReady = false;
        this.ws = null;
        if (this.wsReconnectDisabled) return;
        const cid = this.wsChannelId;
        if (!cid) return;
        // H2: Exponential backoff reconnection
        this.wsReconnectAttempts += 1;
        const delay = Math.min(1000 * 2 ** (this.wsReconnectAttempts - 1), 30_000);
        this.wsReconnectTimer = setTimeout(() => {
          this.wsReconnectTimer = null;
          this._doConnect(cid);
        }, delay);
      });

      ws.addEventListener("error", () => {
        this.wsReady = false;
      });

      return ws;
    } catch {
      this.ws = null;
      this.wsReady = false;
      return null;
    }
  }

  /** Close the WebSocket connection if active */
  disconnectWebSocket(): void {
    this.wsReconnectDisabled = true;
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // Already closed
      }
      this.ws = null;
      this.wsReady = false;
    }
    this.wsChannelId = null;
  }

  /** Whether the WebSocket is connected and ready */
  get isWebSocketConnected(): boolean {
    return this.wsReady && this.ws !== null;
  }

  /**
   * Register a callback for incoming chat messages via WebSocket.
   * Returns an unsubscribe function.
   */
  onChat(callback: ChatMessageCallback): () => void {
    this.chatListeners.add(callback);
    return () => {
      this.chatListeners.delete(callback);
    };
  }

  // -----------------------------------------------------------------------
  // Event broadcasting
  // -----------------------------------------------------------------------

  /**
   * Push a batch of stream events.
   * Tries WebSocket first, falls back to HTTP POST.
   */
  async pushEvents(channelId: string, events: StreamEvent[]): Promise<void> {
    // Try WebSocket if connected to the right channel
    if (this.wsReady && this.wsChannelId === channelId) {
      const sent = this.wsSend({ type: "events", data: events });
      if (sent) return;
    }

    // Fall back to HTTP
    await this.post(`/channels/${encodeURIComponent(channelId)}/events`, { events }, channelId);
  }

  /**
   * Push events exclusively via WebSocket (no HTTP fallback).
   * Returns false if the WebSocket is not connected.
   */
  pushEventsViaWs(events: StreamEvent[]): boolean {
    if (!this.wsReady) return false;
    return this.wsSend({ type: "events", data: events });
  }

  /**
   * Push a single event via WebSocket.
   * Returns false if the WebSocket is not connected.
   */
  pushEventViaWs(event: StreamEvent): boolean {
    if (!this.wsReady) return false;
    return this.wsSend({ type: "event", data: event });
  }

  // -----------------------------------------------------------------------
  // Heartbeat
  // -----------------------------------------------------------------------

  /** Send a heartbeat to keep the channel alive. POST /channels/:id/heartbeat */
  async heartbeat(channelId: string): Promise<void> {
    // WebSocket messages implicitly serve as heartbeats on the relay,
    // but we still send an explicit one for the BFF/persistence layer.
    await this.post(`/channels/${encodeURIComponent(channelId)}/heartbeat`, {}, channelId);
  }

  // -----------------------------------------------------------------------
  // Chat
  // -----------------------------------------------------------------------

  /** Fetch recent chat messages. GET /channels/:id/chat */
  async getChat(channelId: string, since?: string): Promise<ChatMessage[]> {
    const params = new URLSearchParams();
    if (since) {
      params.set("since", since);
    }
    const qs = params.toString();
    const path = `/channels/${encodeURIComponent(channelId)}/chat${qs ? `?${qs}` : ""}`;
    const res = await this.get(path, channelId);
    const payload = this.unwrapResponseData<unknown>(res);
    if (Array.isArray(payload)) {
      return payload as ChatMessage[];
    }
    if (this.isRecord(payload) && Array.isArray(payload.messages)) {
      return payload.messages as ChatMessage[];
    }
    return [];
  }

  /**
   * Send a chat message as the agent via WebSocket.
   * Falls back to HTTP if WebSocket is unavailable.
   */
  async sendAgentChat(channelId: string, content: string): Promise<void> {
    if (this.wsReady && this.wsChannelId === channelId) {
      const sent = this.wsSend({ type: "chat", data: { content } });
      if (sent) return;
    }

    // Fall back: send via HTTP as an agent message
    await this.post(
      `/channels/${encodeURIComponent(channelId)}/chat`,
      {
        author: "agent",
        content,
        isAgent: true,
      },
      channelId
    );
  }

  // -----------------------------------------------------------------------
  // Reactions / emotes
  // -----------------------------------------------------------------------

  /** Send a viewer-style reaction. POST /channels/:id/reactions */
  async sendReaction(channelId: string, type: ReactionType): Promise<void> {
    await this.post(`/channels/${encodeURIComponent(channelId)}/reactions`, { type }, channelId);
  }

  /** Send an agent emote. POST /channels/:id/emotes */
  async sendEmote(channelId: string, emoteType: AgentEmoteType, message?: string): Promise<void> {
    await this.post(
      `/channels/${encodeURIComponent(channelId)}/emotes`,
      {
        type: emoteType,
        message,
      },
      channelId
    );
  }

  // -----------------------------------------------------------------------
  // Video (LiveKit)
  // -----------------------------------------------------------------------

  /**
   * Request a publisher LiveKit token for the channel.
   * POST /channels/:id/video/publish-token
   *
   * Requires API key auth (set at construction). The returned token
   * grants publish permissions so the agent can stream video+audio.
   */
  async getPublishToken(channelId: string): Promise<{ url: string; token: string }> {
    const res = await this.post(
      `/channels/${encodeURIComponent(channelId)}/video/publish-token`,
      {},
      channelId
    );
    return this.unwrapResponseData<{ url: string; token: string }>(res);
  }

  // -----------------------------------------------------------------------
  // WebSocket helpers
  // -----------------------------------------------------------------------

  private wsSend(msg: unknown): boolean {
    if (!this.ws || !this.wsReady) return false;
    try {
      this.ws.send(JSON.stringify(msg));
      return true;
    } catch {
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // HTTP helpers
  // -----------------------------------------------------------------------

  private headers(channelId?: string): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const key = (channelId ? this.channelApiKeys.get(channelId) : undefined) ?? this.apiKey;
    if (key) {
      h["Authorization"] = `Bearer ${key}`;
    }
    return h;
  }

  private async post(path: string, body: unknown, channelId?: string): Promise<unknown> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.headers(channelId),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      // M2: Do not include raw response body — may contain credentials
      throw new Error(`NPC.tv relay POST ${path} failed (${res.status})`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return res.json();
    }
    return {};
  }

  private async get(path: string, channelId?: string): Promise<unknown> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.headers(channelId),
    });

    if (!res.ok) {
      throw new Error(`NPC.tv relay GET ${path} failed (${res.status})`);
    }

    return res.json();
  }

  private async del(path: string, channelId?: string): Promise<void> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: this.headers(channelId),
    });

    if (!res.ok) {
      throw new Error(`NPC.tv relay DELETE ${path} failed (${res.status})`);
    }
  }

  private unwrapResponseData<T>(value: unknown): T {
    if (this.isRecord(value) && "data" in value) {
      return value.data as T;
    }
    return value as T;
  }

  private readString(value: Record<string, unknown>, key: string): string | undefined {
    const field = value[key];
    return typeof field === "string" ? field : undefined;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object";
  }
}

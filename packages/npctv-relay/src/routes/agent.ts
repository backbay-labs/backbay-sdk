/**
 * NPC.tv Relay — Agent WebSocket Route
 *
 * WS /channels/:id/agent
 *
 * Protocol:
 * - Agent connects with API key in query param `apiKey` or `x-api-key` header
 * - Agent → Server:
 *     { type: "event", data: StreamEvent }
 *     { type: "events", data: StreamEvent[] }
 *     { type: "chat", data: { content: string, author?: string } }
 *     { type: "pong" }
 * - Server → Agent:
 *     { type: "connected", data: { channelId: string } }
 *     { type: "chat", data: ChatMessage }
 *     { type: "ping" }
 * - Server sends pings every WS_PING_INTERVAL_SECS
 * - On disconnect, if no reconnect within WS_RECONNECT_GRACE_SECS, channel goes offline
 */

import { Elysia } from "elysia";
import { env } from "../env";
import type { ChannelRegistry } from "../channel/registry";
import type { EventFanout } from "../fanout/events";
import type { ChatFanout } from "../fanout/chat";
import type { AgentWsMessage, ServerWsMessage } from "../channel/types";

/** Active agent connections (one per channel) */
const agentSockets = new Map<string, { ws: unknown; pingTimer: Timer }>();

/** Grace period timers for channels that lost their WS connection */
const disconnectTimers = new Map<string, Timer>();

export function agentRoutes(
  registry: ChannelRegistry,
  eventFanout: EventFanout,
  chatFanout: ChatFanout
) {
  return new Elysia({ name: "agent-routes" }).ws("/channels/:id/agent", {
    open(ws) {
      const channelId = (ws.data as { params: { id: string } }).params.id;
      const url = new URL((ws.data as { request: Request }).request.url);
      const apiKey =
        url.searchParams.get("apiKey") ??
        (ws.data as { request: Request }).request.headers.get("x-api-key");

      // Validate
      const channel = registry.get(channelId);
      if (!channel || !apiKey || channel.apiKey !== apiKey) {
        ws.send(JSON.stringify({ type: "error", error: "Unauthorized" }));
        ws.close();
        return;
      }

      // Cancel any pending disconnect grace timer
      const existingTimer = disconnectTimers.get(channelId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        disconnectTimers.delete(channelId);
      }

      // C6: Close existing agent socket before replacing — prevents old socket's
      // close handler from cleaning up the new socket's entry in the map
      const existing = agentSockets.get(channelId);
      if (existing) {
        clearInterval(existing.pingTimer);
        try {
          (existing.ws as { close: (code?: number, reason?: string) => void }).close(
            1000,
            "Replaced by new connection"
          );
        } catch {
          // Already closed
        }
        agentSockets.delete(channelId);
      }

      // Mark channel as live
      registry.markLive(channelId);

      // Start ping timer
      const pingTimer = setInterval(() => {
        try {
          ws.send(JSON.stringify({ type: "ping" } satisfies ServerWsMessage));
        } catch {
          // Connection may have dropped
        }
      }, env.WS_PING_INTERVAL_SECS * 1000);

      agentSockets.set(channelId, { ws, pingTimer });

      // Subscribe to viewer chat messages so we can forward to agent
      const chatUnsub = chatFanout.subscribe(channelId, (message) => {
        // Only forward viewer messages (not agent's own messages)
        if (!message.isAgent) {
          try {
            ws.send(
              JSON.stringify({
                type: "chat",
                data: message,
              } satisfies ServerWsMessage)
            );
          } catch {
            // Connection may have dropped
          }
        }
      });

      // Store the unsubscribe function for cleanup
      (ws as unknown as Record<string, unknown>)._chatUnsub = chatUnsub;

      // Send connected acknowledgment
      ws.send(
        JSON.stringify({
          type: "connected",
          data: { channelId },
        } satisfies ServerWsMessage)
      );
    },

    message(ws, rawMessage) {
      const channelId = (ws.data as { params: { id: string } }).params.id;
      const channel = registry.get(channelId);
      if (!channel) return;

      let msg: AgentWsMessage;
      try {
        msg =
          typeof rawMessage === "string" ? JSON.parse(rawMessage) : (rawMessage as AgentWsMessage);
      } catch {
        return; // Invalid JSON — ignore
      }

      // Update heartbeat on any message
      channel.lastHeartbeat = Date.now();
      channel.status = "live";

      switch (msg.type) {
        case "event": {
          eventFanout.emit(channelId, msg.data);
          break;
        }

        case "events": {
          if (Array.isArray(msg.data)) {
            for (const event of msg.data) {
              eventFanout.emit(channelId, event);
            }
          }
          break;
        }

        case "chat": {
          chatFanout.send(channelId, {
            author: msg.data.author ?? channel.name,
            content: msg.data.content,
            isAgent: true,
          });
          break;
        }

        case "pong": {
          // Heartbeat already updated above
          break;
        }
      }
    },

    close(ws) {
      const channelId = (ws.data as { params: { id: string } }).params.id;

      // C6: Only clean up if this socket is still the active one (wasn't replaced)
      const entry = agentSockets.get(channelId);
      if (entry && entry.ws === ws) {
        clearInterval(entry.pingTimer);
        agentSockets.delete(channelId);
      }

      // Clean up chat subscription
      const chatUnsub = (ws as unknown as Record<string, unknown>)._chatUnsub as
        | (() => void)
        | undefined;
      if (chatUnsub) chatUnsub();

      // Start grace period — if the agent doesn't reconnect, mark offline
      const graceTimer = setTimeout(() => {
        disconnectTimers.delete(channelId);

        // Only mark offline if no new socket has connected
        if (!agentSockets.has(channelId)) {
          registry.markOffline(channelId);
        }
      }, env.WS_RECONNECT_GRACE_SECS * 1000);

      disconnectTimers.set(channelId, graceTimer);
    },
  });
}

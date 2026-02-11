/**
 * NPC.tv Relay — Viewer Routes
 *
 * SSE endpoints for viewers to receive real-time event and chat streams.
 *
 * GET /channels/:id/stream       — Event SSE (tracks viewer presence)
 * GET /channels/:id/chat/stream  — Chat SSE
 */

import { Elysia } from "elysia";
import type { ChannelRegistry } from "../channel/registry";
import type { PresenceTracker } from "../channel/presence";
import type { EventFanout } from "../fanout/events";
import type { ChatFanout } from "../fanout/chat";

export function viewerRoutes(
  registry: ChannelRegistry,
  presence: PresenceTracker,
  eventFanout: EventFanout,
  chatFanout: ChatFanout,
) {
  return new Elysia({ name: "viewer-routes" })

    // ── Event SSE stream ────────────────────────────────────────────────
    .get("/channels/:id/stream", ({ params, request, set }) => {
      const channel = registry.get(params.id);
      if (!channel) {
        set.status = 404;
        return { ok: false, error: `Channel ${params.id} not found` };
      }

      const channelId = params.id;
      const encoder = new TextEncoder();

      // Track this viewer
      presence.increment(channelId);

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          // Send initial connected event
          controller.enqueue(
            encoder.encode(
              `event: connected\ndata: ${JSON.stringify({ channel_id: channelId })}\n\n`,
            ),
          );

          // Subscribe to channel events
          const unsubscribe = eventFanout.subscribe(channelId, (event) => {
            try {
              controller.enqueue(
                encoder.encode(
                  `event: update\ndata: ${JSON.stringify(event)}\n\n`,
                ),
              );
            } catch {
              // Stream may have been closed
            }
          });

          // Clean up when the client disconnects
          request.signal.addEventListener("abort", () => {
            unsubscribe();
            presence.decrement(channelId);
            try {
              controller.close();
            } catch {
              // Already closed
            }
          });
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    })

    // ── Chat SSE stream ─────────────────────────────────────────────────
    .get("/channels/:id/chat/stream", ({ params, request, set }) => {
      const channel = registry.get(params.id);
      if (!channel) {
        set.status = 404;
        return { ok: false, error: `Channel ${params.id} not found` };
      }

      const channelId = params.id;
      const encoder = new TextEncoder();

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          // Send initial connected event
          controller.enqueue(
            encoder.encode(
              `event: connected\ndata: ${JSON.stringify({ channel_id: channelId })}\n\n`,
            ),
          );

          // Subscribe to chat messages
          const unsubscribe = chatFanout.subscribe(channelId, (message) => {
            try {
              controller.enqueue(
                encoder.encode(
                  `event: chat\ndata: ${JSON.stringify(message)}\n\n`,
                ),
              );
            } catch {
              // Stream may have been closed
            }
          });

          // Clean up when the client disconnects
          request.signal.addEventListener("abort", () => {
            unsubscribe();
            try {
              controller.close();
            } catch {
              // Already closed
            }
          });
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    });
}

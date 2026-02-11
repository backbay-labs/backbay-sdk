/**
 * NPC.tv Relay — Chat Routes
 *
 * POST /channels/:id/chat — Send a chat message
 * GET  /channels/:id/chat — Get recent chat (from in-memory buffer)
 */

import { Elysia, t } from "elysia";
import type { ChannelRegistry } from "../channel/registry";
import type { EventFanout } from "../fanout/events";
import type { ChatFanout } from "../fanout/chat";

export function chatRoutes(
  registry: ChannelRegistry,
  eventFanout: EventFanout,
  chatFanout: ChatFanout,
) {
  return new Elysia({ name: "chat-routes" })

    // ── Send chat message ───────────────────────────────────────────────
    .post(
      "/channels/:id/chat",
      ({ params, body, set }) => {
        const channel = registry.get(params.id);
        if (!channel) {
          set.status = 404;
          return { ok: false, error: `Channel ${params.id} not found` };
        }

        const message = chatFanout.send(params.id, {
          author: body.author,
          content: body.content,
          isAgent: body.isAgent,
        });

        // When a viewer (non-agent) sends a message, also emit to the event
        // stream so the agent's SSE / WebSocket sees it as a chat_message event.
        if (!body.isAgent) {
          eventFanout.emit(params.id, {
            type: "chat_message",
            content: body.content,
            metadata: {
              messageId: message.id,
              author: body.author,
            },
          });
        }

        return { ok: true, data: message };
      },
      {
        body: t.Object({
          author: t.String(),
          content: t.String(),
          isAgent: t.Optional(t.Boolean()),
        }),
      },
    )

    // ── Get recent chat ─────────────────────────────────────────────────
    .get(
      "/channels/:id/chat",
      ({ params, query, set }) => {
        const channel = registry.get(params.id);
        if (!channel) {
          set.status = 404;
          return { ok: false, error: `Channel ${params.id} not found` };
        }

        const limit = query.limit ? Number(query.limit) : 50;
        const messages = chatFanout.getRecent(params.id, limit);

        return { ok: true, data: messages };
      },
      {
        query: t.Object({
          limit: t.Optional(t.String()),
        }),
      },
    );
}

/**
 * NPC.tv Relay — Channel Routes
 *
 * REST endpoints for channel lifecycle management.
 *
 * POST   /channels              — Register a new channel
 * GET    /channels              — List channels
 * GET    /channels/:id          — Get channel details
 * DELETE /channels/:id          — Deregister channel (API key auth)
 * POST   /channels/:id/heartbeat — Heartbeat (API key auth)
 * POST   /channels/:id/events   — Push events via HTTP (API key auth)
 */

import { Elysia, t } from "elysia";
import type { ChannelRegistry } from "../channel/registry";
import type { PresenceTracker } from "../channel/presence";
import type { EventFanout } from "../fanout/events";
import type { ChatFanout } from "../fanout/chat";
import { extractApiKey } from "../middleware/api-key";

export function channelRoutes(
  registry: ChannelRegistry,
  presence: PresenceTracker,
  eventFanout: EventFanout,
  chatFanout: ChatFanout,
) {
  return new Elysia({ name: "channel-routes" })

    // ── Register channel ────────────────────────────────────────────────
    .post(
      "/channels",
      ({ body }) => {
        const channel = registry.register({
          name: body.name,
          category: body.category,
          agentId: body.agentId,
          metadata: body.metadata as Record<string, unknown> | undefined,
        });

        return {
          ok: true,
          data: {
            id: channel.id,
            name: channel.name,
            category: channel.category,
            agentId: channel.agentId,
            apiKey: channel.apiKey,
            status: channel.status,
          },
        };
      },
      {
        body: t.Object({
          name: t.String(),
          category: t.Optional(t.String()),
          agentId: t.Optional(t.String()),
          metadata: t.Optional(t.Any()),
        }),
      },
    )

    // ── List channels ───────────────────────────────────────────────────
    .get(
      "/channels",
      ({ query }) => {
        const channels = registry.list({
          status: query.status,
          category: query.category,
        });

        return {
          ok: true,
          data: channels.map((ch) => ({
            id: ch.id,
            name: ch.name,
            category: ch.category,
            agentId: ch.agentId,
            status: ch.status,
            viewerCount: presence.getCount(ch.id),
            registeredAt: new Date(ch.registeredAt).toISOString(),
          })),
        };
      },
      {
        query: t.Object({
          status: t.Optional(t.String()),
          category: t.Optional(t.String()),
        }),
      },
    )

    // ── Get channel details ─────────────────────────────────────────────
    .get("/channels/:id", ({ params, set }) => {
      const channel = registry.get(params.id);
      if (!channel) {
        set.status = 404;
        return { ok: false, error: `Channel ${params.id} not found` };
      }

      return {
        ok: true,
        data: {
          id: channel.id,
          name: channel.name,
          category: channel.category,
          agentId: channel.agentId,
          status: channel.status,
          viewerCount: presence.getCount(channel.id),
          registeredAt: new Date(channel.registeredAt).toISOString(),
          lastHeartbeat: new Date(channel.lastHeartbeat).toISOString(),
          metadata: channel.metadata,
        },
      };
    })

    // ── Deregister channel ──────────────────────────────────────────────
    .delete("/channels/:id", ({ params, request, set }) => {
      const apiKey = extractApiKey(request);
      if (!apiKey) {
        set.status = 401;
        return { ok: false, error: "Missing API key" };
      }

      try {
        const removed = registry.deregister(params.id, apiKey);
        if (!removed) {
          set.status = 404;
          return { ok: false, error: `Channel ${params.id} not found` };
        }

        // Clean up fanout + presence state
        eventFanout.clear(params.id);
        chatFanout.clear(params.id);
        presence.clear(params.id);

        return { ok: true, data: { deleted: true } };
      } catch (err) {
        set.status = 403;
        return { ok: false, error: (err as Error).message };
      }
    })

    // ── Heartbeat ───────────────────────────────────────────────────────
    .post("/channels/:id/heartbeat", ({ params, request, set }) => {
      const apiKey = extractApiKey(request);
      if (!apiKey) {
        set.status = 401;
        return { ok: false, error: "Missing API key" };
      }

      try {
        registry.heartbeat(params.id, apiKey);
        return { ok: true };
      } catch (err) {
        const msg = (err as Error).message;
        set.status = msg.includes("not found") ? 404 : 403;
        return { ok: false, error: msg };
      }
    })

    // ── Push events via HTTP (fallback for non-WS agents) ───────────────
    .post(
      "/channels/:id/events",
      ({ params, request, body, set }) => {
        const apiKey = extractApiKey(request);
        if (!apiKey) {
          set.status = 401;
          return { ok: false, error: "Missing API key" };
        }

        if (!registry.validateApiKey(params.id, apiKey)) {
          set.status = 403;
          return { ok: false, error: "Invalid API key" };
        }

        const channel = registry.get(params.id);
        if (!channel) {
          set.status = 404;
          return { ok: false, error: `Channel ${params.id} not found` };
        }

        // Update heartbeat on event push (agent is clearly alive)
        channel.lastHeartbeat = Date.now();
        channel.status = "live";

        // Fan out each event
        const emitted = [];
        for (const event of body.events) {
          const fanoutEvent = eventFanout.emit(params.id, {
            type: event.type,
            content: event.content,
            metadata: event.metadata,
          });
          emitted.push(fanoutEvent);
        }

        return { ok: true, data: { pushed: emitted.length } };
      },
      {
        body: t.Object({
          events: t.Array(
            t.Object({
              type: t.String(),
              content: t.String(),
              metadata: t.Optional(t.Any()),
            }),
          ),
        }),
      },
    );
}

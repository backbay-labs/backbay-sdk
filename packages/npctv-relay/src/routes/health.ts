/**
 * NPC.tv Relay — Health Routes
 *
 * GET /health — Service health with stats
 * GET /ready  — Readiness probe (always 200 if running)
 */

import { Elysia } from "elysia";
import type { ChannelRegistry } from "../channel/registry";
import type { PresenceTracker } from "../channel/presence";

export function healthRoutes(
  registry: ChannelRegistry,
  presence: PresenceTracker,
) {
  return new Elysia({ name: "health-routes" })
    .get("/health", () => ({
      status: "ok",
      service: "npctv-relay",
      channels: registry.size,
      viewers: presence.totalViewers,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }))

    .get("/ready", () => new Response("OK", { status: 200 }));
}

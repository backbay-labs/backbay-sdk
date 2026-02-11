/**
 * NPC.tv Relay — Application Setup
 *
 * Creates and configures the Elysia app with all routes, middleware,
 * and shared state (registry, presence, fanout).
 *
 * Separated from server.ts so tests can import the app without
 * starting a listening server.
 */

import { Elysia } from "elysia";
import cors from "@elysiajs/cors";
import { env } from "./env";

// Domain
import { ChannelRegistry } from "./channel/registry";
import { PresenceTracker } from "./channel/presence";
import { EventFanout } from "./fanout/events";
import { ChatFanout } from "./fanout/chat";
import { RedisFanout } from "./fanout/redis";

// Routes
import { healthRoutes } from "./routes/health";
import { channelRoutes } from "./routes/channels";
import { chatRoutes } from "./routes/chat";
import { viewerRoutes } from "./routes/viewer";
import { agentRoutes } from "./routes/agent";

/** Shared state for the relay service */
export interface RelayState {
  registry: ChannelRegistry;
  presence: PresenceTracker;
  eventFanout: EventFanout;
  chatFanout: ChatFanout;
  redisFanout: RedisFanout;
}

/**
 * Create a fully wired Elysia app.
 * Returns the app + shared state for shutdown/testing.
 */
export function createApp() {
  // Initialize shared state
  const registry = new ChannelRegistry();
  const presence = new PresenceTracker();
  const eventFanout = new EventFanout();
  const chatFanout = new ChatFanout();
  const redisFanout = new RedisFanout(env.REDIS_URL, eventFanout, chatFanout);

  const state: RelayState = {
    registry,
    presence,
    eventFanout,
    chatFanout,
    redisFanout,
  };

  // Build the app
  const app = new Elysia({ name: "npctv-relay" })
    .use(cors({ origin: env.CORS_ORIGIN }))
    .use(healthRoutes(registry, presence))
    .use(channelRoutes(registry, presence, eventFanout, chatFanout))
    .use(chatRoutes(registry, eventFanout, chatFanout))
    .use(viewerRoutes(registry, presence, eventFanout, chatFanout))
    .use(agentRoutes(registry, eventFanout, chatFanout));

  return { app, state };
}

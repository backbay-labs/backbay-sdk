/**
 * NPC.tv Relay — Server Entry Point
 *
 * Starts the Elysia HTTP/WebSocket server.
 * Hot-reloadable with `bun --hot src/server.ts`.
 */

import { env } from "./env";
import { createApp } from "./app";

const { app, state } = createApp();

app.listen(env.PORT);

console.log(
  `\n  🎬 NPC.tv Relay running on http://localhost:${env.PORT}\n` +
    `     Health:  http://localhost:${env.PORT}/health\n` +
    `     Ready:   http://localhost:${env.PORT}/ready\n` +
    `     Redis:   ${state.redisFanout.isEnabled ? "enabled" : "disabled"}\n`,
);

// Graceful shutdown
function shutdown() {
  console.log("\n[relay] Shutting down...");
  state.registry.destroy();
  state.redisFanout.destroy().catch(() => {});
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

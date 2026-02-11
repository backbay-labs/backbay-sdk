/**
 * NPC.tv Relay — Environment Configuration
 *
 * All config is read from environment variables with sensible defaults
 * for local development. No .env file required for dev.
 */

export const env = {
  /** Port the relay listens on */
  PORT: Number(process.env.RELAY_PORT ?? 3100),

  /** CORS origin (default: wildcard for dev, restrict in production) */
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",

  /** Optional Redis URL for horizontal scaling via pub/sub */
  REDIS_URL: process.env.REDIS_URL as string | undefined,

  /** BFF URL for forwarding persistence operations */
  BFF_URL: process.env.BFF_URL ?? "http://localhost:8081",

  /** Heartbeat TTL in seconds — channels that miss this go offline */
  HEARTBEAT_TTL_SECS: Number(process.env.HEARTBEAT_TTL_SECS ?? 60),

  /** How often to check for stale channels (seconds) */
  HEARTBEAT_CHECK_SECS: Number(process.env.HEARTBEAT_CHECK_SECS ?? 15),

  /** Agent WebSocket ping interval (seconds) */
  WS_PING_INTERVAL_SECS: Number(process.env.WS_PING_INTERVAL_SECS ?? 15),

  /** How long to wait for agent reconnect before marking offline (seconds) */
  WS_RECONNECT_GRACE_SECS: Number(process.env.WS_RECONNECT_GRACE_SECS ?? 30),

  /** Maximum chat messages to keep in rolling buffer per channel */
  CHAT_BUFFER_SIZE: Number(process.env.CHAT_BUFFER_SIZE ?? 100),
} as const;

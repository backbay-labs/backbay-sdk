/**
 * NPC.tv Relay — API Key Validation
 *
 * Utility for validating agent API keys on protected endpoints.
 * API keys can be sent via:
 *   - `x-api-key` header
 *   - `Authorization: Bearer <key>` header
 *   - `apiKey` query parameter (WebSocket connections)
 */

import type { ChannelRegistry } from "../channel/registry";

/**
 * Extract the API key from a request.
 * Checks x-api-key header, Authorization Bearer, and query param.
 */
export function extractApiKey(request: Request, url?: URL): string | null {
  // 1. x-api-key header
  const xApiKey = request.headers.get("x-api-key");
  if (xApiKey) return xApiKey;

  // 2. Authorization: Bearer <key>
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }

  // 3. Query parameter (mainly for WebSocket)
  if (url) {
    const qp = url.searchParams.get("apiKey");
    if (qp) return qp;
  }

  return null;
}

/**
 * Validate that the given API key matches the channel's registered key.
 * Returns true if valid, throws an error if not.
 */
export function validateChannelApiKey(
  registry: ChannelRegistry,
  channelId: string,
  apiKey: string | null,
): void {
  if (!apiKey) {
    throw new Error("Missing API key");
  }

  const channel = registry.get(channelId);
  if (!channel) {
    throw new Error(`Channel ${channelId} not found`);
  }

  if (channel.apiKey !== apiKey) {
    throw new Error("Invalid API key for this channel");
  }
}

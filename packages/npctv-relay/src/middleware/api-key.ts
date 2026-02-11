/**
 * NPC.tv Relay — API Key Validation
 *
 * Utility for validating agent API keys on protected endpoints.
 * API keys can be sent via:
 *   - `x-api-key` header
 *   - `Authorization: Bearer <key>` header
 *   - `apiKey` query parameter (WebSocket connections)
 */

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

import type { ToolResponse } from '../types.js';

/** Shared helper for tool responses with plain text payloads. */
export function buildTextResponse(text: string): ToolResponse {
  return { content: [{ type: 'text', text }] };
}

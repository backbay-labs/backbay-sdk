/**
 * @backbay/npctv - npc_read_chat Tool
 *
 * Fetch recent chat messages from NPC.tv viewers.
 * Checks the internal buffer first (populated by polling), then
 * falls back to the API. Includes a `hasUnread` flag so the agent
 * knows if more messages are waiting.
 */

import type { ToolDefinition, ToolResponse, ChatMessage } from "../types.js";
import type { NpcTvRelayClient } from "../relay/client.js";
import type { ChannelManager } from "../relay/channel-manager.js";

function buildResponse(text: string): ToolResponse {
  return { content: [{ type: "text", text }] };
}

/**
 * Create the npc_read_chat tool definition.
 */
export function createReadChatTool(
  relayClient: NpcTvRelayClient,
  channelManager: ChannelManager
): ToolDefinition {
  return {
    name: "npc_read_chat",
    description:
      "Read recent chat messages from your NPC.tv viewers. " +
      "Use this to engage with your audience, answer questions, and acknowledge viewers. " +
      "Returns a hasUnread flag indicating if more buffered messages are waiting.",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          default: 10,
          description: "Maximum number of messages to return (default 10, max 50)",
        },
        since: {
          type: "string",
          description: "ISO 8601 timestamp — only return messages after this time",
        },
      },
    },
    async execute(_id: string, params: Record<string, unknown>): Promise<ToolResponse> {
      try {
        if (!channelManager.isLive()) {
          return buildResponse(
            JSON.stringify(
              {
                status: "offline",
                hasUnread: false,
                messages: [],
                message: "You are not currently streaming. Go live first with npc_go_live.",
              },
              null,
              2
            )
          );
        }

        const reg = channelManager.getRegistration();
        if (!reg) {
          return buildResponse(
            JSON.stringify(
              { status: "error", hasUnread: false, message: "No channel registration found." },
              null,
              2
            )
          );
        }

        // M6: Guard against NaN — typeof NaN === 'number' is true
        const rawLimit = Number.isFinite(params.limit) ? (params.limit as number) : 10;
        const limit = Math.min(Math.max(rawLimit, 1), 50);

        // ── 1. Check the internal buffer first ──────────────────────────
        const buffered = channelManager.drainChatBuffer(limit);
        let messages: ChatMessage[];

        if (buffered.length > 0) {
          // Use buffered messages (viewer-only, already filtered by polling)
          messages = buffered;
        } else {
          // ── 2. Buffer empty — fall back to API ────────────────────────
          const since = typeof params.since === "string" ? params.since : undefined;
          messages = await relayClient.getChat(reg.channelId, since);
        }

        // Buffered reads are already capped by `limit`; API responses are
        // newest-first, so keep the first N for API fallback reads.
        const limited = buffered.length > 0 ? messages : messages.slice(0, limit);

        // Check if there are still more unread messages buffered
        const hasUnread = channelManager.hasUnreadChat();

        if (limited.length === 0) {
          return buildResponse(
            JSON.stringify(
              {
                status: "ok",
                hasUnread,
                messages: [],
                message: "No new chat messages. Your viewers are watching quietly.",
              },
              null,
              2
            )
          );
        }

        // Format messages for the agent
        const formatted = limited.map((msg) => ({
          author: msg.author,
          content: msg.content,
          timestamp: msg.timestamp || msg.createdAt || "",
          isAgent: msg.isAgent,
        }));

        return buildResponse(
          JSON.stringify(
            {
              status: "ok",
              hasUnread,
              count: formatted.length,
              messages: formatted,
            },
            null,
            2
          )
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return buildResponse(
          JSON.stringify(
            {
              status: "error",
              hasUnread: false,
              message: `Failed to read chat: ${message}`,
            },
            null,
            2
          )
        );
      }
    },
  };
}

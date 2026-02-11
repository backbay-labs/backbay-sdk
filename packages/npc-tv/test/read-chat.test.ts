/**
 * @backbay/npctv - npc_read_chat Tool Tests
 */

import { describe, test, expect } from "bun:test";
import { createReadChatTool } from "../src/tools/read-chat.js";
import type { ChannelRegistration, ChatMessage } from "../src/types.js";

function parseTextResponse(response: { content: Array<{ type: "text"; text: string }> }) {
  return JSON.parse(response.content[0]?.text ?? "{}") as {
    status: string;
    count?: number;
    hasUnread: boolean;
    messages: Array<Pick<ChatMessage, "content" | "author" | "timestamp" | "isAgent">>;
  };
}

describe("npc_read_chat", () => {
  test("API fallback keeps the newest messages when limit is applied", async () => {
    const registration: ChannelRegistration = {
      channelId: "ch-test",
      name: "Test Channel",
      category: "coding",
      agentId: "agent-1",
      status: "live",
    };

    const relayClient = {
      getChat: async () =>
        [
          { id: "m3", author: "c", content: "newest", timestamp: "2026-02-11T03:00:00Z", isAgent: false },
          { id: "m2", author: "b", content: "middle", timestamp: "2026-02-11T02:00:00Z", isAgent: false },
          { id: "m1", author: "a", content: "oldest", timestamp: "2026-02-11T01:00:00Z", isAgent: false },
        ] satisfies ChatMessage[],
    };

    const channelManager = {
      isLive: () => true,
      getRegistration: () => registration,
      drainChatBuffer: (_limit?: number) => [] as ChatMessage[],
      hasUnreadChat: () => false,
    };

    const tool = createReadChatTool(relayClient as any, channelManager as any);
    const response = await tool.execute("tool-1", { limit: 2 });
    const payload = parseTextResponse(response);

    expect(payload.status).toBe("ok");
    expect(payload.count).toBe(2);
    expect(payload.messages.map((m) => m.content)).toEqual(["newest", "middle"]);
  });
});

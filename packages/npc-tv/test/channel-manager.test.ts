/**
 * @backbay/npctv - Channel Manager Tests
 *
 * Verifies chat buffer drain semantics and chat session reset behavior.
 */

import { describe, test, expect } from "bun:test";
import { ChannelManager } from "../src/relay/channel-manager.js";
import type { ChannelConfig, ChatMessage, ChannelRegistration } from "../src/types.js";

const CHANNEL_CONFIG: ChannelConfig = {
  name: "Test Channel",
  category: "coding",
  autoGoLive: false,
};

function createMessage(id: string, content: string): ChatMessage {
  return {
    id,
    author: "viewer",
    content,
    timestamp: new Date().toISOString(),
    isAgent: false,
  };
}

describe("ChannelManager", () => {
  test("drainChatBuffer(limit) drains only requested messages and keeps unread", () => {
    const fakeClient = {
      isWebSocketConnected: false,
    };
    const manager = new ChannelManager(fakeClient as any, CHANNEL_CONFIG);

    (manager as any)._pushChatMessage(createMessage("m1", "one"));
    (manager as any)._pushChatMessage(createMessage("m2", "two"));
    (manager as any)._pushChatMessage(createMessage("m3", "three"));

    const first = manager.drainChatBuffer(2);
    expect(first).toHaveLength(2);
    expect(first[0]?.id).toBe("m1");
    expect(first[1]?.id).toBe("m2");
    expect(manager.hasUnreadChat()).toBe(true);
    expect(manager.unreadChatCount).toBe(1);

    const second = manager.drainChatBuffer(5);
    expect(second).toHaveLength(1);
    expect(second[0]?.id).toBe("m3");
    expect(manager.hasUnreadChat()).toBe(false);
    expect(manager.unreadChatCount).toBe(0);
  });

  test("endStream clears chat session state", async () => {
    const registration: ChannelRegistration = {
      channelId: "ch-test",
      name: "Test Channel",
      category: "coding",
      agentId: "agent-1",
      status: "live",
    };
    let deregisteredChannel: string | null = null;

    const fakeClient = {
      isWebSocketConnected: false,
      registerChannel: async () => registration,
      connectWebSocket: () => null,
      heartbeat: async () => {},
      pushEvents: async () => {},
      getChat: async () => [],
      deregisterChannel: async (channelId: string) => {
        deregisteredChannel = channelId;
      },
    };

    const manager = new ChannelManager(fakeClient as any, CHANNEL_CONFIG);
    await manager.goLive();

    (manager as any)._pushChatMessage(createMessage("m1", "hello"));
    (manager as any).lastChatTimestamp = "2026-02-11T00:00:00.000Z";

    expect(manager.hasUnreadChat()).toBe(true);
    expect((manager as any).lastChatTimestamp).toBeDefined();

    await manager.endStream();

    expect(deregisteredChannel).toBe("ch-test");
    expect(manager.hasUnreadChat()).toBe(false);
    expect(manager.unreadChatCount).toBe(0);
    expect((manager as any).lastChatTimestamp).toBeUndefined();
  });
});

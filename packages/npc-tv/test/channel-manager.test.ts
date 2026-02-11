/**
 * @backbay/npctv - Channel Manager Tests
 *
 * Verifies chat/session buffering semantics and teardown behavior.
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

  test("pollChat advances cursor when only agent messages are returned", async () => {
    const registration: ChannelRegistration = {
      channelId: "ch-test",
      name: "Test Channel",
      category: "coding",
      agentId: "agent-1",
      status: "live",
    };

    const fakeClient = {
      isWebSocketConnected: false,
      getChat: async () => [
        {
          id: "a1",
          author: "agent",
          content: "status update",
          timestamp: "2026-02-11T01:00:00.000Z",
          isAgent: true,
        },
      ],
    };

    const manager = new ChannelManager(fakeClient as any, CHANNEL_CONFIG);
    (manager as any).registration = registration;

    await (manager as any).pollChat();

    expect((manager as any).lastChatTimestamp).toBe("2026-02-11T01:00:00.000Z");
    expect(manager.hasUnreadChat()).toBe(false);
    expect(manager.unreadChatCount).toBe(0);
  });

  test("endStream drops stale queued events when final flush fails", async () => {
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
      pushEvents: async () => {
        throw new Error("relay unavailable");
      },
      deregisterChannel: async (channelId: string) => {
        deregisteredChannel = channelId;
      },
    };

    const manager = new ChannelManager(fakeClient as any, CHANNEL_CONFIG);
    (manager as any).registration = registration;
    (manager as any).eventBuffer = [
      {
        id: "evt-1",
        timestamp: "2026-02-11T01:00:00.000Z",
        type: "info",
        content: "stale event",
      },
    ];

    await manager.endStream();

    expect(deregisteredChannel).toBe("ch-test");
    expect((manager as any).eventBuffer).toHaveLength(0);
  });
});

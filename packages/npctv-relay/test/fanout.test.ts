/**
 * Tests for EventFanout and ChatFanout
 */

import { describe, test, expect } from "bun:test";
import { EventFanout } from "../src/fanout/events";
import { ChatFanout } from "../src/fanout/chat";
import type { FanoutEvent, ChatMessage } from "../src/channel/types";

describe("EventFanout", () => {
  test("subscribe and emit delivers events", () => {
    const fanout = new EventFanout();
    const received: FanoutEvent[] = [];

    fanout.subscribe("ch_1", (event) => received.push(event));

    fanout.emit("ch_1", { type: "command", content: "ls -la" });
    fanout.emit("ch_1", { type: "success", content: "Done" });

    expect(received).toHaveLength(2);
    expect(received[0].type).toBe("command");
    expect(received[0].content).toBe("ls -la");
    expect(received[0].id).toStartWith("evt_");
    expect(received[0].channelId).toBe("ch_1");
    expect(received[1].type).toBe("success");
  });

  test("events are isolated per channel", () => {
    const fanout = new EventFanout();
    const ch1Events: FanoutEvent[] = [];
    const ch2Events: FanoutEvent[] = [];

    fanout.subscribe("ch_1", (e) => ch1Events.push(e));
    fanout.subscribe("ch_2", (e) => ch2Events.push(e));

    fanout.emit("ch_1", { type: "info", content: "for ch1" });
    fanout.emit("ch_2", { type: "info", content: "for ch2" });

    expect(ch1Events).toHaveLength(1);
    expect(ch1Events[0].content).toBe("for ch1");
    expect(ch2Events).toHaveLength(1);
    expect(ch2Events[0].content).toBe("for ch2");
  });

  test("unsubscribe stops delivery", () => {
    const fanout = new EventFanout();
    const received: FanoutEvent[] = [];

    const unsub = fanout.subscribe("ch_1", (e) => received.push(e));

    fanout.emit("ch_1", { type: "info", content: "before" });
    expect(received).toHaveLength(1);

    unsub();

    fanout.emit("ch_1", { type: "info", content: "after" });
    expect(received).toHaveLength(1); // No new events
  });

  test("unsubscribe cleans up empty subscriber sets (no leak)", () => {
    const fanout = new EventFanout();
    const unsub = fanout.subscribe("ch_1", () => {});

    expect(fanout.getSubscriberCount("ch_1")).toBe(1);

    unsub();
    expect(fanout.getSubscriberCount("ch_1")).toBe(0);
  });

  test("multiple subscribers receive the same event", () => {
    const fanout = new EventFanout();
    const sub1: FanoutEvent[] = [];
    const sub2: FanoutEvent[] = [];

    fanout.subscribe("ch_1", (e) => sub1.push(e));
    fanout.subscribe("ch_1", (e) => sub2.push(e));

    fanout.emit("ch_1", { type: "info", content: "hello" });

    expect(sub1).toHaveLength(1);
    expect(sub2).toHaveLength(1);
    expect(sub1[0].id).toBe(sub2[0].id); // Same event
  });

  test("emit to channel with no subscribers is a no-op", () => {
    const fanout = new EventFanout();
    // Should not throw
    fanout.emit("ch_nobody", { type: "info", content: "hello" });
  });

  test("getSubscriberCount returns correct count", () => {
    const fanout = new EventFanout();
    expect(fanout.getSubscriberCount("ch_1")).toBe(0);

    const unsub1 = fanout.subscribe("ch_1", () => {});
    expect(fanout.getSubscriberCount("ch_1")).toBe(1);

    fanout.subscribe("ch_1", () => {});
    expect(fanout.getSubscriberCount("ch_1")).toBe(2);

    unsub1();
    expect(fanout.getSubscriberCount("ch_1")).toBe(1);
  });

  test("clear removes all subscribers for a channel", () => {
    const fanout = new EventFanout();
    const received: FanoutEvent[] = [];

    fanout.subscribe("ch_1", (e) => received.push(e));
    fanout.subscribe("ch_1", (e) => received.push(e));

    fanout.clear("ch_1");

    fanout.emit("ch_1", { type: "info", content: "hello" });
    expect(received).toHaveLength(0);
    expect(fanout.getSubscriberCount("ch_1")).toBe(0);
  });
});

describe("ChatFanout", () => {
  test("send creates a message and notifies subscribers", () => {
    const chat = new ChatFanout();
    const received: ChatMessage[] = [];

    chat.subscribe("ch_1", (msg) => received.push(msg));

    const msg = chat.send("ch_1", {
      author: "alice",
      content: "hello world",
    });

    expect(msg.id).toStartWith("msg_");
    expect(msg.channelId).toBe("ch_1");
    expect(msg.author).toBe("alice");
    expect(msg.content).toBe("hello world");
    expect(msg.isAgent).toBe(false);
    expect(msg.createdAt).toBeTruthy();

    expect(received).toHaveLength(1);
    expect(received[0].id).toBe(msg.id);
  });

  test("getRecent returns messages newest-first from buffer", () => {
    const chat = new ChatFanout();

    chat.send("ch_1", { author: "a", content: "first" });
    chat.send("ch_1", { author: "b", content: "second" });
    chat.send("ch_1", { author: "c", content: "third" });

    const recent = chat.getRecent("ch_1");
    expect(recent).toHaveLength(3);
    expect(recent[0].content).toBe("third"); // newest first
    expect(recent[2].content).toBe("first");
  });

  test("getRecent respects limit", () => {
    const chat = new ChatFanout();

    for (let i = 0; i < 10; i++) {
      chat.send("ch_1", { author: "user", content: `msg ${i}` });
    }

    const limited = chat.getRecent("ch_1", 3);
    expect(limited).toHaveLength(3);
    expect(limited[0].content).toBe("msg 9");
    expect(limited[2].content).toBe("msg 7");
  });

  test("getRecent returns empty for unknown channel", () => {
    const chat = new ChatFanout();
    expect(chat.getRecent("ch_ghost")).toEqual([]);
  });

  test("isAgent flag is preserved", () => {
    const chat = new ChatFanout();

    const viewerMsg = chat.send("ch_1", {
      author: "viewer",
      content: "hi",
      isAgent: false,
    });
    const agentMsg = chat.send("ch_1", {
      author: "agent",
      content: "hello",
      isAgent: true,
    });

    expect(viewerMsg.isAgent).toBe(false);
    expect(agentMsg.isAgent).toBe(true);
  });

  test("clear removes subscribers and buffer", () => {
    const chat = new ChatFanout();
    const received: ChatMessage[] = [];

    chat.subscribe("ch_1", (msg) => received.push(msg));
    chat.send("ch_1", { author: "a", content: "hello" });

    expect(received).toHaveLength(1);
    expect(chat.getRecent("ch_1")).toHaveLength(1);

    chat.clear("ch_1");

    chat.send("ch_1", { author: "b", content: "world" });
    // Subscriber was cleared, so no new notification
    expect(received).toHaveLength(1);
    // Buffer was cleared, but new message is added
    expect(chat.getRecent("ch_1")).toHaveLength(1);
    expect(chat.getRecent("ch_1")[0].content).toBe("world");
  });
});

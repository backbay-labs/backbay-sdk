/**
 * @backbay/npctv - Relay Client Tests
 *
 * Verifies NpcTvRelayClient sends correct HTTP requests.
 */

import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { NpcTvRelayClient } from "../src/relay/client.js";
import type { StreamEvent } from "../src/types.js";

/** Captured fetch calls for assertions. */
interface FetchCall {
  url: string;
  init: RequestInit;
}

let fetchCalls: FetchCall[] = [];
let originalFetch: typeof globalThis.fetch;

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  private listeners = new Map<string, Array<(event: unknown) => void>>();

  constructor(public readonly url: string) {
    MockWebSocket.instances.push(this);
  }

  addEventListener(type: string, listener: (event: unknown) => void): void {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }

  send(_data: string): void {}

  close(): void {
    this.emit("close");
  }

  emit(type: string, event: unknown = {}): void {
    const list = this.listeners.get(type) ?? [];
    for (const listener of list) {
      listener(event);
    }
  }
}

/** Mock successful JSON response. */
function mockFetch(responseBody: unknown = {}, status = 200) {
  return mock((url: string | URL | Request, init?: RequestInit) => {
    fetchCalls.push({ url: String(url), init: init ?? {} });
    return Promise.resolve(
      new Response(JSON.stringify(responseBody), {
        status,
        headers: { "Content-Type": "application/json" },
      })
    );
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  fetchCalls = [];
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("NpcTvRelayClient", () => {
  test("registerChannel sends POST /npctv/channels", async () => {
    const channelData = {
      channelId: "ch-1",
      name: "Test Channel",
      category: "coding",
      agentId: "agent-123",
      status: "live",
    };
    globalThis.fetch = mockFetch(channelData);

    const client = new NpcTvRelayClient({ url: "http://localhost:3000/api/v1/npctv" });
    const result = await client.registerChannel({
      name: "Test Channel",
      category: "coding",
      agentId: "agent-123",
    });

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe("http://localhost:3000/api/v1/npctv/channels");
    expect(fetchCalls[0].init.method).toBe("POST");
    expect(result.channelId).toBe("ch-1");

    const body = JSON.parse(fetchCalls[0].init.body as string);
    expect(body.name).toBe("Test Channel");
    expect(body.category).toBe("coding");
  });

  test("registerChannel normalizes relay envelope response with id field", async () => {
    globalThis.fetch = mockFetch({
      ok: true,
      data: {
        id: "ch-env",
        name: "Envelope Channel",
        category: "coding",
        agentId: "agent-env",
        status: "live",
        apiKey: "npc_channel_key",
      },
    });

    const client = new NpcTvRelayClient({ url: "http://localhost:3000/api/v1/npctv" });
    const result = await client.registerChannel({
      name: "Envelope Channel",
      category: "coding",
    });

    expect(result.channelId).toBe("ch-env");
    expect(result.agentId).toBe("agent-env");
  });

  test("deregisterChannel sends DELETE /npctv/channels/:id", async () => {
    globalThis.fetch = mockFetch({}, 204);

    const client = new NpcTvRelayClient({ url: "http://localhost:3000/api/v1/npctv" });
    await client.deregisterChannel("ch-1");

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe("http://localhost:3000/api/v1/npctv/channels/ch-1");
    expect(fetchCalls[0].init.method).toBe("DELETE");
  });

  test("pushEvents sends POST /npctv/channels/:id/events with event batch", async () => {
    globalThis.fetch = mockFetch({});

    const client = new NpcTvRelayClient({ url: "http://localhost:3000/api/v1/npctv" });
    const events: StreamEvent[] = [
      {
        id: "evt-1",
        timestamp: "2026-02-10T12:00:00Z",
        type: "command",
        content: "[bash] ls -la",
      },
      {
        id: "evt-2",
        timestamp: "2026-02-10T12:00:01Z",
        type: "success",
        content: "Command completed",
      },
    ];

    await client.pushEvents("ch-1", events);

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe("http://localhost:3000/api/v1/npctv/channels/ch-1/events");
    expect(fetchCalls[0].init.method).toBe("POST");

    const body = JSON.parse(fetchCalls[0].init.body as string);
    expect(body.events).toHaveLength(2);
    expect(body.events[0].id).toBe("evt-1");
  });

  test("heartbeat sends POST /npctv/channels/:id/heartbeat", async () => {
    globalThis.fetch = mockFetch({});

    const client = new NpcTvRelayClient({ url: "http://localhost:3000/api/v1/npctv" });
    await client.heartbeat("ch-1");

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe("http://localhost:3000/api/v1/npctv/channels/ch-1/heartbeat");
    expect(fetchCalls[0].init.method).toBe("POST");
  });

  test("getChat sends GET /npctv/channels/:id/chat", async () => {
    const messages = {
      messages: [
        {
          id: "m-1",
          author: "viewer1",
          content: "Hello!",
          timestamp: "2026-02-10T12:00:00Z",
          isAgent: false,
        },
      ],
    };
    globalThis.fetch = mockFetch(messages);

    const client = new NpcTvRelayClient({ url: "http://localhost:3000/api/v1/npctv" });
    const result = await client.getChat("ch-1");

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe("http://localhost:3000/api/v1/npctv/channels/ch-1/chat");
    expect(fetchCalls[0].init.method).toBe("GET");
    expect(result).toHaveLength(1);
    expect(result[0].author).toBe("viewer1");
  });

  test('getChat passes "since" query parameter', async () => {
    globalThis.fetch = mockFetch({ messages: [] });

    const client = new NpcTvRelayClient({ url: "http://localhost:3000/api/v1/npctv" });
    await client.getChat("ch-1", "2026-02-10T11:00:00Z");

    expect(fetchCalls[0].url).toContain("since=2026-02-10T11%3A00%3A00Z");
  });

  test("sendReaction sends POST /npctv/channels/:id/reactions", async () => {
    globalThis.fetch = mockFetch({});

    const client = new NpcTvRelayClient({ url: "http://localhost:3000/api/v1/npctv" });
    await client.sendReaction("ch-1", "fire");

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe("http://localhost:3000/api/v1/npctv/channels/ch-1/reactions");

    const body = JSON.parse(fetchCalls[0].init.body as string);
    expect(body.type).toBe("fire");
  });

  test("sendEmote sends POST /npctv/channels/:id/emotes", async () => {
    globalThis.fetch = mockFetch({});

    const client = new NpcTvRelayClient({ url: "http://localhost:3000/api/v1/npctv" });
    await client.sendEmote("ch-1", "celebration", "WE DID IT!");

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0].url).toBe("http://localhost:3000/api/v1/npctv/channels/ch-1/emotes");

    const body = JSON.parse(fetchCalls[0].init.body as string);
    expect(body.type).toBe("celebration");
    expect(body.message).toBe("WE DID IT!");
  });

  test("includes Authorization header when apiKey is set", async () => {
    globalThis.fetch = mockFetch({});

    const client = new NpcTvRelayClient({
      url: "http://localhost:3000/api/v1/npctv",
      apiKey: "my-secret-key",
    });
    await client.heartbeat("ch-1");

    const headers = fetchCalls[0].init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer my-secret-key");
  });

  test("uses channel API key from registration for channel-authenticated calls", async () => {
    globalThis.fetch = mock((url: string | URL | Request, init?: RequestInit) => {
      fetchCalls.push({ url: String(url), init: init ?? {} });

      if (String(url).endsWith("/channels")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              ok: true,
              data: {
                id: "ch-1",
                name: "Keyed Channel",
                category: "coding",
                agentId: "agent-1",
                status: "live",
                apiKey: "npc_channel_key",
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          )
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }) as unknown as typeof fetch;

    const client = new NpcTvRelayClient({ url: "http://localhost:3000/api/v1/npctv" });
    await client.registerChannel({
      name: "Keyed Channel",
      category: "coding",
    });
    await client.heartbeat("ch-1");

    expect(fetchCalls).toHaveLength(2);
    const headers = fetchCalls[1].init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer npc_channel_key");
  });

  test("does not include Authorization header when apiKey is absent", async () => {
    globalThis.fetch = mockFetch({});

    const client = new NpcTvRelayClient({ url: "http://localhost:3000/api/v1/npctv" });
    await client.heartbeat("ch-1");

    const headers = fetchCalls[0].init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBeUndefined();
  });

  test("throws on non-2xx responses", async () => {
    globalThis.fetch = mockFetch({ error: "Not Found" }, 404);

    const client = new NpcTvRelayClient({ url: "http://localhost:3000/api/v1/npctv" });

    await expect(client.heartbeat("ch-missing")).rejects.toThrow("failed (404)");
  });

  test("strips trailing slashes from base URL", async () => {
    globalThis.fetch = mockFetch({});

    const client = new NpcTvRelayClient({ url: "http://localhost:3000/api/v1/npctv///" });
    await client.heartbeat("ch-1");

    expect(fetchCalls[0].url).toBe("http://localhost:3000/api/v1/npctv/channels/ch-1/heartbeat");
  });

  test("getChat supports relay envelope payloads", async () => {
    globalThis.fetch = mockFetch({
      ok: true,
      data: [
        {
          id: "m-1",
          author: "viewer",
          content: "yo",
          timestamp: "2026-02-10T12:00:00Z",
          isAgent: false,
        },
      ],
    });

    const client = new NpcTvRelayClient({ url: "http://localhost:3000/api/v1/npctv" });
    const result = await client.getChat("ch-1");
    expect(result).toHaveLength(1);
    expect(result[0].author).toBe("viewer");
  });

  test("connectWebSocket keeps reconnect enabled after initial connect", () => {
    const originalWebSocket = globalThis.WebSocket;
    const originalSetTimeout = globalThis.setTimeout;
    MockWebSocket.instances = [];

    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    globalThis.setTimeout = ((fn: TimerHandler) => {
      if (typeof fn === "function") {
        fn();
      }
      return 1 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout;

    try {
      const client = new NpcTvRelayClient({ url: "http://localhost:3000/api/v1/npctv" });
      client.connectWebSocket("ch-1");

      expect(MockWebSocket.instances).toHaveLength(1);
      MockWebSocket.instances[0].emit("close");

      // A reconnect attempt should create a second socket.
      expect(MockWebSocket.instances).toHaveLength(2);
      expect(MockWebSocket.instances[1].url).toBe(
        "ws://localhost:3000/api/v1/npctv/channels/ch-1/agent"
      );
    } finally {
      globalThis.WebSocket = originalWebSocket;
      globalThis.setTimeout = originalSetTimeout;
    }
  });

  test("stale WebSocket close events do not reset active socket state", () => {
    const originalWebSocket = globalThis.WebSocket;
    const originalSetTimeout = globalThis.setTimeout;
    MockWebSocket.instances = [];
    let timeoutCalls = 0;

    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    globalThis.setTimeout = (() => {
      timeoutCalls += 1;
      return 1 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout;

    try {
      const client = new NpcTvRelayClient({ url: "http://localhost:3000/api/v1/npctv" });

      client.connectWebSocket("ch-1");
      expect(MockWebSocket.instances).toHaveLength(1);
      const first = MockWebSocket.instances[0];
      first.emit("open");

      client.connectWebSocket("ch-1");
      expect(MockWebSocket.instances).toHaveLength(2);
      const second = MockWebSocket.instances[1];
      second.emit("open");

      // Simulate delayed close event from the old socket.
      first.emit("close");

      expect(timeoutCalls).toBe(0);
      expect(client.isWebSocketConnected).toBe(true);
    } finally {
      globalThis.WebSocket = originalWebSocket;
      globalThis.setTimeout = originalSetTimeout;
    }
  });
});

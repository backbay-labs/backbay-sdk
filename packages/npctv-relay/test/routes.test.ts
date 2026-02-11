/**
 * HTTP endpoint smoke tests for the NPC.tv Relay
 *
 * Tests the full request→response cycle using Elysia's built-in
 * test client (no actual server started).
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createApp, type RelayState } from "../src/app";
import type { Elysia } from "elysia";

describe("Relay HTTP Routes", () => {
  let app: Elysia;
  let state: RelayState;

  beforeEach(() => {
    const created = createApp();
    app = created.app;
    state = created.state;
  });

  afterEach(() => {
    state.registry.destroy();
  });

  // ── Helper ──────────────────────────────────────────────────────────────

  async function req(
    method: string,
    path: string,
    opts?: { body?: unknown; headers?: Record<string, string> }
  ): Promise<{ status: number; json: unknown }> {
    const init: RequestInit = { method, headers: {} };

    if (opts?.body) {
      (init.headers as Record<string, string>)["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.body);
    }
    if (opts?.headers) {
      Object.assign(init.headers as Record<string, string>, opts.headers);
    }

    const res = await app.handle(new Request(`http://localhost${path}`, init));

    const contentType = res.headers.get("content-type") ?? "";
    const json = contentType.includes("json") ? await res.json() : null;

    return { status: res.status, json };
  }

  // ── Health ──────────────────────────────────────────────────────────────

  test("GET /health returns status ok", async () => {
    const { status, json } = await req("GET", "/health");
    expect(status).toBe(200);
    expect((json as Record<string, unknown>).status).toBe("ok");
    expect((json as Record<string, unknown>).service).toBe("npctv-relay");
  });

  test("GET /ready returns 200", async () => {
    const res = await app.handle(new Request("http://localhost/ready"));
    expect(res.status).toBe(200);
  });

  // ── Channel CRUD ────────────────────────────────────────────────────────

  test("POST /channels registers a channel", async () => {
    const { status, json } = await req("POST", "/channels", {
      body: { name: "Test Stream", category: "coding" },
    });

    expect(status).toBe(200);
    const data = (json as Record<string, unknown>).data as Record<string, unknown>;
    expect(data.id).toBeTruthy();
    expect(data.apiKey).toBeTruthy();
    expect(data.name).toBe("Test Stream");
    expect(data.status).toBe("live");
  });

  test("GET /channels lists registered channels", async () => {
    await req("POST", "/channels", { body: { name: "A" } });
    await req("POST", "/channels", { body: { name: "B" } });

    const { status, json } = await req("GET", "/channels");
    expect(status).toBe(200);

    const data = (json as Record<string, unknown>).data as unknown[];
    expect(data).toHaveLength(2);
  });

  test("GET /channels/:id returns channel details", async () => {
    const createRes = await req("POST", "/channels", {
      body: { name: "Details Test" },
    });
    const channelId = ((createRes.json as Record<string, unknown>).data as Record<string, unknown>)
      .id as string;

    const { status, json } = await req("GET", `/channels/${channelId}`);
    expect(status).toBe(200);
    expect(((json as Record<string, unknown>).data as Record<string, unknown>).name).toBe(
      "Details Test"
    );
  });

  test("GET /channels/:id returns 404 for unknown", async () => {
    const { status } = await req("GET", "/channels/ch_nonexistent");
    expect(status).toBe(404);
  });

  test("DELETE /channels/:id deregisters with correct API key", async () => {
    const createRes = await req("POST", "/channels", {
      body: { name: "To Delete" },
    });
    const data = (createRes.json as Record<string, unknown>).data as Record<string, unknown>;
    const channelId = data.id as string;
    const apiKey = data.apiKey as string;

    const { status, json } = await req("DELETE", `/channels/${channelId}`, {
      headers: { "x-api-key": apiKey },
    });
    expect(status).toBe(200);

    // Channel should be gone
    const { status: getStatus } = await req("GET", `/channels/${channelId}`);
    expect(getStatus).toBe(404);
  });

  test("DELETE /channels/:id rejects wrong API key", async () => {
    const createRes = await req("POST", "/channels", {
      body: { name: "Protected" },
    });
    const data = (createRes.json as Record<string, unknown>).data as Record<string, unknown>;
    const channelId = data.id as string;

    const { status } = await req("DELETE", `/channels/${channelId}`, {
      headers: { "x-api-key": "wrong_key" },
    });
    expect(status).toBe(403);
  });

  // ── Heartbeat ───────────────────────────────────────────────────────────

  test("POST /channels/:id/heartbeat updates with correct API key", async () => {
    const createRes = await req("POST", "/channels", {
      body: { name: "Heartbeat Test" },
    });
    const data = (createRes.json as Record<string, unknown>).data as Record<string, unknown>;

    const { status } = await req("POST", `/channels/${data.id}/heartbeat`, {
      headers: { "x-api-key": data.apiKey as string },
    });
    expect(status).toBe(200);
  });

  // ── Events ──────────────────────────────────────────────────────────────

  test("POST /channels/:id/events pushes events", async () => {
    const createRes = await req("POST", "/channels", {
      body: { name: "Event Test" },
    });
    const data = (createRes.json as Record<string, unknown>).data as Record<string, unknown>;

    const { status, json } = await req("POST", `/channels/${data.id}/events`, {
      headers: { "x-api-key": data.apiKey as string },
      body: {
        events: [
          { type: "command", content: "ls" },
          { type: "success", content: "Done" },
        ],
      },
    });

    expect(status).toBe(200);
    expect(((json as Record<string, unknown>).data as Record<string, unknown>).pushed).toBe(2);
  });

  test("POST /channels/:id/events rejects without API key", async () => {
    const createRes = await req("POST", "/channels", {
      body: { name: "No Key" },
    });
    const data = (createRes.json as Record<string, unknown>).data as Record<string, unknown>;

    const { status } = await req("POST", `/channels/${data.id}/events`, {
      body: { events: [{ type: "info", content: "test" }] },
    });
    expect(status).toBe(401);
  });

  // ── Chat ────────────────────────────────────────────────────────────────

  test("POST /channels/:id/chat sends a message", async () => {
    const createRes = await req("POST", "/channels", {
      body: { name: "Chat Test" },
    });
    const data = (createRes.json as Record<string, unknown>).data as Record<string, unknown>;

    const { status, json } = await req("POST", `/channels/${data.id}/chat`, {
      body: { author: "viewer1", content: "Hello!" },
    });

    expect(status).toBe(200);
    const msgData = (json as Record<string, unknown>).data as Record<string, unknown>;
    expect(msgData.author).toBe("viewer1");
    expect(msgData.content).toBe("Hello!");
    expect(msgData.isAgent).toBe(false);
  });

  test("POST /channels/:id/chat ignores client-supplied isAgent without API key", async () => {
    const createRes = await req("POST", "/channels", {
      body: { name: "Spoof Test" },
    });
    const data = (createRes.json as Record<string, unknown>).data as Record<string, unknown>;

    const { status, json } = await req("POST", `/channels/${data.id}/chat`, {
      body: { author: "mallory", content: "I am the agent", isAgent: true },
    });

    expect(status).toBe(200);
    const msgData = (json as Record<string, unknown>).data as Record<string, unknown>;
    expect(msgData.author).toBe("mallory");
    expect(msgData.isAgent).toBe(false);
  });

  test("POST /channels/:id/chat marks message as agent when API key is valid", async () => {
    const createRes = await req("POST", "/channels", {
      body: { name: "Agent Auth Test" },
    });
    const data = (createRes.json as Record<string, unknown>).data as Record<string, unknown>;

    const { status, json } = await req("POST", `/channels/${data.id}/chat`, {
      headers: { "x-api-key": data.apiKey as string },
      body: { author: "spoofed", content: "official update", isAgent: false },
    });

    expect(status).toBe(200);
    const msgData = (json as Record<string, unknown>).data as Record<string, unknown>;
    expect(msgData.author).toBe("Agent Auth Test");
    expect(msgData.isAgent).toBe(true);
  });

  test("POST /channels/:id/chat rejects invalid API key", async () => {
    const createRes = await req("POST", "/channels", {
      body: { name: "Agent Auth Reject" },
    });
    const data = (createRes.json as Record<string, unknown>).data as Record<string, unknown>;

    const { status, json } = await req("POST", `/channels/${data.id}/chat`, {
      headers: { "x-api-key": "wrong_key" },
      body: { author: "mallory", content: "forged" },
    });

    expect(status).toBe(403);
    expect((json as Record<string, unknown>).error).toBe("Invalid API key");
  });

  test("GET /channels/:id/chat returns recent messages", async () => {
    const createRes = await req("POST", "/channels", {
      body: { name: "Chat Buffer" },
    });
    const data = (createRes.json as Record<string, unknown>).data as Record<string, unknown>;

    await req("POST", `/channels/${data.id}/chat`, {
      body: { author: "a", content: "first" },
    });
    await req("POST", `/channels/${data.id}/chat`, {
      body: { author: "b", content: "second" },
    });

    const { status, json } = await req("GET", `/channels/${data.id}/chat`);
    expect(status).toBe(200);

    const messages = (json as Record<string, unknown>).data as unknown[];
    expect(messages).toHaveLength(2);
  });

  // ── E2E: Register → Push → Verify SSE ─────────────────────────────────

  test("events pushed via HTTP are received by SSE subscribers", async () => {
    // 1. Register channel
    const createRes = await req("POST", "/channels", {
      body: { name: "SSE Test" },
    });
    const data = (createRes.json as Record<string, unknown>).data as Record<string, unknown>;
    const channelId = data.id as string;
    const apiKey = data.apiKey as string;

    // 2. Collect events via internal fanout (simulates SSE subscriber)
    const received: unknown[] = [];
    const unsub = state.eventFanout.subscribe(channelId, (event) => {
      received.push(event);
    });

    // 3. Push events via HTTP
    await req("POST", `/channels/${channelId}/events`, {
      headers: { "x-api-key": apiKey },
      body: {
        events: [
          { type: "command", content: "npm test" },
          { type: "success", content: "All tests passed" },
        ],
      },
    });

    // 4. Verify subscriber received the events
    expect(received).toHaveLength(2);
    expect((received[0] as Record<string, unknown>).type).toBe("command");
    expect((received[1] as Record<string, unknown>).type).toBe("success");

    unsub();
  });

  // ── SSE endpoint ──────────────────────────────────────────────────────

  test("GET /channels/:id/stream returns SSE with correct headers", async () => {
    const createRes = await req("POST", "/channels", {
      body: { name: "SSE Headers" },
    });
    const data = (createRes.json as Record<string, unknown>).data as Record<string, unknown>;
    const channelId = data.id as string;

    const res = await app.handle(new Request(`http://localhost/channels/${channelId}/stream`));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/event-stream");
    expect(res.headers.get("cache-control")).toBe("no-cache");

    // Cancel the stream to clean up
    res.body?.cancel();
  });
});

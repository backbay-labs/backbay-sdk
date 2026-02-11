/**
 * Tests for ChannelRegistry
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { ChannelRegistry } from "../src/channel/registry";

describe("ChannelRegistry", () => {
  let registry: ChannelRegistry;

  beforeEach(() => {
    registry = new ChannelRegistry();
  });

  afterEach(() => {
    registry.destroy();
  });

  // ── Registration ────────────────────────────────────────────────────────

  test("register creates a channel with generated id and apiKey", () => {
    const channel = registry.register({ name: "Test Stream" });

    expect(channel.id).toStartWith("ch_");
    expect(channel.apiKey).toStartWith("npc_");
    expect(channel.name).toBe("Test Stream");
    expect(channel.category).toBe("coding"); // default
    expect(channel.status).toBe("live");
    expect(channel.registeredAt).toBeGreaterThan(0);
    expect(channel.lastHeartbeat).toBeGreaterThan(0);
  });

  test("register accepts optional fields", () => {
    const channel = registry.register({
      name: "Custom",
      category: "gaming",
      agentId: "agent-42",
      metadata: { foo: "bar" },
    });

    expect(channel.category).toBe("gaming");
    expect(channel.agentId).toBe("agent-42");
    expect(channel.metadata).toEqual({ foo: "bar" });
  });

  test("each registration gets a unique id and apiKey", () => {
    const a = registry.register({ name: "A" });
    const b = registry.register({ name: "B" });

    expect(a.id).not.toBe(b.id);
    expect(a.apiKey).not.toBe(b.apiKey);
  });

  // ── Get ─────────────────────────────────────────────────────────────────

  test("get returns channel by id", () => {
    const channel = registry.register({ name: "Test" });
    const found = registry.get(channel.id);

    expect(found).not.toBeNull();
    expect(found!.id).toBe(channel.id);
  });

  test("get returns null for unknown id", () => {
    expect(registry.get("ch_nonexistent")).toBeNull();
  });

  // ── Deregister ──────────────────────────────────────────────────────────

  test("deregister removes channel with correct apiKey", () => {
    const channel = registry.register({ name: "Test" });

    const removed = registry.deregister(channel.id, channel.apiKey);
    expect(removed).toBe(true);
    expect(registry.get(channel.id)).toBeNull();
  });

  test("deregister throws on wrong apiKey", () => {
    const channel = registry.register({ name: "Test" });

    expect(() => registry.deregister(channel.id, "wrong_key")).toThrow(
      "Invalid API key",
    );
    // Channel should still exist
    expect(registry.get(channel.id)).not.toBeNull();
  });

  test("deregister returns false for unknown id", () => {
    const removed = registry.deregister("ch_ghost", "any_key");
    expect(removed).toBe(false);
  });

  // ── Heartbeat ───────────────────────────────────────────────────────────

  test("heartbeat updates lastHeartbeat", () => {
    const channel = registry.register({ name: "Test" });
    const initialHeartbeat = channel.lastHeartbeat;

    // Small delay to ensure timestamp differs
    const before = Date.now();
    registry.heartbeat(channel.id, channel.apiKey);
    const after = Date.now();

    const updated = registry.get(channel.id)!;
    expect(updated.lastHeartbeat).toBeGreaterThanOrEqual(before);
    expect(updated.lastHeartbeat).toBeLessThanOrEqual(after);
  });

  test("heartbeat throws on wrong apiKey", () => {
    const channel = registry.register({ name: "Test" });
    expect(() => registry.heartbeat(channel.id, "bad_key")).toThrow(
      "Invalid API key",
    );
  });

  test("heartbeat throws for unknown channel", () => {
    expect(() => registry.heartbeat("ch_ghost", "any_key")).toThrow(
      "not found",
    );
  });

  // ── List ────────────────────────────────────────────────────────────────

  test("list returns all channels sorted newest first", () => {
    const a = registry.register({ name: "A" });
    // Nudge registeredAt so sort order is deterministic
    const aReg = registry.get(a.id)!;
    aReg.registeredAt = Date.now() - 200;

    const b = registry.register({ name: "B" });
    const bReg = registry.get(b.id)!;
    bReg.registeredAt = Date.now() - 100;

    const c = registry.register({ name: "C" });

    const all = registry.list();
    expect(all).toHaveLength(3);
    // Newest first
    expect(all[0].id).toBe(c.id);
    expect(all[2].id).toBe(a.id);
  });

  test("list filters by status", () => {
    const a = registry.register({ name: "A" });
    const b = registry.register({ name: "B" });
    registry.markOffline(b.id);

    const live = registry.list({ status: "live" });
    expect(live).toHaveLength(1);
    expect(live[0].id).toBe(a.id);

    const offline = registry.list({ status: "offline" });
    expect(offline).toHaveLength(1);
    expect(offline[0].id).toBe(b.id);
  });

  test("list filters by category", () => {
    registry.register({ name: "A", category: "coding" });
    registry.register({ name: "B", category: "gaming" });
    registry.register({ name: "C", category: "coding" });

    const coding = registry.list({ category: "coding" });
    expect(coding).toHaveLength(2);

    const gaming = registry.list({ category: "gaming" });
    expect(gaming).toHaveLength(1);
  });

  // ── Status helpers ──────────────────────────────────────────────────────

  test("markOffline / markLive toggle status", () => {
    const channel = registry.register({ name: "Test" });
    expect(channel.status).toBe("live");

    registry.markOffline(channel.id);
    expect(registry.get(channel.id)!.status).toBe("offline");

    registry.markLive(channel.id);
    expect(registry.get(channel.id)!.status).toBe("live");
  });

  test("validateApiKey returns true/false", () => {
    const channel = registry.register({ name: "Test" });

    expect(registry.validateApiKey(channel.id, channel.apiKey)).toBe(true);
    expect(registry.validateApiKey(channel.id, "wrong")).toBe(false);
    expect(registry.validateApiKey("ch_ghost", "any")).toBe(false);
  });

  // ── Size ────────────────────────────────────────────────────────────────

  test("size reflects registered channels", () => {
    expect(registry.size).toBe(0);
    const a = registry.register({ name: "A" });
    expect(registry.size).toBe(1);
    registry.register({ name: "B" });
    expect(registry.size).toBe(2);
    registry.deregister(a.id, a.apiKey);
    expect(registry.size).toBe(1);
  });
});

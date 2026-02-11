import { describe, test, expect } from "bun:test";
import { isActiveSocketClose } from "../src/routes/agent";

describe("agent route close guards", () => {
  test("returns false when there is no active socket for the channel", () => {
    const sockets = new Map<string, { ws: unknown }>();
    expect(isActiveSocketClose("ch-1", {}, sockets)).toBe(false);
  });

  test("returns false when a different socket is active", () => {
    const activeWs = { id: "active" };
    const closingWs = { id: "closing" };
    const sockets = new Map<string, { ws: unknown }>([["ch-1", { ws: activeWs }]]);

    expect(isActiveSocketClose("ch-1", closingWs, sockets)).toBe(false);
  });

  test("returns true when the closing socket is the active socket", () => {
    const ws = { id: "same" };
    const sockets = new Map<string, { ws: unknown }>([["ch-1", { ws }]]);

    expect(isActiveSocketClose("ch-1", ws, sockets)).toBe(true);
  });
});

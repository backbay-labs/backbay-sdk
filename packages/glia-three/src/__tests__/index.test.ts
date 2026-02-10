import { describe, it, expect } from "vitest";

describe("@backbay/glia-three", () => {
  it("module can be imported", async () => {
    const mod = await import("../index.js");
    expect(mod).toBeDefined();
  });
});

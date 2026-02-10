import { describe, it, expect } from "vitest";

describe("@backbay/glia-desktop", () => {
  it("exports core hooks", async () => {
    const mod = await import("../index.js");
    expect(mod).toBeDefined();
    expect(typeof mod.useWindowManager).toBe("function");
    expect(typeof mod.useTaskbar).toBe("function");
  });
});

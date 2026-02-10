import { describe, it, expect } from "vitest";
import * as Raymond from "../index.js";

describe("@backbay/raymond", () => {
  it("exports geometry primitives", () => {
    expect(Raymond).toBeDefined();
    expect(typeof Raymond.Eye).toBe("function");
  });

  it("exports math utilities", () => {
    expect(typeof Raymond.clamped).toBe("function");
    expect(typeof Raymond.newPoint).toBe("function");
  });
});

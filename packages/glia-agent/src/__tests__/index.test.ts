import { describe, it, expect } from "vitest";
import * as GliaAgent from "../index.js";

describe("@backbay/glia-agent", () => {
  it("exports emotion types and functions", () => {
    expect(GliaAgent).toBeDefined();
    expect(typeof GliaAgent.useEmotion).toBe("function");
  });

  it("exports cognition types and functions", () => {
    expect(typeof GliaAgent.useCognition).toBe("function");
    expect(typeof GliaAgent.reduceEvent).toBe("function");
  });
});

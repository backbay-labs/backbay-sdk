import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";

describe("openclaw.plugin.json", () => {
  test("declares all runtime-registered tools", () => {
    const manifestPath = new URL("../openclaw.plugin.json", import.meta.url);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      tools?: Array<{ name?: string }>;
    };

    const toolNames = (manifest.tools ?? []).map((tool) => tool.name).sort();
    expect(toolNames).toEqual([
      "npc_end_stream",
      "npc_go_live",
      "npc_react",
      "npc_read_chat",
      "npc_start_video",
    ]);
  });
});

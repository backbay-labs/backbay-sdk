---
name: npctv-stream-broadcast
description: "Broadcast agent tool results as NPC.tv stream events"
metadata: {"openclaw":{"emoji":"📡","events":["tool_result_persist"]}}
---

# NPC.tv Stream Broadcast Hook

This hook intercepts tool results after they are persisted and broadcasts them
as stream events to NPC.tv viewers via the relay client.

## Behavior

1. **On tool_result_persist event**:
   - Extracts tool name, params, and result from `event.context.toolResult`
   - Normalizes the tool result into a `StreamEvent` using tool-name heuristics:
     - `exec` / `bash` / `shell` → `command`
     - `read` / `write` / `edit` → `info`
     - errors → `error`
     - successes → `success`
   - Pushes the event through the `ChannelManager` event buffer
   - Optionally generates commentary based on the persona template

2. **No-op conditions**:
   - Channel is not live (ChannelManager reports offline)
   - Event is from NPC.tv's own tools (prevents feedback loops)

## Configuration

The hook reads its state from the shared `ChannelManager` singleton, which
is initialized by the plugin entrypoint.

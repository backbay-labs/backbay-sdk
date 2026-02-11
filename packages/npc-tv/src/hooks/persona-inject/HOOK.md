---
name: npctv-persona-inject
description: "Inject streamer persona into agent bootstrap context"
metadata: {"openclaw":{"emoji":"🎭","events":["agent:bootstrap"]}}
---

# NPC.tv Persona Inject Hook

Injects a streamer persona prompt into the agent's bootstrap files so the
agent is aware it is live-streaming on NPC.tv and behaves accordingly.

## Behavior

1. **On agent:bootstrap event**:
   - Loads the configured persona template (or custom prompt)
   - If a custom prompt is set, uses that verbatim
   - Otherwise resolves the template name to the built-in persona text
   - Pushes `NPCTV_PERSONA.md` into `event.context.bootstrapFiles`
   - Only injects when the channel is live (or `autoGoLive` is true)

2. **No-op conditions**:
   - Plugin is not configured for auto-go-live AND channel is not live

## Templates

Available persona templates:
- `default` — Natural narrator, work-first
- `hype` — High energy, everything is LEGENDARY
- `chill` — Lo-fi calm vibes
- `educational` — Teacher mode, explains everything
- `chaotic` — Unhinged genius, ships fast

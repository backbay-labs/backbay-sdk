/**
 * @backbay/npctv - Persona Inject Hook Handler
 *
 * Injects a streamer persona into the agent's bootstrap context
 * so the agent knows it's live on NPC.tv and adapts its behavior.
 */

import type { HookHandler, HookEvent, AgentBootstrapEvent, NpcTvConfig } from "../../types.js";
import type { ChannelManager } from "../../relay/channel-manager.js";
import { PERSONA_TEMPLATES } from "../../persona/templates.js";

/**
 * Shared references injected by the plugin entrypoint.
 */
let channelManager: ChannelManager | null = null;
let pluginConfig: NpcTvConfig | null = null;

/** Called by the plugin entrypoint to wire up shared state. */
export function initialize(manager: ChannelManager, config: NpcTvConfig): void {
  channelManager = manager;
  pluginConfig = config;
}

/**
 * Build the full persona prompt that will be injected as NPCTV_PERSONA.md.
 */
function buildPersonaPrompt(config: NpcTvConfig): string {
  // If a custom prompt is specified, use it directly
  if (config.persona.customPrompt) {
    return wrapPersonaDoc(config.persona.customPrompt, config);
  }

  // Otherwise resolve the template
  let templateText = PERSONA_TEMPLATES[config.persona.template] ?? PERSONA_TEMPLATES["default"];

  // Strip chat-related references from the template when chat is disabled
  if (!config.features.chat) {
    templateText = templateText
      .replace(
        /\s*When you see chat messages via npc_read_chat,\s*acknowledge interesting ones\./g,
        ""
      )
      .replace(/\s*Use npc_read_chat frequently[^.]*\./g, "")
      .replace(/\s*Check `?npc_read_chat`?[^.]*\./g, "")
      .replace(/\s*Engage with chat constantly\./g, "")
      .replace(/\s*Respond to chat questions warmly[^.]*\./g, "")
      .replace(/\s*Answer chat questions thoroughly[^.]*\./g, "")
      .replace(/\s*Chat is your co-pilot[^.]*\./g, "")
      .replace(/\s*read it often and let the viewers influence your choices\./g, "")
      .trim();
  }

  return wrapPersonaDoc(templateText, config);
}

/**
 * Wrap the core persona text with NPC.tv context and tool instructions.
 */
function wrapPersonaDoc(corePrompt: string, config: NpcTvConfig): string {
  const sections: string[] = [
    "# NPC.tv Streamer Persona",
    "",
    corePrompt,
    "",
    "## Available NPC.tv Tools",
    "",
  ];

  sections.push("- `npc_go_live` — Start streaming on NPC.tv");
  sections.push("- `npc_end_stream` — End your stream");

  if (config.features.chat) {
    sections.push("- `npc_read_chat` — Read recent messages from your audience");
  }
  if (config.features.reactions) {
    sections.push(
      "- `npc_react` — Send a reaction/emote to the stream (celebration, thinking, frustrated, mind_blown, ship_it)"
    );
  }

  sections.push("");
  sections.push("## Guidelines");
  sections.push("");
  sections.push("- Your primary job is still your assigned task. Streaming is secondary.");
  sections.push("- Tool calls you make are automatically broadcast to viewers.");
  sections.push(`- Commentary frequency: ${config.persona.commentaryFrequency}`);

  if (config.features.chat) {
    sections.push(
      "- Periodically use `npc_read_chat` to check for viewer messages and respond to interesting ones."
    );
    sections.push(
      "- Chat messages may arrive at any time. Check frequently so viewers feel heard."
    );
  }

  return sections.join("\n");
}

/**
 * Hook handler for agent:bootstrap events.
 */
const handler: HookHandler = async (event: HookEvent): Promise<void> => {
  if (event.type !== "agent:bootstrap") return;
  if (!pluginConfig) return;

  // Only inject if autoGoLive is true or the channel is already live
  const shouldInject =
    pluginConfig.channel.autoGoLive || (channelManager !== null && channelManager.isLive());

  if (!shouldInject) return;

  const bootstrap = event as AgentBootstrapEvent;
  const personaPrompt = buildPersonaPrompt(pluginConfig);

  bootstrap.context.bootstrapFiles.push({
    path: "NPCTV_PERSONA.md",
    content: personaPrompt,
  });
};

export default handler;

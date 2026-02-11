/**
 * @backbay/npctv - npc_react Tool
 *
 * Send a reaction or emote to the NPC.tv stream.
 * Use during exciting, frustrating, or noteworthy moments.
 */

import type { ToolDefinition, ToolResponse, AgentEmoteType } from '../types.js';
import type { NpcTvRelayClient } from '../relay/client.js';
import type { ChannelManager } from '../relay/channel-manager.js';

/** Valid emote types */
const VALID_EMOTES: AgentEmoteType[] = [
  'celebration',
  'thinking',
  'frustrated',
  'mind_blown',
  'ship_it',
];

/** Map emote types to display emojis (for the response) */
const EMOTE_EMOJI: Record<AgentEmoteType, string> = {
  celebration: '🎉',
  thinking: '🤔',
  frustrated: '😤',
  mind_blown: '🤯',
  ship_it: '🚀',
};

function buildResponse(text: string): ToolResponse {
  return { content: [{ type: 'text', text }] };
}

/**
 * Create the npc_react tool definition.
 */
export function createReactTool(
  relayClient: NpcTvRelayClient,
  channelManager: ChannelManager,
): ToolDefinition {
  return {
    name: 'npc_react',
    description:
      'Send a reaction or emote to your NPC.tv stream. ' +
      'Use during exciting moments (celebration), deep thinking (thinking), ' +
      'bugs and failures (frustrated), mind-blowing discoveries (mind_blown), ' +
      'or when deploying/committing (ship_it). Optionally include a message.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['celebration', 'thinking', 'frustrated', 'mind_blown', 'ship_it'],
          description: 'The type of reaction to send',
        },
        message: {
          type: 'string',
          description: 'Optional message to accompany the reaction',
        },
      },
      required: ['type'],
    },
    async execute(_id: string, params: Record<string, unknown>): Promise<ToolResponse> {
      try {
        if (!channelManager.isLive()) {
          return buildResponse(
            JSON.stringify({
              status: 'offline',
              message: 'You are not currently streaming. Go live first with npc_go_live.',
            }, null, 2),
          );
        }

        const reg = channelManager.getRegistration();
        if (!reg) {
          return buildResponse(
            JSON.stringify({ status: 'error', message: 'No channel registration found.' }, null, 2),
          );
        }

        const emoteType = typeof params.type === 'string' ? params.type : '';
        if (!VALID_EMOTES.includes(emoteType as AgentEmoteType)) {
          return buildResponse(
            JSON.stringify({
              status: 'error',
              message: `Invalid reaction type "${emoteType}". Must be one of: ${VALID_EMOTES.join(', ')}`,
            }, null, 2),
          );
        }

        const message = typeof params.message === 'string' ? params.message : undefined;
        await relayClient.sendEmote(reg.channelId, emoteType as AgentEmoteType, message);

        const emoji = EMOTE_EMOJI[emoteType as AgentEmoteType] ?? '✨';

        return buildResponse(
          JSON.stringify({
            status: 'ok',
            reaction: emoteType,
            emoji,
            message: message
              ? `${emoji} Reaction sent: ${emoteType} — "${message}"`
              : `${emoji} Reaction sent: ${emoteType}`,
          }, null, 2),
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return buildResponse(
          JSON.stringify({
            status: 'error',
            message: `Failed to send reaction: ${msg}`,
          }, null, 2),
        );
      }
    },
  };
}

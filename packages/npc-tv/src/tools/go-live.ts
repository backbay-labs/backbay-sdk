/**
 * @backbay/npctv - npc_go_live Tool
 *
 * Start streaming on NPC.tv. Registers the channel and begins
 * broadcasting agent activity to viewers.
 */

import type { ToolDefinition, ToolResponse, NpcTvConfig } from '../types.js';
import type { ChannelManager } from '../relay/channel-manager.js';
import { buildTextResponse } from './response.js';

/**
 * Create the npc_go_live tool definition.
 */
export function createGoLiveTool(
  channelManager: ChannelManager,
  config: NpcTvConfig,
): ToolDefinition {
  return {
    name: 'npc_go_live',
    description:
      'Start streaming on NPC.tv. Call this to begin broadcasting your work to viewers. ' +
      'If you are already live, this returns the current channel info.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Optional stream title (e.g., "Building a REST API from scratch")',
        },
        category: {
          type: 'string',
          enum: ['coding', 'gaming', 'fab', 'research', 'testing'],
          description: 'Stream category (defaults to plugin config)',
        },
      },
    },
    async execute(_id: string, params: Record<string, unknown>): Promise<ToolResponse> {
      try {
        if (channelManager.isLive()) {
          const reg = channelManager.getRegistration();
          return buildTextResponse(
            JSON.stringify({
              status: 'already_live',
              channel: reg,
              message: 'You are already streaming! Keep going.',
            }, null, 2),
          );
        }

        const title = typeof params.title === 'string' ? params.title : undefined;
        const category = typeof params.category === 'string' ? params.category : undefined;

        const registration = await channelManager.goLive({ title, category });

        return buildTextResponse(
          JSON.stringify({
            status: 'live',
            channel: registration,
            persona: config.persona.template,
            message: `You are now LIVE on NPC.tv as "${registration.name}"! Viewers can see your work in real time.`,
          }, null, 2),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return buildTextResponse(
          JSON.stringify({
            status: 'error',
            message: `Failed to go live: ${message}`,
          }, null, 2),
        );
      }
    },
  };
}

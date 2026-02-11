/**
 * @backbay/npctv - npc_end_stream Tool
 *
 * Stop the current NPC.tv stream. Deregisters the channel,
 * flushes remaining events, and stops all background timers.
 */

import type { ToolDefinition, ToolResponse } from '../types.js';
import type { ChannelManager } from '../relay/channel-manager.js';
import { buildTextResponse } from './response.js';

/**
 * Create the npc_end_stream tool definition.
 */
export function createEndStreamTool(channelManager: ChannelManager): ToolDefinition {
  return {
    name: 'npc_end_stream',
    description:
      'End your NPC.tv stream. This stops broadcasting and takes your channel offline. ' +
      'Any remaining events are flushed before the channel is deregistered.',
    parameters: {
      type: 'object',
      properties: {},
    },
    async execute(_id: string, _params: Record<string, unknown>): Promise<ToolResponse> {
      try {
        if (!channelManager.isLive()) {
          return buildTextResponse(
            JSON.stringify({
              status: 'already_offline',
              message: 'You are not currently streaming.',
            }, null, 2),
          );
        }

        const reg = channelManager.getRegistration();
        const eventCount = channelManager.getEventCount();

        await channelManager.endStream();

        return buildTextResponse(
          JSON.stringify({
            status: 'offline',
            channel: reg?.name ?? 'unknown',
            totalEvents: eventCount,
            message: 'Stream ended. Thanks for streaming on NPC.tv!',
          }, null, 2),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return buildTextResponse(
          JSON.stringify({
            status: 'error',
            message: `Failed to end stream: ${message}`,
          }, null, 2),
        );
      }
    },
  };
}

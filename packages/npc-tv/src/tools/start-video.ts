/**
 * @backbay/npctv - npc_start_video Tool
 *
 * Start video streaming on your NPC.tv channel. Requests a publisher
 * token from the BFF relay and updates channel metadata so viewers
 * know video is available.
 */

import type { ToolDefinition, ToolResponse } from '../types.js';
import type { ChannelManager } from '../relay/channel-manager.js';
import type { NpcTvRelayClient } from '../relay/client.js';

function buildResponse(text: string): ToolResponse {
  return { content: [{ type: 'text', text }] };
}

/**
 * Create the npc_start_video tool definition.
 */
export function createStartVideoTool(
  relayClient: NpcTvRelayClient,
  channelManager: ChannelManager,
): ToolDefinition {
  return {
    name: 'npc_start_video',
    description:
      'Start video streaming on your NPC.tv channel. Requires a LiveKit-compatible ' +
      'video source. You must be live (call npc_go_live first). Returns a LiveKit ' +
      'URL and publisher token for connecting a video source.',
    parameters: {
      type: 'object',
      properties: {},
    },
    async execute(_id: string, _params: Record<string, unknown>): Promise<ToolResponse> {
      try {
        if (!channelManager.isLive()) {
          return buildResponse(
            JSON.stringify({
              status: 'error',
              message: 'Channel is not live. Call npc_go_live first.',
            }, null, 2),
          );
        }

        const registration = channelManager.getRegistration();
        if (!registration) {
          return buildResponse(
            JSON.stringify({
              status: 'error',
              message: 'No channel registration found.',
            }, null, 2),
          );
        }

        const channelId = registration.channelId;

        // C3: Request publish token from relay — token enables video on channel;
        // we do NOT return it in the tool response to avoid credential leakage
        // in persisted transcripts. Video capture processes obtain the token via
        // authenticated GET /npctv/channels/:id/video/publish-token.
        await relayClient.getPublishToken(channelId);

        return buildResponse(
          JSON.stringify({
            status: 'video_ready',
            room: `npctv-${channelId}`,
            message:
              'Video streaming has been enabled. Viewers will see your video once you publish ' +
              'tracks to the LiveKit room. Obtain a publisher token via the channel API.',
          }, null, 2),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return buildResponse(
          JSON.stringify({
            status: 'error',
            message: `Failed to start video: ${message}`,
          }, null, 2),
        );
      }
    },
  };
}

/**
 * @backbay/npctv - Plugin Entrypoint
 *
 * Default export: the OpenClaw plugin registration function.
 * Wires up the relay client, channel manager, tools, hooks, services, and CLI.
 */

import type { PluginAPI } from './types.js';
import { resolveConfig } from './config.js';
import { NpcTvRelayClient } from './relay/client.js';
import { ChannelManager } from './relay/channel-manager.js';
import { createGoLiveTool } from './tools/go-live.js';
import { createEndStreamTool } from './tools/end-stream.js';
import { createReadChatTool } from './tools/read-chat.js';
import { createReactTool } from './tools/react.js';
import { createStartVideoTool } from './tools/start-video.js';
import { initialize as initBroadcastHook } from './hooks/stream-broadcast/handler.js';
import { initialize as initPersonaHook } from './hooks/persona-inject/handler.js';
import { registerNpcTvCli } from './cli/commands.js';

/**
 * OpenClaw plugin registration function.
 *
 * Called by the OpenClaw runtime when the plugin is loaded.
 * Follows the same pattern as cyntra-bridge and clawdstrike plugins.
 */
export default function npctv(api: PluginAPI): void {
  const logger = api.logger ?? console;

  // ---------------------------------------------------------------------------
  // Resolve configuration
  // ---------------------------------------------------------------------------
  const rawConfig = api.config?.plugins?.entries?.['npctv']?.config ?? {};
  const config = resolveConfig(rawConfig as Record<string, unknown>);

  // ---------------------------------------------------------------------------
  // Create shared instances
  // ---------------------------------------------------------------------------
  const relayClient = new NpcTvRelayClient(config.relay);
  const channelManager = new ChannelManager(relayClient, config.channel);

  // ---------------------------------------------------------------------------
  // Initialize hook handlers with shared state
  // ---------------------------------------------------------------------------
  initBroadcastHook(channelManager, config);
  initPersonaHook(channelManager, config);

  // ---------------------------------------------------------------------------
  // Register tools
  // ---------------------------------------------------------------------------
  api.registerTool(createGoLiveTool(channelManager, config));
  api.registerTool(createEndStreamTool(channelManager));
  api.registerTool(createReadChatTool(relayClient, channelManager));
  api.registerTool(createReactTool(relayClient, channelManager));
  api.registerTool(createStartVideoTool(relayClient, channelManager));

  // ---------------------------------------------------------------------------
  // Register background service
  // ---------------------------------------------------------------------------
  api.registerService({
    id: 'npctv-channel',
    start: async () => {
      if (config.channel.autoGoLive) {
        try {
          await channelManager.goLive();
          logger.info?.('[npctv] Auto-started stream');
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          logger.warn?.(`[npctv] Auto-start failed: ${msg}`);
        }
      }
    },
    stop: async () => {
      if (channelManager.isLive()) {
        try {
          await channelManager.endStream();
          logger.info?.('[npctv] Stream ended on shutdown');
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          logger.warn?.(`[npctv] Shutdown cleanup failed: ${msg}`);
        }
      }
    },
  });

  // ---------------------------------------------------------------------------
  // Register CLI
  // ---------------------------------------------------------------------------
  api.registerCli(
    ({ program }) => {
      registerNpcTvCli(program, channelManager, relayClient, config);
    },
    { commands: ['npctv'] },
  );

  logger.info?.('[npctv] Plugin registered');
}

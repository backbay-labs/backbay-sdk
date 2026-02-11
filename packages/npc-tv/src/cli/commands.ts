/**
 * @backbay/npctv - CLI Commands
 *
 * CLI subcommands for `openclaw npctv <command>`.
 * Provides status, configure, and test commands.
 */

import type { NpcTvConfig, StreamEvent, CommandBuilder } from '../types.js';
import type { NpcTvRelayClient } from '../relay/client.js';
import type { ChannelManager } from '../relay/channel-manager.js';

interface Program {
  command(name: string): CommandBuilder;
}

/**
 * Print structured data to stdout (JSON, 2-space indent).
 * Handles EPIPE gracefully for piped output.
 */
function cliPrint(data: unknown): void {
  const output = `${JSON.stringify(data, null, 2)}\n`;
  try {
    process.stdout.write(output);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code === 'EPIPE') {
      process.exit(0);
    }
    throw error;
  }
}

/**
 * Register all NPC.tv CLI subcommands under the `npctv` parent command.
 */
export function registerNpcTvCli(
  program: Program,
  channelManager: ChannelManager,
  relayClient: NpcTvRelayClient,
  config: NpcTvConfig,
): void {
  const npctv = program
    .command('npctv')
    .description('NPC.tv streaming management');

  // -----------------------------------------------------------------------
  // npctv status
  // -----------------------------------------------------------------------
  npctv
    .command('status')
    .description('Show current streaming status')
    .action(() => {
      const live = channelManager.isLive();
      const reg = channelManager.getRegistration();
      const eventCount = channelManager.getEventCount();

      cliPrint({
        live,
        channel: reg
          ? {
              channelId: reg.channelId,
              name: reg.name,
              category: reg.category,
              status: reg.status,
            }
          : null,
        eventCount,
        config: {
          relay: config.relay.url,
          persona: config.persona.template,
          autoGoLive: config.channel.autoGoLive,
          features: config.features,
        },
      });
    });

  // -----------------------------------------------------------------------
  // npctv configure
  // -----------------------------------------------------------------------
  npctv
    .command('configure')
    .description('Show current NPC.tv plugin configuration')
    .action(() => {
      cliPrint({
        relay: {
          url: config.relay.url,
          apiKey: config.relay.apiKey ? '***' : '(not set)',
        },
        channel: {
          name: config.channel.name,
          category: config.channel.category,
          autoGoLive: config.channel.autoGoLive,
        },
        persona: {
          template: config.persona.template,
          customPrompt: config.persona.customPrompt ? '(set)' : '(not set)',
          commentaryFrequency: config.persona.commentaryFrequency,
        },
        features: config.features,
      });
    });

  // -----------------------------------------------------------------------
  // npctv test
  // -----------------------------------------------------------------------
  npctv
    .command('test')
    .description('Send a test event to verify NPC.tv connectivity')
    .action(async () => {
      if (!channelManager.isLive()) {
        cliPrint({
          status: 'offline',
          message: 'Channel is not live. Run "openclaw npctv go-live" or enable autoGoLive.',
        });
        return;
      }

      const reg = channelManager.getRegistration();
      if (!reg) {
        cliPrint({ status: 'error', message: 'No channel registration found.' });
        return;
      }

      const testEvent: StreamEvent = {
        id: `test-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'info',
        content: 'Test event from NPC.tv CLI. If you see this, connectivity is working!',
        metadata: { source: 'cli-test' },
      };

      try {
        await relayClient.pushEvents(reg.channelId, [testEvent]);
        cliPrint({
          status: 'ok',
          message: 'Test event sent successfully!',
          channelId: reg.channelId,
          eventId: testEvent.id,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        cliPrint({
          status: 'error',
          message: `Failed to send test event: ${msg}`,
        });
      }
    });
}

/**
 * @backbay/npctv - Plugin Registration Tests
 *
 * Verifies that the plugin entrypoint correctly registers
 * tools, services, and CLI commands via the PluginAPI.
 */

import { describe, test, expect, mock, beforeEach } from 'bun:test';
import npctv from '../src/plugin.js';
import type { PluginAPI, ToolDefinition, ServiceDefinition } from '../src/types.js';

/** Create a mock PluginAPI that records all registrations. */
function createMockApi(configOverrides: Record<string, unknown> = {}): {
  api: PluginAPI;
  tools: ToolDefinition[];
  services: ServiceDefinition[];
  cliCalls: Array<{ callback: Function; opts: unknown }>;
} {
  const tools: ToolDefinition[] = [];
  const services: ServiceDefinition[] = [];
  const cliCalls: Array<{ callback: Function; opts: unknown }> = [];

  const api: PluginAPI = {
    registerTool: mock((tool: ToolDefinition) => {
      tools.push(tool);
    }),
    registerCommand: mock(() => {}),
    registerService: mock((service: ServiceDefinition) => {
      services.push(service);
    }),
    registerCli: mock((callback: Function, opts: unknown) => {
      cliCalls.push({ callback, opts });
    }),
    config: {
      plugins: {
        entries: {
          npctv: {
            config: configOverrides,
          },
        },
      },
    },
    logger: {
      debug: mock(() => {}),
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
    },
  };

  return { api, tools, services, cliCalls };
}

describe('npctv plugin registration', () => {
  test('registers all five tools', () => {
    const { api, tools } = createMockApi();
    npctv(api);

    const toolNames = tools.map((t) => t.name).sort();
    expect(toolNames).toEqual([
      'npc_end_stream',
      'npc_go_live',
      'npc_react',
      'npc_read_chat',
      'npc_start_video',
    ]);
  });

  test('registers the npctv-channel background service', () => {
    const { api, services } = createMockApi();
    npctv(api);

    expect(services).toHaveLength(1);
    expect(services[0].id).toBe('npctv-channel');
    expect(typeof services[0].start).toBe('function');
    expect(typeof services[0].stop).toBe('function');
  });

  test('registers CLI with the "npctv" command namespace', () => {
    const { api, cliCalls } = createMockApi();
    npctv(api);

    expect(cliCalls).toHaveLength(1);
    expect(cliCalls[0].opts).toEqual({ commands: ['npctv'] });
    expect(typeof cliCalls[0].callback).toBe('function');
  });

  test('calls registerTool five times', () => {
    const { api } = createMockApi();
    npctv(api);
    expect(api.registerTool).toHaveBeenCalledTimes(5);
  });

  test('calls registerService once', () => {
    const { api } = createMockApi();
    npctv(api);
    expect(api.registerService).toHaveBeenCalledTimes(1);
  });

  test('calls registerCli once', () => {
    const { api } = createMockApi();
    npctv(api);
    expect(api.registerCli).toHaveBeenCalledTimes(1);
  });

  test('logs plugin registered message', () => {
    const { api } = createMockApi();
    npctv(api);
    expect(api.logger!.info).toHaveBeenCalledWith('[npctv] Plugin registered');
  });

  test('each tool has a description and parameters', () => {
    const { api, tools } = createMockApi();
    npctv(api);

    for (const tool of tools) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.description.length).toBeGreaterThan(10);
      expect(tool.parameters).toBeDefined();
      expect(typeof tool.execute).toBe('function');
    }
  });

  test('respects custom config values', () => {
    const { api, tools } = createMockApi({
      relay: { url: 'https://custom.npctv.io/api', apiKey: 'test-key' },
      channel: { name: 'Custom Channel', category: 'gaming', autoGoLive: false },
      persona: { template: 'hype', commentaryFrequency: 'high' },
      features: { chat: false, reactions: true, clips: false, commentary: true },
    });
    npctv(api);

    // All tools should still register regardless of config
    expect(tools).toHaveLength(5);
  });

  test('handles missing config gracefully', () => {
    const api: PluginAPI = {
      registerTool: mock(() => {}),
      registerCommand: mock(() => {}),
      registerService: mock(() => {}),
      registerCli: mock(() => {}),
      // No config at all
    };

    // Should not throw
    expect(() => npctv(api)).not.toThrow();
    expect(api.registerTool).toHaveBeenCalledTimes(5);
  });
});

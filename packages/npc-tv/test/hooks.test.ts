/**
 * @backbay/npctv - Hook Handler Tests
 *
 * Verifies the stream-broadcast and persona-inject hooks behave correctly.
 */

import { describe, test, expect, mock, beforeEach } from 'bun:test';
import type {
  ToolResultPersistEvent,
  AgentBootstrapEvent,
  NpcTvConfig,
  StreamEvent,
} from '../src/types.js';

// We need to test the handlers through their module exports.
// Import them and use their initialize() functions to inject mocks.
import broadcastHandler, {
  initialize as initBroadcast,
} from '../src/hooks/stream-broadcast/handler.js';
import personaHandler, {
  initialize as initPersona,
} from '../src/hooks/persona-inject/handler.js';

/** Create a minimal NpcTvConfig for testing. */
function createTestConfig(overrides: Partial<NpcTvConfig> = {}): NpcTvConfig {
  return {
    relay: { url: 'http://localhost:3000/api/v1/npctv' },
    channel: { name: 'Test Channel', category: 'coding', autoGoLive: true },
    persona: { template: 'default', commentaryFrequency: 'low' },
    features: { chat: true, reactions: true, clips: true, commentary: false },
    ...overrides,
  };
}

/** Create a mock ChannelManager. */
function createMockChannelManager(live = true) {
  const pushedEvents: StreamEvent[] = [];
  return {
    isLive: mock(() => live),
    getRegistration: mock(() =>
      live
        ? { channelId: 'ch-test', name: 'Test', category: 'coding' as const, agentId: 'agent-1', status: 'live' as const }
        : null,
    ),
    getEventCount: mock(() => pushedEvents.length),
    pushEvent: mock(async (event: StreamEvent) => {
      pushedEvents.push(event);
    }),
    goLive: mock(async () => ({
      channelId: 'ch-test',
      name: 'Test',
      category: 'coding' as const,
      agentId: 'agent-1',
      status: 'live' as const,
    })),
    endStream: mock(async () => {}),
    _pushedEvents: pushedEvents,
  };
}

// ---------------------------------------------------------------------------
// Stream Broadcast Hook
// ---------------------------------------------------------------------------

describe('stream-broadcast hook', () => {
  test('pushes a stream event for a tool_result_persist event', async () => {
    const manager = createMockChannelManager(true);
    const config = createTestConfig();
    initBroadcast(manager as any, config);

    const event: ToolResultPersistEvent = {
      type: 'tool_result_persist',
      timestamp: new Date().toISOString(),
      context: {
        sessionId: 'session-1',
        toolResult: {
          toolName: 'bash',
          params: { command: 'ls -la' },
          result: 'file1.ts\nfile2.ts',
        },
      },
      messages: [],
    };

    await broadcastHandler(event);

    expect(manager.pushEvent).toHaveBeenCalled();
    expect(manager._pushedEvents.length).toBeGreaterThanOrEqual(1);

    const pushed = manager._pushedEvents[0];
    expect(pushed.type).toBe('command');
    expect(pushed.content).toContain('bash');
  });

  test('skips events when channel is not live', async () => {
    const manager = createMockChannelManager(false);
    const config = createTestConfig();
    initBroadcast(manager as any, config);

    const event: ToolResultPersistEvent = {
      type: 'tool_result_persist',
      timestamp: new Date().toISOString(),
      context: {
        sessionId: 'session-1',
        toolResult: {
          toolName: 'bash',
          params: { command: 'echo hello' },
          result: 'hello',
        },
      },
      messages: [],
    };

    await broadcastHandler(event);

    expect(manager.pushEvent).not.toHaveBeenCalled();
  });

  test('skips NPC.tv own tools to prevent feedback loops', async () => {
    const manager = createMockChannelManager(true);
    const config = createTestConfig();
    initBroadcast(manager as any, config);

    const event: ToolResultPersistEvent = {
      type: 'tool_result_persist',
      timestamp: new Date().toISOString(),
      context: {
        sessionId: 'session-1',
        toolResult: {
          toolName: 'npc_read_chat',
          params: {},
          result: '[]',
        },
      },
      messages: [],
    };

    await broadcastHandler(event);

    expect(manager.pushEvent).not.toHaveBeenCalled();
  });

  test('maps error results to "error" event type', async () => {
    const manager = createMockChannelManager(true);
    const config = createTestConfig();
    initBroadcast(manager as any, config);

    const event: ToolResultPersistEvent = {
      type: 'tool_result_persist',
      timestamp: new Date().toISOString(),
      context: {
        sessionId: 'session-1',
        toolResult: {
          toolName: 'bash',
          params: { command: 'invalid-cmd' },
          result: null,
          error: 'command not found',
        },
      },
      messages: [],
    };

    await broadcastHandler(event);

    const pushed = manager._pushedEvents[0];
    expect(pushed.type).toBe('error');
    expect(pushed.content).toContain('Error');
  });

  test('maps read/write tools to "info" event type', async () => {
    const manager = createMockChannelManager(true);
    const config = createTestConfig();
    initBroadcast(manager as any, config);

    const event: ToolResultPersistEvent = {
      type: 'tool_result_persist',
      timestamp: new Date().toISOString(),
      context: {
        sessionId: 'session-1',
        toolResult: {
          toolName: 'file_read',
          params: { path: '/src/index.ts' },
          result: 'const x = 1;',
        },
      },
      messages: [],
    };

    await broadcastHandler(event);

    const pushed = manager._pushedEvents[0];
    expect(pushed.type).toBe('info');
  });

  test('ignores non-tool_result_persist events', async () => {
    const manager = createMockChannelManager(true);
    const config = createTestConfig();
    initBroadcast(manager as any, config);

    const event = {
      type: 'agent:bootstrap',
      timestamp: new Date().toISOString(),
      context: {
        sessionId: 'session-1',
        agentId: 'agent-1',
        bootstrapFiles: [],
        cfg: {},
      },
    } as AgentBootstrapEvent;

    await broadcastHandler(event);

    expect(manager.pushEvent).not.toHaveBeenCalled();
  });

  test('truncates very long tool output', async () => {
    const manager = createMockChannelManager(true);
    const config = createTestConfig();
    initBroadcast(manager as any, config);

    const longOutput = 'x'.repeat(2000);
    const event: ToolResultPersistEvent = {
      type: 'tool_result_persist',
      timestamp: new Date().toISOString(),
      context: {
        sessionId: 'session-1',
        toolResult: {
          toolName: 'bash',
          params: { command: 'cat bigfile' },
          result: longOutput,
        },
      },
      messages: [],
    };

    await broadcastHandler(event);

    const pushed = manager._pushedEvents[0];
    // Should be truncated to ~500 chars + tool name overhead
    expect(pushed.content.length).toBeLessThan(700);
  });
});

// ---------------------------------------------------------------------------
// Persona Inject Hook
// ---------------------------------------------------------------------------

describe('persona-inject hook', () => {
  test('injects NPCTV_PERSONA.md into bootstrap files', async () => {
    const manager = createMockChannelManager(true);
    const config = createTestConfig();
    initPersona(manager as any, config);

    const event: AgentBootstrapEvent = {
      type: 'agent:bootstrap',
      timestamp: new Date().toISOString(),
      context: {
        sessionId: 'session-1',
        agentId: 'agent-1',
        bootstrapFiles: [],
        cfg: {},
      },
    };

    await personaHandler(event);

    expect(event.context.bootstrapFiles).toHaveLength(1);
    expect(event.context.bootstrapFiles[0].path).toBe('NPCTV_PERSONA.md');
    expect(event.context.bootstrapFiles[0].content).toContain('NPC.tv');
  });

  test('persona includes available tool descriptions', async () => {
    const manager = createMockChannelManager(true);
    const config = createTestConfig();
    initPersona(manager as any, config);

    const event: AgentBootstrapEvent = {
      type: 'agent:bootstrap',
      timestamp: new Date().toISOString(),
      context: {
        sessionId: 'session-1',
        agentId: 'agent-1',
        bootstrapFiles: [],
        cfg: {},
      },
    };

    await personaHandler(event);

    const content = event.context.bootstrapFiles[0].content;
    expect(content).toContain('npc_go_live');
    expect(content).toContain('npc_end_stream');
    expect(content).toContain('npc_read_chat');
    expect(content).toContain('npc_react');
  });

  test('uses custom prompt when provided', async () => {
    const manager = createMockChannelManager(true);
    const config = createTestConfig({
      persona: {
        template: 'default',
        customPrompt: 'You are a robot. Beep boop.',
        commentaryFrequency: 'medium',
      },
    });
    initPersona(manager as any, config);

    const event: AgentBootstrapEvent = {
      type: 'agent:bootstrap',
      timestamp: new Date().toISOString(),
      context: {
        sessionId: 'session-1',
        agentId: 'agent-1',
        bootstrapFiles: [],
        cfg: {},
      },
    };

    await personaHandler(event);

    const content = event.context.bootstrapFiles[0].content;
    expect(content).toContain('You are a robot. Beep boop.');
  });

  test('does not inject when autoGoLive is false and channel is offline', async () => {
    const manager = createMockChannelManager(false);
    const config = createTestConfig({
      channel: { name: 'Test', category: 'coding', autoGoLive: false },
    });
    initPersona(manager as any, config);

    const event: AgentBootstrapEvent = {
      type: 'agent:bootstrap',
      timestamp: new Date().toISOString(),
      context: {
        sessionId: 'session-1',
        agentId: 'agent-1',
        bootstrapFiles: [],
        cfg: {},
      },
    };

    await personaHandler(event);

    expect(event.context.bootstrapFiles).toHaveLength(0);
  });

  test('injects when autoGoLive is true even if channel is not yet live', async () => {
    const manager = createMockChannelManager(false); // Channel not live yet
    const config = createTestConfig({
      channel: { name: 'Test', category: 'coding', autoGoLive: true },
    });
    initPersona(manager as any, config);

    const event: AgentBootstrapEvent = {
      type: 'agent:bootstrap',
      timestamp: new Date().toISOString(),
      context: {
        sessionId: 'session-1',
        agentId: 'agent-1',
        bootstrapFiles: [],
        cfg: {},
      },
    };

    await personaHandler(event);

    // autoGoLive is true, so persona should be injected
    expect(event.context.bootstrapFiles).toHaveLength(1);
  });

  test('ignores non-bootstrap events', async () => {
    const manager = createMockChannelManager(true);
    const config = createTestConfig();
    initPersona(manager as any, config);

    const event = {
      type: 'tool_result_persist',
      timestamp: new Date().toISOString(),
      context: {
        sessionId: 'session-1',
        toolResult: {
          toolName: 'bash',
          params: {},
          result: '',
        },
      },
      messages: [],
    } as ToolResultPersistEvent;

    // Should not throw
    await personaHandler(event);
  });

  test('hides chat tool reference when chat feature is disabled', async () => {
    const manager = createMockChannelManager(true);
    const config = createTestConfig({
      features: { chat: false, reactions: true, clips: true, commentary: true },
    });
    initPersona(manager as any, config);

    const event: AgentBootstrapEvent = {
      type: 'agent:bootstrap',
      timestamp: new Date().toISOString(),
      context: {
        sessionId: 'session-1',
        agentId: 'agent-1',
        bootstrapFiles: [],
        cfg: {},
      },
    };

    await personaHandler(event);

    const content = event.context.bootstrapFiles[0].content;
    // npc_read_chat should not be listed when chat is disabled
    expect(content).not.toContain('npc_read_chat');
    // But the other tools should still be there
    expect(content).toContain('npc_go_live');
    expect(content).toContain('npc_react');
  });
});

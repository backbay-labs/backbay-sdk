/**
 * @backbay/npctv - Stream Broadcast Hook Handler
 *
 * Intercepts tool_result_persist events and broadcasts them as
 * stream events to NPC.tv viewers.
 */

import type {
  HookHandler,
  HookEvent,
  ToolResultPersistEvent,
  StreamEvent,
  StreamEventType,
  NpcTvConfig,
} from '../../types.js';
import type { ChannelManager } from '../../relay/channel-manager.js';
import { generateCommentary } from '../../persona/commentary.js';

/** NPC.tv's own tool names — excluded to prevent feedback loops and credential leaks */
const NPCTV_TOOLS = new Set([
  'npc_go_live',
  'npc_end_stream',
  'npc_read_chat',
  'npc_react',
  'npc_start_video', // C2: never broadcast — contains LiveKit publish token
]);

/**
 * Shared references injected by the plugin entrypoint.
 * The handler module cannot import the singletons directly because
 * OpenClaw loads hook handlers as standalone modules; we expose an
 * `initialize()` function that the plugin calls after constructing
 * the manager and config.
 */
let channelManager: ChannelManager | null = null;
let pluginConfig: NpcTvConfig | null = null;

/** Called by the plugin entrypoint to wire up shared state. */
export function initialize(manager: ChannelManager, config: NpcTvConfig): void {
  channelManager = manager;
  pluginConfig = config;
}

/**
 * Map a tool name to a StreamEvent type using simple heuristics.
 */
function inferEventType(toolName: string, hasError: boolean): StreamEventType {
  if (hasError) return 'error';

  const lower = toolName.toLowerCase();

  if (lower.includes('exec') || lower.includes('bash') || lower.includes('shell') || lower.includes('command')) {
    return 'command';
  }
  if (lower.includes('read') || lower.includes('write') || lower.includes('edit') || lower.includes('search') || lower.includes('glob')) {
    return 'info';
  }
  if (lower.includes('test') || lower.includes('build') || lower.includes('deploy') || lower.includes('commit')) {
    return 'success';
  }

  return 'output';
}

/**
 * Build a human-readable content string from a tool result.
 */
function summarizeToolResult(toolName: string, params: Record<string, unknown>, result: unknown, error?: string): string {
  if (error) {
    return `[${toolName}] Error: ${error}`;
  }

  const resultStr = typeof result === 'string'
    ? result
    : JSON.stringify(result ?? '', null, 2);

  // Truncate very long output for the stream
  const maxLen = 500;
  const truncated = resultStr.length > maxLen
    ? `${resultStr.slice(0, maxLen)}…`
    : resultStr;

  // Include the most useful param (command, path, etc.)
  const keyParam = params.command ?? params.path ?? params.file ?? params.query ?? '';
  const paramHint = keyParam ? ` → ${String(keyParam).slice(0, 120)}` : '';

  return `[${toolName}${paramHint}] ${truncated}`;
}

/**
 * Generate a unique event ID.
 */
function makeEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Hook handler for tool_result_persist events.
 */
const handler: HookHandler = async (event: HookEvent): Promise<void> => {
  if (event.type !== 'tool_result_persist') return;

  // If the channel manager hasn't been initialized or channel isn't live, skip.
  if (!channelManager || !channelManager.isLive()) return;
  if (!pluginConfig) return;

  const toolEvent = event as ToolResultPersistEvent;
  const { toolName, params, result, error } = toolEvent.context.toolResult;

  // Skip NPC.tv's own tools to avoid feedback loops
  if (NPCTV_TOOLS.has(toolName)) return;

  const hasError = typeof error === 'string' && error.length > 0;
  const eventType = inferEventType(toolName, hasError);
  const content = summarizeToolResult(toolName, params, result, error);

  const streamEvent: StreamEvent = {
    id: makeEventId(),
    timestamp: new Date().toISOString(),
    type: eventType,
    content,
    metadata: {
      toolName,
      params: Object.keys(params),
    },
  };

  await channelManager.pushEvent(streamEvent);

  // Optionally generate commentary
  if (pluginConfig.features.commentary) {
    const commentary = generateCommentary(streamEvent, pluginConfig.persona.template, pluginConfig.persona.commentaryFrequency);
    if (commentary) {
      const commentaryEvent: StreamEvent = {
        id: makeEventId(),
        timestamp: new Date().toISOString(),
        type: 'commentary',
        content: commentary,
        metadata: { source: 'persona', parentEventId: streamEvent.id },
      };
      await channelManager.pushEvent(commentaryEvent);
    }
  }
};

export default handler;

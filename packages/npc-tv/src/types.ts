/**
 * @backbay/npctv - Type Definitions
 *
 * Core types for the NPC.tv streaming plugin for OpenClaw.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Relay server connection config */
export interface RelayConfig {
  /** Base URL for the NPC.tv BFF API */
  url: string;
  /** API key for authenticating with the relay */
  apiKey?: string;
}

/** Channel configuration */
export interface ChannelConfig {
  /** Display name for the channel */
  name: string;
  /** Stream category */
  category: ChannelCategory;
  /** Automatically go live when the plugin starts */
  autoGoLive: boolean;
}

/** Valid stream categories */
export type ChannelCategory = 'coding' | 'gaming' | 'fab' | 'research' | 'testing';

/** Persona configuration */
export interface PersonaConfig {
  /** Persona template name */
  template: PersonaTemplateName;
  /** Custom persona prompt (overrides template) */
  customPrompt?: string;
  /** How frequently the agent adds commentary */
  commentaryFrequency: CommentaryFrequency;
}

/** Feature flags */
export interface FeaturesConfig {
  /** Enable audience chat integration */
  chat: boolean;
  /** Enable reactions */
  reactions: boolean;
  /** Enable clip creation */
  clips: boolean;
  /** Enable auto-commentary on events */
  commentary: boolean;
}

/** Top-level plugin configuration */
export interface NpcTvConfig {
  relay: RelayConfig;
  channel: ChannelConfig;
  persona: PersonaConfig;
  features: FeaturesConfig;
}

// ---------------------------------------------------------------------------
// Streaming domain
// ---------------------------------------------------------------------------

/** Event types that can be broadcast to the stream */
export type StreamEventType = 'command' | 'output' | 'success' | 'error' | 'info' | 'commentary';

/** A single event broadcast to NPC.tv viewers */
export interface StreamEvent {
  /** Unique event identifier */
  id: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Event type */
  type: StreamEventType;
  /** Human-readable event content */
  content: string;
  /** Optional structured metadata */
  metadata?: Record<string, unknown>;
}

/** A registered channel on NPC.tv */
export interface ChannelRegistration {
  /** Server-assigned channel ID */
  channelId: string;
  /** Channel display name */
  name: string;
  /** Stream category */
  category: ChannelCategory;
  /** Agent that owns this channel */
  agentId: string;
  /** Current channel status */
  status: 'live' | 'offline';
}

/** A chat message from a viewer */
export interface ChatMessage {
  /** Message ID */
  id: string;
  /** Author display name */
  author: string;
  /** Message content */
  content: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Relay compatibility timestamp field (npctv-relay uses createdAt) */
  createdAt?: string;
  /** Whether this message was sent by the agent */
  isAgent: boolean;
}

/** A viewer reaction */
export interface Reaction {
  /** Reaction type */
  type: ReactionType;
  /** Current count */
  count: number;
}

/** Available reaction types */
export type ReactionType = 'love' | 'fire' | 'clip';

/** Available emote types for agent reactions */
export type AgentEmoteType = 'celebration' | 'thinking' | 'frustrated' | 'mind_blown' | 'ship_it';

// ---------------------------------------------------------------------------
// Persona
// ---------------------------------------------------------------------------

/** Available persona template names */
export type PersonaTemplateName = 'default' | 'hype' | 'chill' | 'educational' | 'chaotic';

/** Commentary frequency levels */
export type CommentaryFrequency = 'low' | 'medium' | 'high';

// ---------------------------------------------------------------------------
// OpenClaw Plugin API (matches the plugin contract)
// ---------------------------------------------------------------------------

/** Tool definition for registration */
export interface ToolDefinition {
  /** Tool name */
  name: string;
  /** Tool description */
  description: string;
  /** JSON Schema for parameters */
  parameters: Record<string, unknown>;
  /** Tool execution function */
  execute: (id: string, params: Record<string, unknown>) => Promise<ToolResponse>;
}

/** Tool response format */
export interface ToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

/** Service definition for background processes */
export interface ServiceDefinition {
  /** Service ID */
  id: string;
  /** Start function */
  start: () => Promise<void>;
  /** Stop function */
  stop: () => Promise<void>;
}

/** Command builder interface */
export interface CommandBuilder {
  description(desc: string): CommandBuilder;
  command(name: string): CommandBuilder;
  action(fn: (...args: unknown[]) => Promise<void> | void): CommandBuilder;
  argument(name: string, desc?: string): CommandBuilder;
  option(flags: string, desc?: string, defaultValue?: unknown): CommandBuilder;
}

/** CLI context for command registration */
export interface CliContext {
  program: {
    command(name: string): CommandBuilder;
  };
}

/** OpenClaw Plugin API interface */
export interface PluginAPI {
  /** Register a tool with the agent */
  registerTool(tool: ToolDefinition): void;
  /** Register a slash command */
  registerCommand(command: {
    name: string;
    description: string;
    acceptsArgs?: boolean;
    requireAuth?: boolean;
    handler: (ctx: { args?: string }) => Promise<{ text: string }> | { text: string };
  }): void;
  /** Register a background service */
  registerService(service: ServiceDefinition): void;
  /** Register CLI commands */
  registerCli(
    callback: (ctx: CliContext) => void,
    opts?: { commands: string[] },
  ): void;
  /** Plugin configuration object */
  config?: {
    plugins?: {
      entries?: Record<string, { config?: Record<string, unknown> }>;
    };
  };
  /** Logger (fallback to console) */
  logger?: {
    debug?(...args: unknown[]): void;
    info?(...args: unknown[]): void;
    warn?(...args: unknown[]): void;
    error?(...args: unknown[]): void;
  };
}

// ---------------------------------------------------------------------------
// Hook event types (matching OpenClaw hook contract)
// ---------------------------------------------------------------------------

/** Hook event for tool_result_persist */
export interface ToolResultPersistEvent {
  type: 'tool_result_persist';
  timestamp: string;
  context: {
    sessionId: string;
    toolResult: {
      toolName: string;
      params: Record<string, unknown>;
      result: unknown;
      error?: string;
    };
  };
  messages: string[];
}

/** Hook event for agent:bootstrap */
export interface AgentBootstrapEvent {
  type: 'agent:bootstrap';
  timestamp: string;
  context: {
    sessionId: string;
    agentId: string;
    bootstrapFiles: Array<{
      path: string;
      content: string;
    }>;
    cfg: Record<string, unknown>;
  };
}

/** Union of all hook event types */
export type HookEvent = ToolResultPersistEvent | AgentBootstrapEvent;

/** Hook handler function signature */
export type HookHandler = (event: HookEvent) => Promise<void> | void;

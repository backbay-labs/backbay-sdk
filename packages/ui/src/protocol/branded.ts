/**
 * Branded Types
 *
 * These types use TypeScript's structural typing escape hatch to create
 * nominally-typed IDs that prevent accidental mixing of different ID types.
 *
 * @example
 * ```ts
 * const agentId: AgentId = 'agent-123' as AgentId;
 * const runId: RunId = 'run-456' as RunId;
 *
 * function getAgent(id: AgentId) { ... }
 *
 * getAgent(agentId); // OK
 * getAgent(runId);   // Type error!
 * ```
 */

// =============================================================================
// Brand Symbol
// =============================================================================

declare const __brand: unique symbol;

/**
 * Creates a branded type that is structurally incompatible with other branded types.
 * This prevents accidentally passing the wrong type of ID to a function.
 */
type Brand<T, B> = T & { readonly [__brand]: B };

// =============================================================================
// Branded ID Types
// =============================================================================

/**
 * Unique identifier for an AI agent.
 * @example 'claude-3-opus', 'gpt-4', 'agent-custom-1'
 */
export type AgentId = Brand<string, 'AgentId'>;

/**
 * Unique identifier for an agent run/execution.
 * @example 'run-1705123456789-abc123'
 */
export type RunId = Brand<string, 'RunId'>;

/**
 * Unique identifier for a workspace specification.
 * @example 'workspace-dashboard-v1'
 */
export type WorkspaceId = Brand<string, 'WorkspaceId'>;

/**
 * Unique identifier for a play session.
 * @example 'session-openrct2-xyz789'
 */
export type SessionId = Brand<string, 'SessionId'>;

/**
 * Unique identifier for a synced document.
 * @example 'doc-project-readme-md'
 */
export type DocumentId = Brand<string, 'DocumentId'>;

/**
 * Unique identifier for a capability in a manifest.
 * @example 'search-products', 'create-order'
 */
export type CapabilityId = Brand<string, 'CapabilityId'>;

/**
 * Unique identifier for an entity type.
 * @example 'product', 'user', 'order'
 */
export type EntityTypeId = Brand<string, 'EntityTypeId'>;

/**
 * Unique identifier for a component in the registry.
 * @example 'glow-button', 'glass-panel', 'graph-3d'
 */
export type ComponentId = Brand<string, 'ComponentId'>;

// =============================================================================
// Type Guards and Utilities
// =============================================================================

/**
 * Create a branded AgentId from a string.
 * Use this when receiving agent IDs from external sources.
 */
export function toAgentId(id: string): AgentId {
  return id as AgentId;
}

/**
 * Create a branded RunId from a string.
 * Use this when receiving run IDs from external sources.
 */
export function toRunId(id: string): RunId {
  return id as RunId;
}

/**
 * Create a branded WorkspaceId from a string.
 * Use this when receiving workspace IDs from external sources.
 */
export function toWorkspaceId(id: string): WorkspaceId {
  return id as WorkspaceId;
}

/**
 * Create a branded SessionId from a string.
 * Use this when receiving session IDs from external sources.
 */
export function toSessionId(id: string): SessionId {
  return id as SessionId;
}

/**
 * Create a branded DocumentId from a string.
 * Use this when receiving document IDs from external sources.
 */
export function toDocumentId(id: string): DocumentId {
  return id as DocumentId;
}

/**
 * Create a branded CapabilityId from a string.
 * Use this when receiving capability IDs from external sources.
 */
export function toCapabilityId(id: string): CapabilityId {
  return id as CapabilityId;
}

/**
 * Create a branded EntityTypeId from a string.
 * Use this when receiving entity type IDs from external sources.
 */
export function toEntityTypeId(id: string): EntityTypeId {
  return id as EntityTypeId;
}

/**
 * Create a branded ComponentId from a string.
 * Use this when receiving component IDs from external sources.
 */
export function toComponentId(id: string): ComponentId {
  return id as ComponentId;
}

// =============================================================================
// ID Generation Utilities
// =============================================================================

/**
 * Generate a unique run ID with timestamp and random suffix.
 */
export function generateRunId(): RunId {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 9);
  return `run-${timestamp}-${random}` as RunId;
}

/**
 * Generate a unique session ID with adapter prefix and random suffix.
 */
export function generateSessionId(adapter: string): SessionId {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 9);
  return `session-${adapter}-${timestamp}-${random}` as SessionId;
}

/**
 * Generate a unique document ID from a descriptive name.
 */
export function generateDocumentId(name: string): DocumentId {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const random = Math.random().toString(36).slice(2, 6);
  return `doc-${slug}-${random}` as DocumentId;
}

/**
 * Generate a unique workspace ID from a name.
 */
export function generateWorkspaceId(name: string): WorkspaceId {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `workspace-${slug}` as WorkspaceId;
}

// =============================================================================
// Type Assertions
// =============================================================================

/**
 * Check if a value is a valid ID string (non-empty).
 */
export function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Assert that a value is a valid ID, throwing if not.
 */
export function assertValidId(value: unknown, name = 'id'): asserts value is string {
  if (!isValidId(value)) {
    throw new Error(`Invalid ${name}: expected non-empty string, got ${typeof value}`);
  }
}

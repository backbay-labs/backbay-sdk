/**
 * bb-protocol types
 *
 * TypeScript definitions for the bb-ui manifest schema and DOM annotations.
 */

// =============================================================================
// Core Types
// =============================================================================

export type CapabilityType = 'query' | 'mutation' | 'workflow';
export type RiskLevel = 'low' | 'medium' | 'high';
export type InputType = 'string' | 'number' | 'boolean' | 'date' | 'file' | 'select';
export type AuthType = 'none' | 'session' | 'oauth' | 'api-key';
export type ConfirmationType = 'none' | 'optional' | 'required';
export type BBState = 'idle' | 'loading' | 'success' | 'error' | 'disabled' | 'hidden' | 'requires-auth';

// =============================================================================
// Manifest Schema
// =============================================================================

export interface BBManifest {
  /** Schema version */
  version: '1.0';

  /** Human-readable site/project name */
  name: string;

  /** Brief description of the site */
  description: string;

  /** URL to site icon */
  icon?: string;

  /** Support contact email or URL */
  contact?: string;

  /** Link to full documentation */
  documentation?: string;

  /** Available capabilities (actions) */
  capabilities: Capability[];

  /** Entity schemas for structured extraction */
  entities?: Record<string, EntitySchema>;

  /** Authentication configuration */
  auth?: AuthConfig;

  /** Safety and rate limiting constraints */
  constraints?: ConstraintConfig;

  /** Custom extensions */
  extensions?: Record<string, unknown>;
}

// =============================================================================
// Capabilities
// =============================================================================

export interface Capability {
  /** Unique identifier (kebab-case) */
  id: string;

  /** Type of capability */
  type: CapabilityType;

  /** Human & LLM readable description */
  description: string;

  /** URL path where this capability lives */
  entry?: string;

  /** CSS selector for the action trigger */
  selector: string;

  /** Input fields for this capability */
  inputs?: InputField[];

  /** Output fields from this capability */
  outputs?: OutputField[];

  /** Cost estimate for this capability */
  cost?: CostEstimate;

  /** Latency estimate for this capability */
  latency?: LatencyEstimate;

  /** Preconditions (e.g., "authenticated", "cart-not-empty") */
  requires?: string[];

  /** Whether human confirmation is needed */
  confirmation?: ConfirmationType;

  /** Steps for workflow type capabilities */
  steps?: string[];
}

export interface InputField {
  /** Field name */
  name: string;

  /** Field type */
  type: InputType;

  /** Whether field is required */
  required?: boolean;

  /** Default value */
  default?: unknown;

  /** Options for select type */
  options?: string[];

  /** Data attribute to read from (e.g., "data-bb-entity-id") */
  from?: string;

  /** CSS selector for input element */
  selector?: string;
}

export interface OutputField {
  /** Field name */
  name: string;

  /** Field type (primitive or entity reference like "product[]") */
  type: string;

  /** CSS selector for output element */
  selector?: string;
}

export interface CostEstimate {
  /** USD cost (number or "variable") */
  usd?: number | 'variable';

  /** Token count estimate */
  tokens?: number;

  /** Risk level */
  risk: RiskLevel;
}

export interface LatencyEstimate {
  /** Typical latency in milliseconds */
  typical: number;

  /** Maximum expected latency in milliseconds */
  max?: number;
}

// =============================================================================
// Entities
// =============================================================================

export interface EntitySchema {
  /** CSS selector for entity container */
  selector: string;

  /** Field mappings: name -> selector or data attribute */
  fields: Record<string, string>;

  /** Capability IDs that operate on this entity */
  actions?: string[];
}

// =============================================================================
// Authentication
// =============================================================================

export interface AuthConfig {
  /** Authentication type */
  type: AuthType;

  /** URL for login page */
  loginUrl?: string;

  /** URL for logout */
  logoutUrl?: string;

  /** Selector that exists when logged in */
  indicator?: string;

  /** OAuth scopes */
  scopes?: string[];

  /** Header name for API key auth */
  header?: string;

  /** Documentation URL for API keys */
  documentationUrl?: string;
}

// =============================================================================
// Constraints
// =============================================================================

export interface ConstraintConfig {
  /** Rate limiting configuration */
  rateLimit?: {
    /** Number of requests allowed */
    requests: number;
    /** Time window (e.g., "1m", "1h", "1d") */
    window: string;
  };

  /** Capability IDs that always require human confirmation */
  requiresHuman?: string[];

  /** User-agent patterns to block */
  blockedAgents?: string[];

  /** If set, only these agents are allowed */
  allowedAgents?: string[];
}

// =============================================================================
// DOM Annotation Attributes
// =============================================================================

/**
 * All data-bb-* attributes that can appear on DOM elements
 */
export interface BBAttributes {
  /** Marks an actionable element (capability id) */
  'data-bb-action'?: string;

  /** Marks an entity container (entity type) */
  'data-bb-entity'?: string;

  /** Unique ID for an entity instance */
  'data-bb-entity-id'?: string;

  /** Marks a field within an entity */
  'data-bb-field'?: string;

  /** Marks a form input */
  'data-bb-input'?: string;

  /** Marks where output appears */
  'data-bb-output'?: string;

  /** Current state of an element */
  'data-bb-state'?: BBState;

  /** Requires human confirmation */
  'data-bb-confirm'?: 'true' | 'false';

  /** Hidden description for agents */
  'data-bb-description'?: string;

  /** Type hint for value parsing */
  'data-bb-type'?: 'string' | 'number' | 'currency' | 'date' | 'boolean';

  /** Currency code for currency type */
  'data-bb-currency'?: string;

  /** JSON-encoded inputs */
  'data-bb-inputs'?: string;

  /** JSON-encoded cost estimate */
  'data-bb-cost'?: string;

  /** Auth state indicator */
  'data-bb-auth'?: 'logged-in' | 'logged-out';
}

// =============================================================================
// Component Types (for bb-components pillar)
// =============================================================================

export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'offline';
export type ConflictResolution = 'keep_local' | 'use_remote' | 'create_copy';
export type RunStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
export type PlaySessionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SyncConflict<T> {
  local: T;
  remote: T;
  localTimestamp: number;
  remoteTimestamp: number;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  costPerRun: number;
  reproducibility?: 'exact' | 'partial' | 'non-deterministic';
}

export interface AgentRun {
  id: string;
  agentId: string;
  prompt: string;
  context?: Record<string, unknown>;
  status: RunStatus;
  output?: string;
  error?: string;
  cost?: number;
  tokenCount?: number;
  latencyMs?: number;
  startedAt: number;
  completedAt?: number;
}

export interface PlaySessionData {
  id: string;
  adapter: string;
  capabilityToken: string;
  createdAt: number;
  expiresAt?: number;
  livekitUrl?: string;
  livekitToken?: string;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface IntensityValues {
  /** Overall intensity 0-1 */
  intensity: number;
  /** Agent presence 0-1 */
  presence: number;
  /** Current activity level 0-1 */
  activity: number;
  /** Pulse animation amplitude 0-1 */
  breathing: number;
}

// =============================================================================
// Run Stream Events
// =============================================================================

export type RunEventType = 'connected' | 'status' | 'output' | 'completed' | 'failed' | 'cancelled';

export interface RunEvent {
  type: RunEventType;
  runId: string;
  timestamp: number;
  data?: {
    status?: RunStatus;
    output?: string;
    error?: string;
    run?: AgentRun;
  };
}

// =============================================================================
// Provider Config
// =============================================================================

export interface BBConfig {
  /** Base URL for API calls */
  apiBaseUrl: string;

  /** Debounce time for sync operations (ms) */
  syncDebounce?: number;

  /** Default conflict resolution strategy */
  conflictResolution?: 'prompt' | 'local-wins' | 'remote-wins';

  /** Whether to track costs */
  costTracking?: boolean;

  /** Custom headers for API calls */
  headers?: Record<string, string>;
}

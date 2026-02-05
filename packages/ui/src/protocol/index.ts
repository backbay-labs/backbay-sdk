/**
 * bb-protocol - Discovery and execution layer for agent-native websites
 */

// Types
export type {
  // Core types
  CapabilityType,
  RiskLevel,
  InputType,
  AuthType,
  ConfirmationType,
  BBState,

  // Manifest types
  BBManifest,
  Capability,
  InputField,
  OutputField,
  CostEstimate,
  LatencyEstimate,
  EntitySchema,
  AuthConfig,
  ConstraintConfig,
  BBAttributes,

  // Component types
  SyncStatus,
  ConflictResolution,
  RunStatus,
  PlaySessionStatus,
  SyncConflict,
  Agent,
  AgentRun,
  PlaySessionData,
  JsonRpcResponse,
  IntensityValues,
  RunEventType,
  RunEvent,
  BBConfig,
} from './types.js';

// Schema validation
export {
  // Schemas
  BBManifestSchema,
  CapabilitySchema,
  EntitySchemaSchema,
  AuthConfigSchema,
  ConstraintConfigSchema,
  InputFieldSchema,
  OutputFieldSchema,
  CostEstimateSchema,
  LatencyEstimateSchema,
  CapabilityTypeSchema,
  RiskLevelSchema,
  InputTypeSchema,
  AuthTypeSchema,
  ConfirmationTypeSchema,
  BBStateSchema,

  // Validation functions
  validateManifest,
  parseManifest,
  validateCapability,
  validateEntitySchema,

  // Inferred types
  type ManifestValidationResult,
  type BBManifestInput,
  type BBManifestOutput,
  type CapabilityInput,
  type EntitySchemaInput,
} from './schema.js';

// Branded types
export type {
  AgentId,
  RunId,
  WorkspaceId,
  SessionId,
  DocumentId,
  CapabilityId,
  EntityTypeId,
  ComponentId,
} from './branded.js';

export {
  // Type constructors
  toAgentId,
  toRunId,
  toWorkspaceId,
  toSessionId,
  toDocumentId,
  toCapabilityId,
  toEntityTypeId,
  toComponentId,

  // ID generators
  generateRunId,
  generateSessionId,
  generateDocumentId,
  generateWorkspaceId,

  // Validation
  isValidId,
  assertValidId,
} from './branded.js';

// DOM utilities
export {
  // Element queries
  findAction,
  findAllActions,
  findAllActionElements,
  findEntity,
  findAllEntities,
  findField,
  findInput,
  findOutput,
  isAuthenticated,

  // Attribute reading
  getActionId,
  getEntityType,
  getEntityId,
  getFieldName,
  getState,
  requiresConfirmation,
  getDescription,
  getInputs,
  getCost,

  // Entity extraction
  extractEntity,
  extractFieldValue,
  extractAllEntities,

  // State management
  setState,
  waitForState,
  observeState,

  // Action helpers
  getAvailableActions,
  isActionAvailable,

  // Manifest discovery
  findManifestUrl,
  fetchManifest,
} from './dom.js';

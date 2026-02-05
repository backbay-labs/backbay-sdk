// =============================================================================
// Types
// =============================================================================

export type {
  CognitiveMode,
  CognitiveSubmode,
  CognitionSignals,
  PersonaSignals,
  TrapWarning,
  DetailedBalance,
  DynamicsState,
  PersonalityConfig,
  PolicyConfig,
  EvidenceRef,
  CognitionState,
  CognitionEvent,
  CognitionSnapshot,
} from './types.js';

export { clamp01, createInitialCognitionState } from './types.js';

// =============================================================================
// Schema
// =============================================================================

export {
  CognitionStateSchema,
  CognitionSnapshotSchema,
  validateCognitionSnapshot,
} from './schema.js';

export type {
  CognitionSnapshotInput,
  CognitionSnapshotOutput,
  CognitionSnapshotValidationResult,
} from './schema.js';

// =============================================================================
// Reducers
// =============================================================================

export { reduceEvent, reduceDecay, MODE_TRANSITION_MAP } from './reducers.js';

// =============================================================================
// Controller
// =============================================================================

export { CognitionController } from './controller.js';
export type { CognitionControllerOptions } from './controller.js';

// =============================================================================
// Hooks
// =============================================================================

export { useCognition } from './hooks/index.js';
export type { UseCognitionOptions, UseCognitionResult } from './hooks/index.js';

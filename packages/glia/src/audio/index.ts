// =============================================================================
// Types
// =============================================================================

export type {
  AudioFormat,
  VoiceLicenseCategory,
  VoiceCatalogEntry,
  VoiceCatalog,
  AudioPolicy,
  AudioPlannerMode,
  SpeechControls,
  SpeechSynthesisRequest,
  AudioArtifact,
  SpeechSynthesisResult,
  SpeechSynthesisProvider,
  AudioVerifier,
  AudioGateResult,
  AudioGates,
  EvidenceRef,
  AudioProof,
} from './types.js';

export { clamp01, createTraceId, DEFAULT_TARGET_AVO } from './types.js';

// =============================================================================
// Schemas
// =============================================================================

export {
  AudioProofSchema,
  validateAudioProof,
  AudioFormatSchema,
  VoiceLicenseCategorySchema,
} from './schema.js';

export type { AudioProofInput, AudioProofOutput, AudioProofValidationResult } from './schema.js';

// =============================================================================
// Planning
// =============================================================================

export { planSpeech, planSpeechFromCognition } from './planner.js';
export type { AudioPlannerInput, AudioPlannerSignals, AudioPlannerCognitionInput } from './planner.js';

// =============================================================================
// Overlay
// =============================================================================

export { DEFAULT_OVERLAY_PHRASES, pickOverlayPhrase } from './overlay.js';
export type { OverlayToken, OverlayPhraseLibrary } from './overlay.js';

// =============================================================================
// Providers
// =============================================================================

export { HttpSpeechSynthesisProvider } from './providers/httpSpeechSynthesisProvider.js';
export type { HttpSpeechSynthesisProviderOptions, HttpSynthesisResponse } from './providers/httpSpeechSynthesisProvider.js';

// =============================================================================
// Hooks
// =============================================================================

export * from './hooks/index.js';

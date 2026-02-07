/**
 * @backbay/glia-agent — Emotion, cognition, and audio systems for AI agents.
 *
 * Extracted from @backbay/glia for independent versioning.
 * Use sub-path imports for granular access:
 *   import { ... } from '@backbay/glia-agent/emotion'
 *   import { ... } from '@backbay/glia-agent/cognition'
 *   import { ... } from '@backbay/glia-agent/audio'
 */

// Emotion — re-export everything (no conflicts within emotion)
export * from './emotion/index.js';

// Cognition — namespace to avoid clashes with audio's EvidenceRef and clamp01
export {
  type CognitiveMode,
  type CognitiveSubmode,
  type CognitionSignals,
  type PersonaSignals,
  type TrapWarning,
  type DetailedBalance,
  type DynamicsState,
  type PersonalityConfig,
  type PolicyConfig,
  type CognitionState,
  type CognitionEvent,
  type CognitionSnapshot,
  createInitialCognitionState,
  CognitionStateSchema,
  CognitionSnapshotSchema,
  validateCognitionSnapshot,
  type CognitionSnapshotInput,
  type CognitionSnapshotOutput,
  type CognitionSnapshotValidationResult,
  reduceEvent,
  reduceDecay,
  MODE_TRANSITION_MAP,
  CognitionController,
  type CognitionControllerOptions,
  useCognition,
  type UseCognitionOptions,
  type UseCognitionResult,
} from './cognition/index.js';

// Audio — namespace to avoid clashes with cognition's EvidenceRef and clamp01
export {
  type AudioFormat,
  type VoiceLicenseCategory,
  type VoiceCatalogEntry,
  type VoiceCatalog,
  type AudioPolicy,
  type AudioPlannerMode,
  type SpeechControls,
  type SpeechSynthesisRequest,
  type AudioArtifact,
  type SpeechSynthesisResult,
  type SpeechSynthesisProvider,
  type AudioVerifier,
  type AudioGateResult,
  type AudioGates,
  type AudioProof,
  AudioProofSchema,
  validateAudioProof,
  AudioFormatSchema,
  VoiceLicenseCategorySchema,
  type AudioProofInput,
  type AudioProofOutput,
  type AudioProofValidationResult,
  planSpeech,
  planSpeechFromCognition,
  type AudioPlannerInput,
  type AudioPlannerSignals,
  type AudioPlannerCognitionInput,
  DEFAULT_OVERLAY_PHRASES,
  pickOverlayPhrase,
  type OverlayToken,
  type OverlayPhraseLibrary,
  HttpSpeechSynthesisProvider,
  type HttpSpeechSynthesisProviderOptions,
  type HttpSynthesisResponse,
} from './audio/index.js';

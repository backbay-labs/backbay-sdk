import type { AVO } from '../emotion/types.js';
import type { CognitionState } from '../cognition/types.js';
import type {
  AudioPolicy,
  AudioPlannerMode,
  SpeechControls,
  SpeechSynthesisRequest,
  VoiceCatalog,
} from './types.js';
import { clamp01, createTraceId, DEFAULT_TARGET_AVO } from './types.js';

// =============================================================================
// Types
// =============================================================================

export interface AudioPlannerSignals {
  mode?: AudioPlannerMode;
  personaDriftRisk?: number;
  confidence?: number;
  risk?: number;
}

export interface AudioPlannerInput {
  text: string;
  language?: string;
  runId?: string;

  targetAffect?: AVO;

  policy: AudioPolicy;
  voices: VoiceCatalog;

  signals?: AudioPlannerSignals;
  defaults?: {
    voiceId?: string;
    groundedVoiceTag?: string;
    defaultVoiceTag?: string;
    temperature?: number;
  };
}

// =============================================================================
// Planning Helpers
// =============================================================================

function pickFirstAllowedVoiceId(voices: VoiceCatalog, allowedVoiceIds?: string[]): string | null {
  const list = voices.list();
  for (const entry of list) {
    if (!allowedVoiceIds || allowedVoiceIds.includes(entry.voiceId)) {
      return entry.voiceId;
    }
  }
  return null;
}

function pickVoiceId(args: {
  voices: VoiceCatalog;
  allowedVoiceIds?: string[];
  preferredVoiceId?: string;
  requiredTag?: string;
}): string | null {
  const { voices, allowedVoiceIds, preferredVoiceId, requiredTag } = args;

  if (preferredVoiceId) {
    const entry = voices.get(preferredVoiceId);
    if (entry && (!allowedVoiceIds || allowedVoiceIds.includes(entry.voiceId))) {
      if (!requiredTag || (entry.tags ?? []).includes(requiredTag)) {
        return entry.voiceId;
      }
    }
  }

  for (const entry of voices.list()) {
    if (allowedVoiceIds && !allowedVoiceIds.includes(entry.voiceId)) continue;
    if (requiredTag && !(entry.tags ?? []).includes(requiredTag)) continue;
    return entry.voiceId;
  }

  return null;
}

function stripExcessPunctuation(text: string): string {
  return (
    text
      // Collapse repeated punctuation which can cause prosody weirdness.
      .replace(/[!?]{2,}/g, (m) => m[0] ?? '!')
      .replace(/\.{3,}/g, '…')
  );
}

function clampTextForSafetyMode(text: string): string {
  // Keep semantics unchanged; only reduce overly-emphatic punctuation.
  return stripExcessPunctuation(text).replace(/!/g, '.');
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Default planner for Architecture A (modular pipeline).
 *
 * Produces a `SpeechSynthesisRequest` that a self-hosted backend can execute.
 */
export function planSpeech(input: AudioPlannerInput): SpeechSynthesisRequest {
  const {
    text,
    language,
    runId,
    targetAffect,
    policy,
    voices,
    signals,
    defaults,
  } = input;

  const personaDriftRisk = clamp01(signals?.personaDriftRisk ?? 0);
  const confidence = clamp01(signals?.confidence ?? 0.8);
  const risk = clamp01(signals?.risk ?? (1 - confidence));

  const groundedVoiceTag = defaults?.groundedVoiceTag ?? 'grounded';
  const defaultVoiceTag = defaults?.defaultVoiceTag ?? 'default';

  const requireGrounded =
    policy.safetyMode || personaDriftRisk >= 0.6 || (risk >= 0.7 && confidence <= 0.5);

  const voiceId =
    (requireGrounded
      ? pickVoiceId({
          voices,
          allowedVoiceIds: policy.allowedVoiceIds,
          preferredVoiceId: defaults?.voiceId,
          requiredTag: groundedVoiceTag,
        })
      : pickVoiceId({
          voices,
          allowedVoiceIds: policy.allowedVoiceIds,
          preferredVoiceId: defaults?.voiceId,
          requiredTag: defaultVoiceTag,
        })) ??
    pickVoiceId({
      voices,
      allowedVoiceIds: policy.allowedVoiceIds,
      preferredVoiceId: defaults?.voiceId,
    }) ??
    pickFirstAllowedVoiceId(voices, policy.allowedVoiceIds);

  if (!voiceId) {
    throw new Error('No available voices (voice catalog is empty or policy blocks all voices)');
  }

  const baseTemperature = clamp01(defaults?.temperature ?? 0.65);
  const temperature = requireGrounded ? Math.min(baseTemperature, 0.25) : baseTemperature;

  const controls: SpeechControls = {
    temperature,
  };

  const plannedText =
    policy.safetyMode || personaDriftRisk >= 0.7
      ? clampTextForSafetyMode(text)
      : stripExcessPunctuation(text);

  return {
    traceId: createTraceId(),
    runId,
    text: plannedText,
    language,
    voiceId,
    targetAffect: targetAffect ?? DEFAULT_TARGET_AVO,
    controls,
    policy: {
      safetyMode: policy.safetyMode,
      trustTier: policy.trustTier,
      voiceCloningAllowed: policy.voiceCloningAllowed,
    },
  };
}

// =============================================================================
// CognitionState Integration
// =============================================================================

export interface AudioPlannerCognitionInput {
  text: string;
  language?: string;
  runId?: string;
  targetAffect?: AVO;
  cognition: CognitionState;
  policy: AudioPolicy;
  voices: VoiceCatalog;
  defaults?: {
    voiceId?: string;
    groundedVoiceTag?: string;
    defaultVoiceTag?: string;
    temperature?: number;
  };
}

/**
 * Plan speech from full CognitionState.
 * Extracts relevant signals and delegates to planSpeech.
 */
export function planSpeechFromCognition(
  input: AudioPlannerCognitionInput
): SpeechSynthesisRequest {
  const { cognition, ...rest } = input;

  const signals: AudioPlannerSignals = {
    mode: cognition.mode,
    personaDriftRisk: cognition.personaDriftRisk,
    confidence: cognition.confidence,
    risk: cognition.risk,
  };

  const targetAffect = rest.targetAffect ?? cognition.emotionAVO;

  return planSpeech({
    ...rest,
    targetAffect,
    signals,
  });
}

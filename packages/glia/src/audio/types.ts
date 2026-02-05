import type { AVO } from '../emotion/types.js';

// =============================================================================
// Core Types
// =============================================================================

export type AudioFormat = 'wav' | 'pcm_s16le' | 'opus' | 'mp3' | 'flac';

export type VoiceLicenseCategory = 'cc0' | 'cc-by' | 'cc-by-nc' | 'custom' | 'unknown';

export const DEFAULT_TARGET_AVO: AVO = {
  // Match the emotion system's "idle" anchor for a stable neutral baseline.
  arousal: 0.25,
  valence: 0.6,
  openness: 0.35,
};

export interface VoiceCatalogEntry {
  voiceId: string;
  displayName?: string;
  language?: string;
  tags?: string[];
  licenseCategory: VoiceLicenseCategory;
  licenseText?: string;
  source?: string;
}

export interface VoiceCatalog {
  get: (voiceId: string) => VoiceCatalogEntry | null;
  list: () => VoiceCatalogEntry[];
}

// =============================================================================
// Policy
// =============================================================================

export interface AudioPolicy {
  safetyMode: boolean;
  trustTier?: string;
  voiceCloningAllowed: boolean;

  /**
   * If true, callers should avoid playing unverified audio.
   * Typically derived from trust tier and safety mode.
   */
  requireProofBeforePlayback?: boolean;

  /**
   * Optional allowlist; if set, speech plans must use one of these voice IDs.
   */
  allowedVoiceIds?: string[];
}

// =============================================================================
// Planning + Synthesis
// =============================================================================

export type AudioPlannerMode =
  | 'idle'
  | 'listening'
  | 'deliberating'
  | 'acting'
  | 'explaining'
  | 'recovering'
  | 'blocked';

export interface SpeechControls {
  /**
   * Expressiveness/diversity knob, when supported by the backend.
   * Recommended range: 0..1 (provider may map differently).
   */
  temperature?: number;

  /**
   * Decode quality / steps knob, when supported by the backend.
   */
  quality?: number;

  /**
   * Free-form provider-specific controls.
   */
  [key: string]: unknown;
}

export interface SpeechSynthesisRequest {
  traceId: string;
  runId?: string;

  text: string;
  language?: string;

  voiceId: string;
  targetAffect: AVO;
  controls?: SpeechControls;

  /**
   * Optional client policy context. Including this enables the server to emit a more accurate
   * `AudioProof.manifest.policy` without having to guess.
   */
  policy?: {
    safetyMode: boolean;
    trustTier?: string;
    voiceCloningAllowed: boolean;
  };
}

export interface AudioArtifact {
  id: string;
  uri?: string;
  format: AudioFormat;
  sha256: string;
  durationMs: number;
  sampleRateHz?: number;
  channels?: number;
}

export interface SpeechSynthesisResult {
  audio: Blob;
  artifact: AudioArtifact;
  proof?: AudioProof;
}

export interface SpeechSynthesisProvider {
  providerId: string;
  synthesizeSpeech: (
    request: SpeechSynthesisRequest,
    options?: { signal?: AbortSignal }
  ) => Promise<SpeechSynthesisResult>;
}

export interface AudioVerifier {
  verifierId: string;
  verifySpeech: (args: {
    request: SpeechSynthesisRequest;
    result: SpeechSynthesisResult;
    policy: AudioPolicy;
  }) => Promise<AudioProof>;
}

// =============================================================================
// AudioProof (verification-first artifact)
// =============================================================================

export interface AudioGateResult {
  passed: boolean;
  metrics?: Record<string, unknown>;
  reason?: string;
}

export interface AudioGates {
  quality: AudioGateResult;
  semantic: AudioGateResult;
  affect: AudioGateResult;

  multimodalConsistency?: AudioGateResult;
  watermark?: AudioGateResult;
  speakerConsistency?: AudioGateResult;
  antiSpoof?: AudioGateResult;
  mos?: AudioGateResult;
  safetyText?: AudioGateResult;
  safetyAudio?: AudioGateResult;
}

export interface EvidenceRef {
  type: 'run' | 'run_receipt' | 'artifact' | 'ui';
  runId?: string;
  receiptHash?: string;
  path?: string;
  digest?: string;
  componentId?: string;
  note?: string;
}

export interface AudioProof {
  version: '1.0';
  createdAt: string;

  manifest: {
    traceId?: string;
    runId?: string;
    text: string;
    language?: string;
    targetAffect: AVO;
    policy: {
      safetyMode: boolean;
      trustTier?: string;
      voiceCloningAllowed: boolean;
    };
    cognitionSnapshot?: {
      snapshotVersion?: string;
      snapshotId?: string;
      [key: string]: unknown;
    };
  };

  proof: {
    synthesis: {
      providerId: string;
      model: {
        id: string;
        revision?: string;
        sha256?: string;
      };
      voice: {
        voiceId: string;
        licenseCategory: VoiceLicenseCategory;
        licenseText?: string;
        source?: string;
      };
      controls?: SpeechControls;
      seed?: number;
    };

    attempts?: Array<{
      attempt: number;
      artifactRef: string;
      notes?: string;
      gates: AudioGates;
    }>;

    artifacts: AudioArtifact[];
    gates: AudioGates;
    evidence?: EvidenceRef[];
  };

  verdict: {
    passed: boolean;
    reason?: string;
    score?: number;
  };
}

// =============================================================================
// Helpers
// =============================================================================

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function createTraceId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `trace_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * Zod schemas for audio proof validation.
 *
 * This is the runtime counterpart of `docs/schemas/audio-proof.schema.json`.
 */

import { z } from 'zod';

// =============================================================================
// Enums
// =============================================================================

export const AudioProofVersionSchema = z.enum(['1.0']);
export const AudioFormatSchema = z.enum(['wav', 'pcm_s16le', 'opus', 'mp3', 'flac']);
export const VoiceLicenseCategorySchema = z.enum(['cc0', 'cc-by', 'cc-by-nc', 'custom', 'unknown']);

// =============================================================================
// Nested Schemas
// =============================================================================

export const AvoSchema = z.object({
  valence: z.number().min(0).max(1),
  arousal: z.number().min(0).max(1),
  openness: z.number().min(0).max(1),
});

export const AudioArtifactSchema = z.object({
  id: z.string().min(1),
  uri: z.string().optional(),
  format: AudioFormatSchema,
  sha256: z.string().min(32),
  sampleRateHz: z.number().int().min(8000).optional(),
  channels: z.number().int().min(1).max(8).optional(),
  durationMs: z.number().int().min(1),
});

export const AudioGateResultSchema = z.object({
  passed: z.boolean(),
  metrics: z.record(z.string(), z.unknown()).optional(),
  reason: z.string().optional(),
});

export const AudioGatesSchema = z.object({
  quality: AudioGateResultSchema,
  semantic: AudioGateResultSchema,
  affect: AudioGateResultSchema,

  multimodalConsistency: AudioGateResultSchema.optional(),
  watermark: AudioGateResultSchema.optional(),
  speakerConsistency: AudioGateResultSchema.optional(),
  antiSpoof: AudioGateResultSchema.optional(),
  mos: AudioGateResultSchema.optional(),
  safetyText: AudioGateResultSchema.optional(),
  safetyAudio: AudioGateResultSchema.optional(),
});

export const EvidenceRefSchema = z.object({
  type: z.enum(['run', 'run_receipt', 'artifact', 'ui']),
  runId: z.string().optional(),
  receiptHash: z.string().optional(),
  path: z.string().optional(),
  digest: z.string().optional(),
  componentId: z.string().optional(),
  note: z.string().optional(),
});

// =============================================================================
// Main Schema
// =============================================================================

export const AudioProofSchema = z.object({
  version: AudioProofVersionSchema,
  createdAt: z.string().datetime(),

  manifest: z.object({
    traceId: z.string().optional(),
    runId: z.string().optional(),
    text: z.string().min(1),
    language: z.string().optional(),
    targetAffect: AvoSchema,
    policy: z.object({
      safetyMode: z.boolean(),
      trustTier: z.string().optional(),
      voiceCloningAllowed: z.boolean(),
    }),
    cognitionSnapshot: z.record(z.string(), z.unknown()).optional(),
  }),

  proof: z.object({
    synthesis: z.object({
      providerId: z.string().min(1),
      model: z.object({
        id: z.string().min(1),
        revision: z.string().optional(),
        sha256: z.string().optional(),
      }),
      voice: z.object({
        voiceId: z.string().min(1),
        licenseCategory: VoiceLicenseCategorySchema,
        licenseText: z.string().optional(),
        source: z.string().optional(),
      }),
      controls: z.record(z.string(), z.unknown()).optional(),
      seed: z.number().int().min(0).optional(),
    }),

    attempts: z
      .array(
        z.object({
          attempt: z.number().int().min(1),
          artifactRef: z.string().min(1),
          notes: z.string().optional(),
          gates: AudioGatesSchema,
        })
      )
      .optional(),

    artifacts: z.array(AudioArtifactSchema).min(1),
    gates: AudioGatesSchema,
    evidence: z.array(EvidenceRefSchema).optional(),
  }),

  verdict: z.object({
    passed: z.boolean(),
    reason: z.string().optional(),
    score: z.number().optional(),
  }),
});

export type AudioProofInput = z.input<typeof AudioProofSchema>;
export type AudioProofOutput = z.output<typeof AudioProofSchema>;

export type AudioProofValidationResult =
  | { success: true; data: AudioProofOutput }
  | { success: false; errors: z.ZodError };

export function validateAudioProof(audioProof: unknown): AudioProofValidationResult {
  const result = AudioProofSchema.safeParse(audioProof);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}


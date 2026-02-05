import { describe, it, expect } from 'vitest';
import { validateAudioProof } from '../../src/audio/schema.js';

describe('validateAudioProof', () => {
  it('accepts a minimal valid AudioProof', () => {
    const proof = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      manifest: {
        traceId: 'trace_1',
        runId: 'run_1',
        text: 'Hello world',
        targetAffect: { valence: 0.5, arousal: 0.5, openness: 0.5 },
        policy: { safetyMode: false, voiceCloningAllowed: false },
      },
      proof: {
        synthesis: {
          providerId: 'http',
          model: { id: 'model_1' },
          voice: { voiceId: 'voice_1', licenseCategory: 'unknown' },
        },
        artifacts: [
          {
            id: 'artifact_1',
            format: 'wav',
            sha256: 'a'.repeat(64),
            durationMs: 1200,
          },
        ],
        gates: {
          quality: { passed: true },
          semantic: { passed: true },
          affect: { passed: true },
        },
      },
      verdict: { passed: true },
    };

    const result = validateAudioProof(proof);
    expect(result.success).toBe(true);
  });

  it('rejects invalid AudioProof', () => {
    const result = validateAudioProof({ version: '1.0' });
    expect(result.success).toBe(false);
  });
});


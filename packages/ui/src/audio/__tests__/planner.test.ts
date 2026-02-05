import { describe, it, expect } from 'vitest';
import { planSpeechFromCognition } from '../planner.js';
import type { CognitionState } from '../../cognition/types.js';
import { createInitialCognitionState } from '../../cognition/types.js';

describe('planSpeechFromCognition', () => {
  const mockVoices = {
    get: (id: string) =>
      id === 'v1'
        ? { voiceId: 'v1', licenseCategory: 'cc0' as const, tags: ['default', 'grounded'] }
        : null,
    list: () => [
      { voiceId: 'v1', licenseCategory: 'cc0' as const, tags: ['default', 'grounded'] },
    ],
  };

  const basePolicy = {
    safetyMode: false,
    voiceCloningAllowed: false,
  };

  it('extracts signals from CognitionState', () => {
    const cognition: CognitionState = createInitialCognitionState({
      mode: 'explaining',
      confidence: 0.9,
      risk: 0.1,
      personaDriftRisk: 0.1,
    });

    const request = planSpeechFromCognition({
      text: 'Hello world',
      cognition,
      policy: basePolicy,
      voices: mockVoices,
    });

    expect(request.voiceId).toBe('v1');
    expect(request.text).toBe('Hello world');
  });

  it('uses grounded voice when personaDriftRisk is high', () => {
    const cognition: CognitionState = createInitialCognitionState({
      mode: 'explaining',
      personaDriftRisk: 0.7,
    });

    const request = planSpeechFromCognition({
      text: 'Hello!!! World!!!',
      cognition,
      policy: basePolicy,
      voices: mockVoices,
    });

    // Exclamation marks should be clamped
    expect(request.text).not.toContain('!!!');
  });
});

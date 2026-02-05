import { describe, it, expect } from 'vitest';
import { planSpeech } from '../../src/audio/planner.js';
import type { VoiceCatalog, VoiceCatalogEntry, AudioPolicy } from '../../src/audio/types.js';

function makeCatalog(entries: VoiceCatalogEntry[]): VoiceCatalog {
  const byId = new Map(entries.map((e) => [e.voiceId, e]));
  return {
    get: (voiceId: string) => byId.get(voiceId) ?? null,
    list: () => [...entries],
  };
}

describe('planSpeech', () => {
  const voices = makeCatalog([
    {
      voiceId: 'voice_default',
      licenseCategory: 'unknown',
      tags: ['default'],
    },
    {
      voiceId: 'voice_grounded',
      licenseCategory: 'unknown',
      tags: ['grounded'],
    },
  ]);

  const basePolicy: AudioPolicy = {
    safetyMode: false,
    voiceCloningAllowed: false,
  };

  it('picks default-tagged voice by default', () => {
    const req = planSpeech({
      text: 'Hello!!',
      policy: basePolicy,
      voices,
      defaults: { defaultVoiceTag: 'default', groundedVoiceTag: 'grounded' },
    });
    expect(req.voiceId).toBe('voice_default');
    expect(req.text).toBe('Hello!');
  });

  it('picks grounded voice in safety mode and clamps emphasis', () => {
    const req = planSpeech({
      text: 'This is GREAT!!!',
      policy: { ...basePolicy, safetyMode: true },
      voices,
      defaults: { defaultVoiceTag: 'default', groundedVoiceTag: 'grounded' },
    });
    expect(req.voiceId).toBe('voice_grounded');
    expect(req.text).toBe('This is GREAT.');
    expect(req.controls?.temperature).toBeLessThanOrEqual(0.25);
  });

  it('respects allowedVoiceIds', () => {
    const req = planSpeech({
      text: 'Okay.',
      policy: { ...basePolicy, allowedVoiceIds: ['voice_grounded'] },
      voices,
      defaults: { defaultVoiceTag: 'default', groundedVoiceTag: 'grounded' },
    });
    expect(req.voiceId).toBe('voice_grounded');
  });
});


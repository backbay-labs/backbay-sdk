// packages/bb-ui/src/emotion/__tests__/constants.test.ts
import { describe, it, expect } from 'vitest';
import { ANCHOR_STATES, isValidAVO } from '../constants';

describe('ANCHOR_STATES', () => {
  it('should have all anchor states with valid AVO coordinates', () => {
    for (const [name, avo] of Object.entries(ANCHOR_STATES)) {
      expect(isValidAVO(avo), `${name} should be valid AVO`).toBe(true);
    }
  });

  it('should have arousal, valence, openness all in 0-1 range', () => {
    for (const [name, avo] of Object.entries(ANCHOR_STATES)) {
      expect(avo.arousal).toBeGreaterThanOrEqual(0);
      expect(avo.arousal).toBeLessThanOrEqual(1);
      expect(avo.valence).toBeGreaterThanOrEqual(0);
      expect(avo.valence).toBeLessThanOrEqual(1);
      expect(avo.openness).toBeGreaterThanOrEqual(0);
      expect(avo.openness).toBeLessThanOrEqual(1);
    }
  });

  it('should include all required anchor states', () => {
    const required = [
      'dormant', 'idle', 'attentive', 'listening', 'thinking',
      'responding', 'satisfied', 'error'
    ];
    for (const state of required) {
      expect(ANCHOR_STATES).toHaveProperty(state);
    }
  });
});

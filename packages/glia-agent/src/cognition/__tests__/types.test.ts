import { describe, it, expect } from 'vitest';
import type { CognitiveMode, CognitionState, CognitionEvent } from '../types.js';
import { createInitialCognitionState, clamp01 } from '../types.js';

describe('cognition/types', () => {
  it('createInitialCognitionState returns valid defaults', () => {
    const state = createInitialCognitionState();
    expect(state.mode).toBe('idle');
    expect(state.attention).toBeGreaterThanOrEqual(0);
    expect(state.attention).toBeLessThanOrEqual(1);
    expect(state.personaAnchor).toBe(1);
  });

  it('clamp01 clamps values to 0-1 range', () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(1.5)).toBe(1);
  });
});

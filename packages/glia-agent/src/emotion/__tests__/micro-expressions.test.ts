// packages/bb-ui/src/emotion/__tests__/micro-expressions.test.ts
import { describe, it, expect } from 'vitest';
import { applyMicroExpression, createNoiseGenerator } from '../micro-expressions';
import { DEFAULT_MICRO_CONFIG, ANCHOR_STATES } from '../constants';

describe('createNoiseGenerator', () => {
  it('should return values between -1 and 1', () => {
    const noise = createNoiseGenerator(42);
    for (let i = 0; i < 100; i++) {
      const value = noise(i * 0.1);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('should be deterministic with same seed', () => {
    const noise1 = createNoiseGenerator(42);
    const noise2 = createNoiseGenerator(42);
    expect(noise1(1.5)).toBe(noise2(1.5));
  });

  it('should handle negative time values', () => {
    const noise = createNoiseGenerator(42);
    const value = noise(-5.0);
    expect(value).toBeGreaterThanOrEqual(-1);
    expect(value).toBeLessThanOrEqual(1);
  });

  it('should handle very large time values', () => {
    const noise = createNoiseGenerator(42);
    const value = noise(1000000);
    expect(value).toBeGreaterThanOrEqual(-1);
    expect(value).toBeLessThanOrEqual(1);
  });

  it('should produce continuous values (no sudden jumps)', () => {
    const noise = createNoiseGenerator(42);
    let prev = noise(0);
    for (let t = 0.1; t <= 10; t += 0.1) {
      const curr = noise(t);
      // Values should not jump more than 0.5 in 0.1 time units
      expect(Math.abs(curr - prev)).toBeLessThan(0.5);
      prev = curr;
    }
  });
});

describe('applyMicroExpression', () => {
  it('should return original when disabled', () => {
    const base = ANCHOR_STATES.idle;
    const config = { ...DEFAULT_MICRO_CONFIG, enabled: false };
    const result = applyMicroExpression(base, config, 1.0);
    expect(result).toEqual(base);
  });

  it('should add small variations when enabled', () => {
    const base = ANCHOR_STATES.idle;
    const result = applyMicroExpression(base, DEFAULT_MICRO_CONFIG, 1.0);

    // Should be close but not identical
    expect(result.arousal).not.toBe(base.arousal);
    expect(Math.abs(result.arousal - base.arousal)).toBeLessThan(0.05);
  });

  it('should keep values in valid range', () => {
    const extreme = { arousal: 0.99, valence: 0.01, openness: 0.5 };
    const config = { ...DEFAULT_MICRO_CONFIG, arousalNoise: 0.1, valenceNoise: 0.1 };

    for (let t = 0; t < 10; t++) {
      const result = applyMicroExpression(extreme, config, t);
      expect(result.arousal).toBeGreaterThanOrEqual(0);
      expect(result.arousal).toBeLessThanOrEqual(1);
      expect(result.valence).toBeGreaterThanOrEqual(0);
      expect(result.valence).toBeLessThanOrEqual(1);
    }
  });
});

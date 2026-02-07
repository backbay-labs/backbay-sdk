// packages/bb-ui/src/emotion/__tests__/mapping.test.ts
import { describe, it, expect } from 'vitest';
import { mapArousal, mapValence, mapOpenness, computeVisualState } from '../mapping';
import { ANCHOR_STATES } from '../constants';

describe('mapArousal', () => {
  it('should return slow values at low arousal', () => {
    const result = mapArousal(0);
    expect(result.breathingRate).toBeLessThan(0.5);
    expect(result.ringRotationSpeed).toBeLessThan(0.3);
    expect(result.particleCount).toBeLessThan(30);
  });

  it('should return fast values at high arousal', () => {
    const result = mapArousal(1);
    expect(result.breathingRate).toBeGreaterThan(1.5);
    expect(result.ringRotationSpeed).toBeGreaterThan(1.5);
    expect(result.particleCount).toBeGreaterThan(80);
  });
});

describe('mapValence', () => {
  it('should return cool colors at low valence', () => {
    const result = mapValence(0);
    expect(result.coreHue).toBeGreaterThan(180); // Blue-ish
    expect(result.motionNoise).toBeGreaterThan(0.1);
  });

  it('should return warm colors at high valence', () => {
    const result = mapValence(1);
    expect(result.coreHue).toBeLessThan(60); // Gold-ish
    expect(result.motionNoise).toBeLessThan(0.03);
  });
});

describe('mapOpenness', () => {
  it('should flow inward at low openness', () => {
    const result = mapOpenness(0);
    expect(result.particleFlowDirection).toBeLessThan(0);
    expect(result.particleSpreadAngle).toBeLessThan(50);
  });

  it('should flow outward at high openness', () => {
    const result = mapOpenness(1);
    expect(result.particleFlowDirection).toBeGreaterThan(0);
    expect(result.particleSpreadAngle).toBeGreaterThan(100);
  });
});

describe('computeVisualState', () => {
  it('should combine all three mappings', () => {
    const result = computeVisualState(ANCHOR_STATES.idle);
    expect(result).toHaveProperty('breathingRate');
    expect(result).toHaveProperty('coreHue');
    expect(result).toHaveProperty('particleFlowDirection');
    expect(result).toHaveProperty('overallIntensity');
  });

  it('should produce distinct states for different anchors', () => {
    const idle = computeVisualState(ANCHOR_STATES.idle);
    const error = computeVisualState(ANCHOR_STATES.error);

    expect(idle.coreHue).not.toEqual(error.coreHue);
    expect(idle.motionNoise).not.toEqual(error.motionNoise);
  });
});

// packages/bb-ui/src/emotion/__tests__/transitions.test.ts
import { describe, it, expect } from 'vitest';
import { ease, getTransitionDuration, EASING_FUNCTIONS } from '../transitions';
import { ANCHOR_STATES } from '../constants';

describe('EASING_FUNCTIONS', () => {
  it('should return 0 at t=0 for all functions', () => {
    expect(EASING_FUNCTIONS.linear(0)).toBe(0);
    expect(EASING_FUNCTIONS.easeIn(0)).toBe(0);
    expect(EASING_FUNCTIONS.easeOut(0)).toBe(0);
    expect(EASING_FUNCTIONS.easeInOut(0)).toBe(0);
    expect(EASING_FUNCTIONS.spring(0)).toBe(0);
  });

  it('should return 1 at t=1 for all functions', () => {
    expect(EASING_FUNCTIONS.linear(1)).toBe(1);
    expect(EASING_FUNCTIONS.easeIn(1)).toBe(1);
    expect(EASING_FUNCTIONS.easeOut(1)).toBe(1);
    expect(EASING_FUNCTIONS.easeInOut(1)).toBe(1);
    expect(EASING_FUNCTIONS.spring(1)).toBe(1);
  });
});

describe('ease', () => {
  it('should return 0 at t=0 for all functions', () => {
    expect(ease('linear', 0)).toBe(0);
    expect(ease('easeIn', 0)).toBe(0);
    expect(ease('easeOut', 0)).toBe(0);
    expect(ease('easeInOut', 0)).toBe(0);
  });

  it('should return 1 at t=1 for all functions', () => {
    expect(ease('linear', 1)).toBe(1);
    expect(ease('easeIn', 1)).toBe(1);
    expect(ease('easeOut', 1)).toBe(1);
    expect(ease('easeInOut', 1)).toBe(1);
  });

  it('should return 0.5 at t=0.5 for linear', () => {
    expect(ease('linear', 0.5)).toBe(0.5);
  });

  it('easeIn should be slower at start (< 0.5 at t=0.5)', () => {
    expect(ease('easeIn', 0.5)).toBeLessThan(0.5);
  });

  it('easeOut should be faster at start (> 0.5 at t=0.5)', () => {
    expect(ease('easeOut', 0.5)).toBeGreaterThan(0.5);
  });

  it('should clamp values below 0 to 0', () => {
    expect(ease('linear', -0.5)).toBe(0);
    expect(ease('easeIn', -1)).toBe(0);
  });

  it('should clamp values above 1 to 1', () => {
    expect(ease('linear', 1.5)).toBe(1);
    expect(ease('easeIn', 2)).toBe(1);
  });
});

describe('getTransitionDuration', () => {
  it('should return shorter duration for small changes', () => {
    // idle -> attentive is a small change (low AVO distance)
    const small = getTransitionDuration(ANCHOR_STATES.idle, ANCHOR_STATES.attentive);
    // idle -> enthusiastic is a large change (high AVO distance, but not urgent)
    const large = getTransitionDuration(ANCHOR_STATES.idle, ANCHOR_STATES.enthusiastic);
    expect(small).toBeLessThan(large);
  });

  it('should return urgent duration (< 400ms) for sudden negative changes', () => {
    // satisfied -> error is a sudden negative change (valence drops, arousal spikes)
    const urgent = getTransitionDuration(ANCHOR_STATES.satisfied, ANCHOR_STATES.error);
    expect(urgent).toBeLessThan(400);
  });

  it('should return reasonable duration for same state', () => {
    const duration = getTransitionDuration(ANCHOR_STATES.idle, ANCHOR_STATES.idle);
    expect(duration).toBeGreaterThanOrEqual(200);
  });

  it('should return longer duration for recovery transitions', () => {
    // error -> satisfied is a recovery
    const recovery = getTransitionDuration(ANCHOR_STATES.error, ANCHOR_STATES.satisfied);
    // Recovery should have a base of 600ms plus distance factor
    expect(recovery).toBeGreaterThan(600);
  });
});

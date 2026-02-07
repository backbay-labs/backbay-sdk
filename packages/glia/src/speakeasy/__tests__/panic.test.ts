/**
 * Tests for panic gesture detection
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PANIC_GESTURE_PATTERN,
  isPanicGesture,
  type PanicGesturePattern,
} from '../doorman/panic.js';
import type { GestureSequence, GestureStep } from '../types.js';

function createSequence(steps: GestureStep[]): GestureSequence {
  return {
    steps,
    totalDurationMs: 5000,
    rhythmHash: 'abc123',
    timestamp: Date.now(),
  };
}

describe('isPanicGesture', () => {
  describe('with default pattern (5 taps center + 2.5s hold edge)', () => {
    it('detects valid panic gesture', () => {
      const sequence = createSequence([
        { type: 'tap', count: 5, region: 'center' },
        { type: 'hold', durationMs: 3000, region: 'edge' },
      ]);
      expect(isPanicGesture(sequence)).toBe(true);
    });

    it('detects panic with more taps than required', () => {
      const sequence = createSequence([
        { type: 'tap', count: 7, region: 'center' },
        { type: 'hold', durationMs: 2500, region: 'edge' },
      ]);
      expect(isPanicGesture(sequence)).toBe(true);
    });

    it('detects panic with longer hold than required', () => {
      const sequence = createSequence([
        { type: 'tap', count: 5, region: 'center' },
        { type: 'hold', durationMs: 5000, region: 'edge' },
      ]);
      expect(isPanicGesture(sequence)).toBe(true);
    });

    it('rejects insufficient tap count', () => {
      const sequence = createSequence([
        { type: 'tap', count: 4, region: 'center' },
        { type: 'hold', durationMs: 3000, region: 'edge' },
      ]);
      expect(isPanicGesture(sequence)).toBe(false);
    });

    it('rejects insufficient hold duration', () => {
      const sequence = createSequence([
        { type: 'tap', count: 5, region: 'center' },
        { type: 'hold', durationMs: 2000, region: 'edge' },
      ]);
      expect(isPanicGesture(sequence)).toBe(false);
    });

    it('rejects wrong tap region', () => {
      const sequence = createSequence([
        { type: 'tap', count: 5, region: 'edge' }, // Should be center
        { type: 'hold', durationMs: 3000, region: 'edge' },
      ]);
      expect(isPanicGesture(sequence)).toBe(false);
    });

    it('rejects wrong hold region', () => {
      const sequence = createSequence([
        { type: 'tap', count: 5, region: 'center' },
        { type: 'hold', durationMs: 3000, region: 'center' }, // Should be edge
      ]);
      expect(isPanicGesture(sequence)).toBe(false);
    });

    it('rejects missing tap', () => {
      const sequence = createSequence([
        { type: 'hold', durationMs: 3000, region: 'edge' },
      ]);
      expect(isPanicGesture(sequence)).toBe(false);
    });

    it('rejects missing hold', () => {
      const sequence = createSequence([
        { type: 'tap', count: 5, region: 'center' },
      ]);
      expect(isPanicGesture(sequence)).toBe(false);
    });

    it('rejects empty sequence', () => {
      const sequence = createSequence([]);
      expect(isPanicGesture(sequence)).toBe(false);
    });

    it('ignores other gesture types in sequence', () => {
      const sequence = createSequence([
        { type: 'flick', direction: 'up', velocity: 1.0 },
        { type: 'tap', count: 5, region: 'center' },
        { type: 'radial_drag', fromAngle: 0, toAngle: 90, notches: 3 },
        { type: 'hold', durationMs: 3000, region: 'edge' },
      ]);
      expect(isPanicGesture(sequence)).toBe(true);
    });
  });

  describe('with custom pattern', () => {
    const customPattern: PanicGesturePattern = {
      tapCount: 3,
      tapRegion: 'any',
      holdMinDurationMs: 1000,
      holdRegion: 'any',
    };

    it('respects custom tap count', () => {
      const sequence = createSequence([
        { type: 'tap', count: 3, region: 'edge' },
        { type: 'hold', durationMs: 1500, region: 'center' },
      ]);
      expect(isPanicGesture(sequence, customPattern)).toBe(true);
    });

    it('respects "any" region matching', () => {
      const sequence = createSequence([
        { type: 'tap', count: 3, region: 'center' },
        { type: 'hold', durationMs: 1500, region: 'edge' },
      ]);
      expect(isPanicGesture(sequence, customPattern)).toBe(true);
    });

    it('respects custom hold duration', () => {
      const sequence = createSequence([
        { type: 'tap', count: 3, region: 'center' },
        { type: 'hold', durationMs: 800, region: 'center' }, // Below 1000ms
      ]);
      expect(isPanicGesture(sequence, customPattern)).toBe(false);
    });
  });

  describe('DEFAULT_PANIC_GESTURE_PATTERN', () => {
    it('has expected values', () => {
      expect(DEFAULT_PANIC_GESTURE_PATTERN).toEqual({
        tapCount: 5,
        tapRegion: 'center',
        holdMinDurationMs: 2500,
        holdRegion: 'edge',
      });
    });
  });
});

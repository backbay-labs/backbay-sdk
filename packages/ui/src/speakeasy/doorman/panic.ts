import type { GestureSequence, GestureStep } from '../types.js';

export interface PanicGesturePattern {
  tapCount: number;
  tapRegion: 'center' | 'edge' | 'any';
  holdMinDurationMs: number;
  holdRegion: 'center' | 'edge' | 'any';
}

export const DEFAULT_PANIC_GESTURE_PATTERN: PanicGesturePattern = {
  tapCount: 5,
  tapRegion: 'center',
  holdMinDurationMs: 2_500,
  holdRegion: 'edge',
};

function isRegionMatch(region: 'center' | 'edge', expected: 'center' | 'edge' | 'any'): boolean {
  return expected === 'any' ? true : region === expected;
}

export function isPanicGesture(
  sequence: GestureSequence,
  pattern: PanicGesturePattern = DEFAULT_PANIC_GESTURE_PATTERN
): boolean {
  // Use filter to check ALL tap/hold pairs, not just the first match
  const allTaps = sequence.steps.filter(
    (s): s is Extract<GestureStep, { type: 'tap' }> => s.type === 'tap'
  );
  const allHolds = sequence.steps.filter(
    (s): s is Extract<GestureStep, { type: 'hold' }> => s.type === 'hold'
  );

  // Check all combinations of taps and holds for panic pattern
  for (const tap of allTaps) {
    if (tap.count < pattern.tapCount) continue;
    if (!isRegionMatch(tap.region, pattern.tapRegion)) continue;

    for (const hold of allHolds) {
      if (
        hold.durationMs >= pattern.holdMinDurationMs &&
        isRegionMatch(hold.region, pattern.holdRegion)
      ) {
        return true;
      }
    }
  }

  return false;
}


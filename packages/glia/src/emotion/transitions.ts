// packages/bb-ui/src/emotion/transitions.ts

import type { AVO, EasingFunction, TransitionOptions } from './types.js';
import { avoDistance } from './mapping.js';

/**
 * Easing functions
 */
export const EASING_FUNCTIONS: Record<EasingFunction, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - Math.pow(1 - t, 2),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  spring: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

/**
 * Apply easing function to progress value (clamped 0-1)
 */
export function ease(fn: EasingFunction, t: number): number {
  return EASING_FUNCTIONS[fn](Math.max(0, Math.min(1, t)));
}

/**
 * Calculate appropriate transition duration based on AVO change
 * Returns duration in milliseconds
 * - Urgent (200ms) for sudden negative changes (e.g., error states)
 * - Recovery uses longer duration with distance factor
 * - Default: proportional to AVO distance
 */
export function getTransitionDuration(from: AVO, to: AVO): number {
  const distance = avoDistance(from, to);
  const valenceDrop = from.valence - to.valence;
  const arousalSpike = to.arousal - from.arousal;

  // Urgent: sudden negative change (error state)
  if (valenceDrop > 0.3 && arousalSpike > 0.2) {
    return 200;
  }

  // Recovery: returning to positive
  if (to.valence > from.valence && to.valence > 0.6) {
    return 600 + distance * 400;
  }

  // Default: proportional to distance
  return Math.floor(200 + distance * 800);
}

/**
 * Get recommended easing for a transition based on emotional context
 * - Urgent negative: fast out (easeOut)
 * - Recovery: springy for natural bounce-back
 * - Default: smooth in-out
 */
export function getTransitionEasing(from: AVO, to: AVO): EasingFunction {
  const valenceDrop = from.valence - to.valence;
  const arousalSpike = to.arousal - from.arousal;

  // Urgent negative: fast out
  if (valenceDrop > 0.3 && arousalSpike > 0.2) {
    return 'easeOut';
  }

  // Recovery: springy
  if (to.valence > from.valence && to.valence > 0.7) {
    return 'spring';
  }

  // Default
  return 'easeInOut';
}

/**
 * Get complete transition config with duration, easing, and onComplete callback
 */
export function getTransitionConfig(from: AVO, to: AVO): Required<TransitionOptions> {
  return {
    duration: getTransitionDuration(from, to),
    easing: getTransitionEasing(from, to),
    onComplete: () => {},
  };
}

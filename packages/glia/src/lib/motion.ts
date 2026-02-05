/**
 * Motion utilities for framer-motion type compatibility
 * Provides properly typed cubic-bezier easing functions
 */

/** Cubic bezier easing tuple type */
export type CubicBezier = [number, number, number, number];

/** Common easing curves */
export const easings = {
  /** Smooth ease-out curve */
  smooth: [0.22, 1, 0.36, 1] as CubicBezier,
  /** Elastic ease-out */
  elastic: [0.68, -0.55, 0.265, 1.55] as CubicBezier,
  /** Quick ease-in-out */
  quick: [0.4, 0, 0.2, 1] as CubicBezier,
  /** Gentle ease */
  gentle: [0.25, 0.1, 0.25, 1] as CubicBezier,
} as const;

/**
 * Creates a properly typed transition config
 */
export function createTransition(config: {
  delay?: number;
  duration?: number;
  ease?: CubicBezier | string;
}) {
  return config;
}

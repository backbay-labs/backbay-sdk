// packages/bb-ui/src/emotion/micro-expressions.ts

import type { AVO, MicroExpressionConfig } from './types.js';

/**
 * Simple seeded pseudo-random number generator
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Create a smooth noise generator (Perlin-like)
 * Returns values between -1 and 1
 */
export function createNoiseGenerator(seed: number = 42) {
  const rand = seededRandom(seed);

  // Pre-generate gradient table
  const gradients: number[] = [];
  for (let i = 0; i < 256; i++) {
    gradients.push(rand() * 2 - 1);
  }

  // Smoothstep interpolation
  const smoothstep = (t: number) => t * t * (3 - 2 * t);

  return (t: number): number => {
    const i0 = Math.floor(t) & 255;
    const i1 = (i0 + 1) & 255;
    const frac = t - Math.floor(t);

    const g0 = gradients[i0];
    const g1 = gradients[i1];

    const d0 = g0 * frac;
    const d1 = g1 * (frac - 1);

    return smoothstep(frac) * (d1 - d0) + d0;
  };
}

// Global noise generators for each dimension (different seeds)
const arousalNoise = createNoiseGenerator(42);
const valenceNoise = createNoiseGenerator(137);
const opennessNoise = createNoiseGenerator(256);

/**
 * Apply micro-expression variations to base AVO state
 */
export function applyMicroExpression(
  base: AVO,
  config: MicroExpressionConfig,
  time: number
): AVO {
  if (!config.enabled) {
    return base;
  }

  const t = time * config.frequency;

  // Apply noise scaled by config amplitude
  const noiseA = arousalNoise(t) * config.arousalNoise;
  const noiseV = valenceNoise(t + 100) * config.valenceNoise;
  const noiseO = opennessNoise(t + 200) * config.opennessNoise;

  // Clamp to valid 0-1 range
  return {
    arousal: Math.max(0, Math.min(1, base.arousal + noiseA)),
    valence: Math.max(0, Math.min(1, base.valence + noiseV)),
    openness: Math.max(0, Math.min(1, base.openness + noiseO)),
  };
}

/**
 * Create a micro-expression animator that tracks time internally
 */
export function createMicroExpressionAnimator(config: MicroExpressionConfig) {
  let time = 0;

  return {
    tick(deltaMs: number) {
      time += deltaMs / 1000;
    },
    apply(base: AVO): AVO {
      return applyMicroExpression(base, config, time);
    },
    reset() {
      time = 0;
    },
  };
}

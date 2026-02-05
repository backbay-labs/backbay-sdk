// packages/bb-ui/src/emotion/mapping.ts

import type { AVO, LegacyGlyphState, VisualState } from './types.js';
import { ANCHOR_STATES, LEGACY_STATE_MAP } from './constants.js';

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Map Arousal (0-1) to temporal visual properties
 */
export function mapArousal(a: number) {
  return {
    breathingRate: 0.3 + Math.pow(a, 1.5) * 1.7,           // 0.3 - 2.0 Hz
    breathingAmplitude: 0.01 + a * 0.05,                    // 1% - 6%
    ringRotationSpeed: 0.1 + Math.pow(a, 1.3) * 1.9,       // 0.1 - 2.0 rad/s
    particleVelocity: 0.02 + a * 0.18,                      // 0.02 - 0.20
    particleCount: Math.floor(20 + a * 80),                 // 20 - 100
    glowPulseRate: 0.2 + Math.pow(a, 1.4) * 1.3,           // 0.2 - 1.5 Hz
  };
}

/**
 * Map Valence (0-1) to qualitative visual properties
 */
export function mapValence(v: number) {
  // Sigmoid for sharper color transition in middle range
  const colorT = 1 / (1 + Math.exp(-8 * (v - 0.4)));

  return {
    coreHue: lerp(220, 35, colorT),                         // Blue(220) → Gold(35)
    coreSaturation: 0.4 + v * 0.45,                         // 40% - 85%
    motionNoise: 0.15 * Math.pow(1 - v, 2),                // High noise when low
    scaleFactor: 0.92 + v * 0.16,                           // 0.92x - 1.08x
    emissiveIntensity: 0.2 + Math.pow(v, 1.5) * 0.7,       // 0.2 - 0.9
  };
}

/**
 * Map Openness (0-1) to spatial visual properties
 */
export function mapOpenness(o: number) {
  return {
    particleFlowDirection: lerp(-1, 1, o),                  // -1 (in) to +1 (out)
    particleSpreadAngle: lerp(30, 120, o),                  // 30° - 120°
    breathingPhaseBias: lerp(-0.3, 0.3, o),                // Inhale vs exhale bias
    ringTilt: lerp(-15, 15, o),                             // -15° to +15°
    auraExpansion: lerp(0.95, 1.1, o),                     // 0.95x - 1.1x
  };
}

/**
 * Compute complete visual state from AVO dimensions
 */
export function computeVisualState(avo: AVO): VisualState {
  const arousalMap = mapArousal(avo.arousal);
  const valenceMap = mapValence(avo.valence);
  const opennessMap = mapOpenness(avo.openness);

  // Cross-dimensional: overall intensity combines A and V
  const overallIntensity = 0.3 + (avo.arousal * 0.4) + (avo.valence * 0.3);

  return {
    ...arousalMap,
    ...valenceMap,
    ...opennessMap,
    overallIntensity,
  };
}

/**
 * Compute Euclidean distance between two AVO states
 */
export function avoDistance(a: AVO, b: AVO): number {
  return Math.sqrt(
    Math.pow(a.arousal - b.arousal, 2) +
    Math.pow(a.valence - b.valence, 2) +
    Math.pow(a.openness - b.openness, 2)
  );
}

/**
 * Blend between two AVO states
 */
export function blendAVO(from: AVO, to: AVO, t: number): AVO {
  return {
    arousal: lerp(from.arousal, to.arousal, t),
    valence: lerp(from.valence, to.valence, t),
    openness: lerp(from.openness, to.openness, t),
  };
}

/**
 * Calculate animation weights for all legacy states based on distance to current AVO.
 * Uses inverse distance weighting with falloff - states closer in AVO space get higher weights.
 * Weights are normalized to sum to 1.0 (or all zero if no state is close enough).
 */
export function getAnimationWeights(
  currentAVO: AVO
): Record<LegacyGlyphState, number> {
  const weights: Record<LegacyGlyphState, number> = {
    idle: 0,
    listening: 0,
    thinking: 0,
    responding: 0,
    success: 0,
    error: 0,
    sleep: 0,
  };

  // Calculate distance to each legacy state's AVO coordinates
  for (const [state, anchor] of Object.entries(LEGACY_STATE_MAP)) {
    const targetAVO = ANCHOR_STATES[anchor as keyof typeof ANCHOR_STATES];
    const distance = avoDistance(currentAVO, targetAVO);
    // Inverse distance weighting with falloff
    // Distance of 0 -> weight 1, distance >= 0.5 -> weight 0
    weights[state as LegacyGlyphState] = Math.max(0, 1 - distance * 2);
  }

  // Normalize weights to sum to 1.0
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (total > 0) {
    for (const key of Object.keys(weights)) {
      weights[key as LegacyGlyphState] /= total;
    }
  } else {
    // Fallback: if all weights are zero (current AVO is far from all states),
    // default to idle with full weight
    weights.idle = 1;
  }

  return weights;
}

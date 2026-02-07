// packages/bb-ui/src/emotion/constants.ts

import type { AVO, AnchorState, MicroExpressionConfig, LegacyGlyphState } from './types.js';

/**
 * Validate AVO dimensions are in valid range
 */
export function isValidAVO(avo: AVO): boolean {
  return (
    avo.arousal >= 0 && avo.arousal <= 1 &&
    avo.valence >= 0 && avo.valence <= 1 &&
    avo.openness >= 0 && avo.openness <= 1
  );
}

/**
 * Clamp AVO dimensions to valid range
 */
export function clampAVO(avo: Partial<AVO>): AVO {
  return {
    arousal: Math.max(0, Math.min(1, avo.arousal ?? 0.25)),
    valence: Math.max(0, Math.min(1, avo.valence ?? 0.6)),
    openness: Math.max(0, Math.min(1, avo.openness ?? 0.35)),
  };
}

/**
 * Named anchor states with AVO coordinates
 */
export const ANCHOR_STATES: Record<AnchorState, AVO> = {
  // Rest states
  dormant:       { arousal: 0.05, valence: 0.55, openness: 0.30 },
  idle:          { arousal: 0.25, valence: 0.60, openness: 0.35 },

  // Receptive states
  attentive:     { arousal: 0.40, valence: 0.70, openness: 0.20 },
  curious:       { arousal: 0.50, valence: 0.75, openness: 0.10 },
  listening:     { arousal: 0.45, valence: 0.70, openness: 0.05 },

  // Processing states
  thinking:      { arousal: 0.60, valence: 0.60, openness: 0.40 },
  contemplating: { arousal: 0.55, valence: 0.65, openness: 0.45 },
  focused:       { arousal: 0.70, valence: 0.70, openness: 0.50 },

  // Expressive states
  responding:    { arousal: 0.60, valence: 0.75, openness: 0.80 },
  explaining:    { arousal: 0.55, valence: 0.80, openness: 0.85 },
  enthusiastic:  { arousal: 0.80, valence: 0.90, openness: 0.75 },

  // Completion states
  satisfied:     { arousal: 0.30, valence: 0.90, openness: 0.50 },
  proud:         { arousal: 0.45, valence: 0.95, openness: 0.60 },

  // Negative states
  uncertain:     { arousal: 0.45, valence: 0.40, openness: 0.35 },
  concerned:     { arousal: 0.55, valence: 0.30, openness: 0.30 },
  struggling:    { arousal: 0.70, valence: 0.35, openness: 0.45 },
  alarmed:       { arousal: 0.80, valence: 0.20, openness: 0.40 },
  error:         { arousal: 0.75, valence: 0.10, openness: 0.35 },

  // Recovery states
  recovering:    { arousal: 0.40, valence: 0.45, openness: 0.40 },
  relieved:      { arousal: 0.35, valence: 0.75, openness: 0.45 },
};

/**
 * Map legacy GlyphState to anchor states
 */
export const LEGACY_STATE_MAP: Record<LegacyGlyphState, AnchorState> = {
  idle: 'idle',
  listening: 'listening',
  thinking: 'thinking',
  responding: 'responding',
  success: 'satisfied',
  error: 'error',
  sleep: 'dormant',
};

/**
 * Default micro-expression configuration
 */
export const DEFAULT_MICRO_CONFIG: MicroExpressionConfig = {
  enabled: true,
  arousalNoise: 0.02,
  valenceNoise: 0.015,
  opennessNoise: 0.01,
  frequency: 0.3,
};

/**
 * Default transition durations by type (ms)
 */
export const DEFAULT_TRANSITION_DURATIONS = {
  micro: 150,
  standard: 400,
  mood: 800,
  major: 1200,
} as const;

/**
 * Default AVO state (idle equivalent)
 */
export const DEFAULT_AVO: AVO = ANCHOR_STATES.idle;

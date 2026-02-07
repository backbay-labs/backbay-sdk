// packages/bb-ui/src/emotion/types.ts

/**
 * Glyph Emotion System Types
 *
 * AVO dimensional model based on Russell's Circumplex Model of Affect
 */

/**
 * The three emotional dimensions (all 0-1 range)
 */
export interface AVODimensions {
  /** Arousal: 0 (dormant) to 1 (intense) - energy/activation level */
  arousal: number;
  /** Valence: 0 (distressed) to 1 (elated) - positivity/confidence */
  valence: number;
  /** Openness: 0 (receptive) to 1 (expressive) - input/output direction */
  openness: number;
}

/** Shorthand alias */
export type AVO = AVODimensions;

/**
 * Named anchor states - recognizable emotional configurations
 */
export type AnchorState =
  // Rest states
  | 'dormant'
  | 'idle'
  // Receptive states
  | 'attentive'
  | 'curious'
  | 'listening'
  // Processing states
  | 'thinking'
  | 'contemplating'
  | 'focused'
  // Expressive states
  | 'responding'
  | 'explaining'
  | 'enthusiastic'
  // Completion states
  | 'satisfied'
  | 'proud'
  // Negative states
  | 'uncertain'
  | 'concerned'
  | 'struggling'
  | 'alarmed'
  | 'error'
  // Recovery states
  | 'recovering'
  | 'relieved';

/**
 * Easing function types for transitions
 */
export type EasingFunction =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'spring';

/**
 * Transition configuration
 */
export interface TransitionOptions {
  /** Duration in milliseconds */
  duration?: number;
  /** Easing function */
  easing?: EasingFunction;
  /** Callback when transition completes */
  onComplete?: () => void;
}

/**
 * Visual state derived from AVO dimensions
 */
export interface VisualState {
  // Temporal (from Arousal)
  breathingRate: number;
  breathingAmplitude: number;
  ringRotationSpeed: number;
  particleVelocity: number;
  particleCount: number;
  glowPulseRate: number;

  // Qualitative (from Valence)
  coreHue: number;
  coreSaturation: number;
  motionNoise: number;
  scaleFactor: number;
  emissiveIntensity: number;

  // Spatial (from Openness)
  particleFlowDirection: number;
  particleSpreadAngle: number;
  breathingPhaseBias: number;
  ringTilt: number;
  auraExpansion: number;

  // Combined
  overallIntensity: number;
}

/**
 * Emotion events that can trigger state changes
 */
export interface EmotionEvent {
  type:
    | 'input_received'
    | 'processing_start'
    | 'processing_complete'
    | 'error_occurred'
    | 'success'
    | 'user_idle'
    | 'interrupt';
  /** Intensity of the event (0-1) */
  intensity?: number;
  /** Additional event data */
  data?: unknown;
}

/**
 * Micro-expression configuration for natural movement
 */
export interface MicroExpressionConfig {
  enabled: boolean;
  arousalNoise: number;
  valenceNoise: number;
  opennessNoise: number;
  frequency: number;
}

/**
 * Legacy GlyphState for backward compatibility
 */
export type LegacyGlyphState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'responding'
  | 'success'
  | 'error'
  | 'sleep';

// packages/bb-ui/src/emotion/index.ts

// Types
export type {
  AVO,
  AVODimensions,
  AnchorState,
  EasingFunction,
  TransitionOptions,
  VisualState,
  EmotionEvent,
  MicroExpressionConfig,
  LegacyGlyphState,
} from './types.js';

// Constants
export {
  ANCHOR_STATES,
  LEGACY_STATE_MAP,
  DEFAULT_AVO,
  DEFAULT_MICRO_CONFIG,
  DEFAULT_TRANSITION_DURATIONS,
  isValidAVO,
  clampAVO,
} from './constants.js';

// Mapping
export {
  lerp,
  mapArousal,
  mapValence,
  mapOpenness,
  computeVisualState,
  avoDistance,
  blendAVO,
  getAnimationWeights,
} from './mapping.js';

// Transitions
export {
  ease,
  getTransitionDuration,
  getTransitionEasing,
  getTransitionConfig,
} from './transitions.js';

// Micro-expressions
export {
  createNoiseGenerator,
  applyMicroExpression,
  createMicroExpressionAnimator,
} from './micro-expressions.js';

// Controller
export { EmotionController } from './controller.js';
export type { EmotionControllerOptions } from './controller.js';

// Hooks
export { useEmotion } from './hooks/index.js';
export type { UseEmotionOptions, UseEmotionResult } from './hooks/index.js';

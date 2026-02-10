/**
 * @backbay/glia -- full re-export of the entire SDK.
 *
 * Importing from this root entry pulls ALL sub-packages.
 * For smaller bundles, prefer sub-path imports:
 *
 *   import { GlassButton } from '@backbay/glia/primitives';
 *   import { useCognition } from '@backbay/glia/cognition';
 *   import { useWindowManager } from '@backbay/glia/desktop';
 *
 * @see package.json "exports" for all available sub-paths.
 * @packageDocumentation
 */

// =============================================================================
// Protocol (Discovery + Execution)
// =============================================================================

export * from './protocol/index.js';

// =============================================================================
// Components
// =============================================================================

export * from './components/index.js';

// =============================================================================
// Hooks
// =============================================================================

export * from './hooks/index.js';

// =============================================================================
// Workspace (Agent-composable UI)
// =============================================================================

export * from './workspace/index.js';

// =============================================================================
// Primitives (UI Components)
// =============================================================================

export * from './primitives/index.js';

// =============================================================================
// Theme
// =============================================================================

export * from './theme/index.js';

// =============================================================================
// Utilities
// =============================================================================

export * from './lib/utils.js';
export { generateNoiseDataUrl, NOISE_PRESETS } from './lib/noise.js';
export type { NoiseConfig, NoisePreset } from './lib/noise.js';

// =============================================================================
// Emotion System
// =============================================================================

export * from './emotion/index.js';

// =============================================================================
// Vision
// =============================================================================

export * from './vision/index.js';

// =============================================================================
// Audio
// =============================================================================

export * from './audio/index.js';

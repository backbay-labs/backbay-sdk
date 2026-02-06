/**
 * bb-ui - Agent-native web UI standard and component library
 *
 * Three pillars:
 * - bb-protocol: Discovery and execution layer for agent-native websites
 * - bb-components: React primitives for building agentic UIs
 * - bb-workspace: Agent-composable UI specification runtime
 *
 * Plus:
 * - primitives: UI components (atoms, molecules, organisms)
 * - theme: Design system with multiple themes
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

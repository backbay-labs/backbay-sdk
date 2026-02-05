/**
 * CrystallineOrganism Constants
 *
 * Geometry and visual configuration for organism types.
 * Visual behavior (colors, pulsing, particles) comes from the AVO emotion system.
 */

import type { OrganismType, OrganismState } from "./types";
import type { AnchorState } from "../../../emotion/types";

// -----------------------------------------------------------------------------
// Geometry Configuration
// -----------------------------------------------------------------------------

export type GeometryType =
  | "octahedron"
  | "icosahedron"
  | "dodecahedron"
  | "tetrahedron"
  | "box"
  | "torus";

export const ORGANISM_GEOMETRY: Record<OrganismType, GeometryType> = {
  kernel:   "octahedron",
  agent:    "icosahedron",
  workcell: "dodecahedron",
  task:     "tetrahedron",
  storage:  "box",
  relay:    "torus",
  swarm:    "icosahedron", // swarm uses icosahedron at large scale
} as const;

export const ORGANISM_BASE_SIZE: Record<OrganismType, number> = {
  kernel:   0.6,
  agent:    0.45,
  workcell: 0.5,
  task:     0.35,
  storage:  0.4,
  relay:    0.35,
  swarm:    0.8,
} as const;

// -----------------------------------------------------------------------------
// State Mapping
// -----------------------------------------------------------------------------

/**
 * Maps OrganismState to AnchorState for emotion system integration
 */
export const ORGANISM_STATE_MAP: Record<OrganismState, AnchorState> = {
  idle: "idle",
  listening: "listening",
  thinking: "thinking",
  responding: "responding",
  success: "satisfied",
  error: "error",
  sleep: "dormant",
  busy: "focused",
} as const;

// -----------------------------------------------------------------------------
// Crystalline Tech Aesthetic
// -----------------------------------------------------------------------------

export const CRYSTALLINE_CONFIG = {
  // Core energy colors (Backbay gold/amber palette)
  energyCore: "#f2c96b",
  energyCoreEmissive: "#d4a84b",

  // Structural colors (Backbay steel blue)
  structuralBlue: "#6b8cbe",
  structuralEmissive: "#9bb4e3",

  // Selection/interaction
  selectionRing: "#00f0ff",
  hoverGlow: "#6b8cbe",

  // Error state
  errorCore: "#ff3366",
  errorGlow: "#ff0055",

  // Offline state
  offlineCore: "#4a6fa5",

  // Light configuration
  baseLightIntensity: 0.8,
  coreGlowRadius: 6,
} as const;

// -----------------------------------------------------------------------------
// Animation Timing
// -----------------------------------------------------------------------------

export const ANIMATION_CONFIG = {
  // Interaction
  hover: {
    scaleFactor: 1.1,
    duration: 150,
  },
  select: {
    scaleFactor: 1.15,
    duration: 200,
  },

  // Sprawl transition
  sprawl: {
    shellExpandDuration: 150,
    childrenStaggerDelay: 30,
    childrenAnimateDuration: 250,
    latticeFormDelay: 250,
    latticeFormDuration: 150,
    totalDuration: 500,
  },
} as const;

// -----------------------------------------------------------------------------
// Hex Grid Layout
// -----------------------------------------------------------------------------

export const HEX_GRID_CONFIG = {
  size: 1.2,
  height: 0,
  maxRadius: 5,
} as const;

// -----------------------------------------------------------------------------
// Lattice Edge Styles
// -----------------------------------------------------------------------------

export const EDGE_STYLES = {
  hierarchy: {
    lineWidth: 2,
    dashArray: null,
    particleFlow: false,
    pulseGlow: false,
  },
  "data-flow": {
    lineWidth: 1.5,
    dashArray: null,
    particleFlow: true,
    pulseGlow: false,
  },
  dependency: {
    lineWidth: 1,
    dashArray: [0.1, 0.05],
    particleFlow: false,
    pulseGlow: false,
  },
  communication: {
    lineWidth: 1.5,
    dashArray: null,
    particleFlow: false,
    pulseGlow: true,
  },
  speculative: {
    lineWidth: 1,
    dashArray: [0.03, 0.03],
    particleFlow: false,
    pulseGlow: true,
  },
} as const;

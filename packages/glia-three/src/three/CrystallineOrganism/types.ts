/**
 * CrystallineOrganism Types
 *
 * Types for the crystalline organism 3D primitive - a unified visualization
 * for units of work (kernel, workcell, agent, task) in the Backbay Nexus.
 *
 * Uses the AVO emotion system for visual state, allowing organisms to share
 * the same emotional intelligence as the Glyph.
 */

import type { Vector3 } from "three";
import type { AVO, VisualState, AnchorState } from "@backbay/glia-agent/emotion";

// Re-export emotion types for convenience
export type { AVO, VisualState, AnchorState };

// -----------------------------------------------------------------------------
// Organism Types
// -----------------------------------------------------------------------------

export type OrganismType =
  | "kernel"    // Octahedron - orchestrator
  | "workcell"  // Dodecahedron - sandbox
  | "agent"     // Icosahedron - worker
  | "task"      // Tetrahedron - atomic work
  | "storage"   // Cube - persistence
  | "relay"     // Torus - router
  | "swarm";    // Collection boundary

/**
 * Power level affects visual scale and particle count
 */
export type OrganismPower = "minimal" | "standard" | "elevated" | "intense";

/**
 * Maps power levels to visual multipliers
 */
export const POWER_MULTIPLIERS: Record<OrganismPower, { scale: number; particles: number }> = {
  minimal: { scale: 0.7, particles: 0.3 },
  standard: { scale: 1.0, particles: 1.0 },
  elevated: { scale: 1.3, particles: 1.5 },
  intense: { scale: 1.6, particles: 2.0 },
};

// -----------------------------------------------------------------------------
// Lattice Connections
// -----------------------------------------------------------------------------

export type LatticeEdgeType =
  | "hierarchy"      // Solid line, parent color
  | "data-flow"      // Animated particles
  | "dependency"     // Dashed line
  | "communication"  // Pulsing glow
  | "speculative";   // Dotted, iridescent

export interface LatticeEdge {
  id: string;
  source: string;
  target: string;
  type: LatticeEdgeType;
  /** 0-1, affects visual thickness */
  strength: number;
  bidirectional: boolean;
}

// -----------------------------------------------------------------------------
// Component Props
// -----------------------------------------------------------------------------

/**
 * Legacy state names for backward compatibility (maps to AnchorState)
 */
export type OrganismState =
  | "idle"
  | "listening"
  | "thinking"
  | "responding"
  | "success"
  | "error"
  | "sleep"
  | "busy";

export interface CrystallineOrganismProps {
  // Identity
  id: string;
  type: OrganismType;
  label?: string;

  // Emotion state - priority order: visualState > dimensions > state
  /** Legacy state (will be converted to AVO) */
  state?: OrganismState;
  /** Direct AVO dimensions (overrides state) */
  dimensions?: AVO;
  /** Pre-computed visual state (overrides dimensions) */
  visualState?: VisualState;

  // Power level (affects scale and particle density)
  power?: OrganismPower;

  // Containment (for nested/sprawl behavior)
  children?: CrystallineOrganismProps[];
  sprawled?: boolean;

  // Interaction
  selected?: boolean;
  hovered?: boolean;
  onSelect?: (id: string) => void;
  onSprawl?: (id: string) => void;
  onCollapse?: (id: string) => void;
  onContextMenu?: (id: string, position: Vector3) => void;
  onHover?: (id: string | null) => void;

  // Position (managed by layout algorithm)
  position?: [number, number, number];

  // Enable particle system (default true)
  enableParticles?: boolean;
}

export interface OrganismShellProps {
  type: OrganismType;
  visualState: VisualState;
  size: number;
  selected?: boolean;
  hovered?: boolean;
}

export interface OrganismParticlesProps {
  visualState: VisualState;
  shellRadius: number;
}

export interface LatticeEdgeProps {
  edge: LatticeEdge;
  sourcePosition: [number, number, number];
  targetPosition: [number, number, number];
}

export interface OrganismLatticeProps {
  organisms: CrystallineOrganismProps[];
  edges: LatticeEdge[];
  layout: "hex-grid" | "force-directed" | "radial" | "manual";
  sprawlStack: string[];
  onSprawlChange?: (stack: string[]) => void;
  onSelectionChange?: (ids: string[]) => void;
}

export interface BreadcrumbProps {
  stack: string[];
  labels: Record<string, string>;
  onNavigate: (toIndex: number) => void;
}

// -----------------------------------------------------------------------------
// Layout Types
// -----------------------------------------------------------------------------

export interface HexGridPosition {
  q: number; // axial coordinate
  r: number; // axial coordinate
  x: number; // world x
  z: number; // world z
}

export interface LayoutResult {
  positions: Map<string, [number, number, number]>;
}

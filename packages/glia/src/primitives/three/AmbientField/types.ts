/**
 * AmbientField Types
 *
 * Types for the reactive 3D field that visualizes Backbay system activity.
 */

import type {
  FieldColor,
  FieldConfig as ContractFieldConfig,
  FieldEvent as ContractFieldEvent,
  FieldEventSource,
  FieldEventType,
  FieldStyle,
} from "@backbay/contract";

// Re-export contract types
export type { FieldColor, FieldEventSource, FieldEventType, FieldStyle };

// -----------------------------------------------------------------------------
// Runtime Types
// -----------------------------------------------------------------------------

/** Position in UV space (0-1) */
export interface UVPosition {
  x: number;
  y: number;
}

/** A single impulse effect (from burst events) */
export interface Impulse {
  id: string;
  uv: UVPosition;
  startTs: number;
  amplitude: number;
  radius: number;
  color: FieldColor;
  source: FieldEventSource;
}

/** A persistent anchor (from latch events) */
export interface Anchor {
  id: string;
  entityId: string;
  source: FieldEventSource;
  uv: UVPosition;
  strength: number;
  color: FieldColor;
  createdTs: number;
}

/** Current hover state */
export interface HoverState {
  active: boolean;
  uv: UVPosition;
  intent: "probe" | "etch";
  velocity: UVPosition;
  lastTs: number;
  sourceId: string | null;
}

/** Pending event awaiting UV computation */
export interface PendingEvent {
  type: "hover" | "impulse" | "anchor_create" | "anchor_remove";
  event: ContractFieldEvent;
  clientX?: number;
  clientY?: number;
}

/** Complete runtime state */
export interface FieldRuntimeState {
  impulses: Impulse[];
  anchors: Map<string, Anchor>;
  hover: HoverState;
  frame: number;
  pendingEvents: PendingEvent[];
}

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

/** Extended field config for component usage */
export interface FieldConfig extends ContractFieldConfig {
  /** Camera field of view */
  fov: number;
  /** Camera Z position */
  cameraZ: number;
  /** Enable point stars layer */
  enablePoints: boolean;
  /** Number of point stars */
  pointsCount: number;
  /** Probe effect radius */
  probeRadius: number;
}

/** Default configuration */
export const DEFAULT_FIELD_CONFIG: FieldConfig = {
  style: "constellation",
  density: 0.7,
  reactivity: 1.0,
  dpr: 2,
  maxImpulses: 24,
  maxAnchors: 8,
  impulseDecayMs: 1500,
  fov: 50,
  cameraZ: 10,
  enablePoints: true,
  pointsCount: 3000,
  probeRadius: 0.08,
};

// -----------------------------------------------------------------------------
// Bus Types
// -----------------------------------------------------------------------------

export type FieldBusListener = (state: FieldRuntimeState) => void;

export interface BackbayFieldBus {
  /** Emit a field event */
  emit: (event: ContractFieldEvent) => void;

  /** Emit a Backbay domain event (convenience method) */
  emitBackbayEvent: (params: {
    type: FieldEventType;
    source: FieldEventSource;
    entityId: string;
    color?: FieldColor;
    intensity?: number;
    duration?: number;
  }) => void;

  /** Subscribe to state changes */
  subscribe: (listener: FieldBusListener) => () => void;

  /** Get current snapshot */
  getSnapshot: () => FieldRuntimeState;

  /** Get server snapshot (for SSR) */
  getServerSnapshot: () => FieldRuntimeState;

  /** Update configuration */
  setConfig: (config: Partial<FieldConfig>) => void;

  /** Get current configuration */
  getConfig: () => FieldConfig;

  /** Advance frame (called from useFrame) */
  tick: (deltaMs: number, currentTs: number) => void;

  /** Clear all state */
  clear: () => void;

  /** Process pending events with computed UVs */
  processPendingWithUv: (
    computeUv: (clientX: number, clientY: number) => UVPosition | null
  ) => void;
}

// -----------------------------------------------------------------------------
// Shader Uniform Types
// -----------------------------------------------------------------------------

export interface FieldUniforms {
  uTime: { value: number };
  uResolution: { value: { x: number; y: number } };
  uHover: { value: { x: number; y: number; z: number; w: number } };
  uImpulses: { value: Array<{ x: number; y: number; z: number; w: number }> };
  uImpulsesAge: { value: Float32Array };
  uImpulseCount: { value: number };
  uAnchors: { value: Array<{ x: number; y: number; z: number; w: number }> };
  uAnchorColors: { value: Array<{ x: number; y: number; z: number; w: number }> };
  uAnchorCount: { value: number };
  uProbeRadius: { value: number };
}

/**
 * Vision types - copied from @backbay/glia/vision to avoid circular dependency.
 * Canonical source: packages/glia/src/vision/types.ts
 */

export interface VisionSize {
  width: number;
  height: number;
}

export interface VisionCameraPose {
  position: [number, number, number];
  target: [number, number, number];
  up?: [number, number, number];
  fov?: number;
  projectionMatrix?: number[];
}

export interface VisionChannel<T = unknown> {
  id: string;
  kind: string;
  data: T;
  width?: number;
  height?: number;
  meta?: Record<string, unknown>;
}

export interface VisionTopologyNode {
  id: string;
  type: string;
  label?: string;
  position?: [number, number, number];
  radius?: number;
  bounds?: {
    min: [number, number, number];
    max: [number, number, number];
  };
  color?: string;
  meta?: Record<string, unknown>;
}

export interface VisionTopologyEdge {
  id?: string;
  from: string;
  to: string;
  type?: string;
  color?: string;
  weight?: number;
  meta?: Record<string, unknown>;
}

export interface VisionTopology {
  id?: string;
  source?: string;
  updatedAt: number;
  nodes: VisionTopologyNode[];
  edges?: VisionTopologyEdge[];
  meta?: Record<string, unknown>;
}

export interface VisionFrame {
  id?: string;
  source: string;
  capturedAt: number;
  size?: VisionSize;
  camera?: VisionCameraPose;
  channels?: VisionChannel[];
  topology?: VisionTopology;
  meta?: Record<string, unknown>;
}

export interface VisionCaptureOptions {
  size?: VisionSize;
  includeTopology?: boolean;
  includeCamera?: boolean;
  signal?: AbortSignal | null;
}

export interface VisionAdapter {
  id: string;
  label?: string;
  capture(options?: VisionCaptureOptions): Promise<VisionFrame>;
  getTopology?: () => VisionTopology | null;
}

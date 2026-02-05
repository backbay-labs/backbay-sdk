import type { BaseLayerProps } from '../shared/types';

export type FogType = 'depth' | 'ground' | 'volumetric' | 'mist';

export interface FogLayerProps extends BaseLayerProps {
  type: FogType;
  density?: number;
  color?: string;
  height?: number; // 0-1 for ground fog
  animated?: boolean;
}

export interface FogConfig {
  defaultColor: string;
  defaultDensity: number;
  animationSpeed: number;
  gradientStops: number;
}

export const FOG_CONFIGS: Record<FogType, FogConfig> = {
  depth: {
    defaultColor: '#0a0a0f',
    defaultDensity: 0.5,
    animationSpeed: 0,
    gradientStops: 2,
  },
  ground: {
    defaultColor: '#ffffff',
    defaultDensity: 0.7,
    animationSpeed: 0.02,
    gradientStops: 3,
  },
  volumetric: {
    defaultColor: '#e8e8ff',
    defaultDensity: 0.4,
    animationSpeed: 0.01,
    gradientStops: 4,
  },
  mist: {
    defaultColor: '#f0f0ff',
    defaultDensity: 0.3,
    animationSpeed: 0.015,
    gradientStops: 5,
  },
};

import type { BaseLayerProps } from '../shared/types';

export type LightType = 'godrays' | 'shaft' | 'bloom' | 'flare' | 'caustics' | 'scanner' | 'neon' | 'spotlight' | 'rim' | 'laser';

export interface VolumetricLightProps extends BaseLayerProps {
  type: LightType;
  source?: { x: number; y: number };
  color?: string;
  decay?: number;
  angle?: number;
  width?: number;
  animated?: boolean;
}

export interface LightConfig {
  defaultColor: string;
  defaultIntensity: number;
  animated: boolean;
  blendMode: string;
}

export const LIGHT_CONFIGS: Record<LightType, LightConfig> = {
  godrays: { defaultColor: '#fffbe6', defaultIntensity: 0.6, animated: true, blendMode: 'screen' },
  shaft: { defaultColor: '#ffffff', defaultIntensity: 0.5, animated: false, blendMode: 'screen' },
  bloom: { defaultColor: '#ffffff', defaultIntensity: 0.4, animated: false, blendMode: 'screen' },
  flare: { defaultColor: '#ffe4b5', defaultIntensity: 0.7, animated: true, blendMode: 'screen' },
  caustics: { defaultColor: '#00d4ff', defaultIntensity: 0.4, animated: true, blendMode: 'overlay' },
  scanner: { defaultColor: '#00ff00', defaultIntensity: 0.6, animated: true, blendMode: 'screen' },
  neon: { defaultColor: '#ff00ff', defaultIntensity: 0.8, animated: true, blendMode: 'screen' },
  spotlight: { defaultColor: '#ffffff', defaultIntensity: 0.7, animated: false, blendMode: 'screen' },
  rim: { defaultColor: '#00f0ff', defaultIntensity: 0.5, animated: false, blendMode: 'screen' },
  laser: { defaultColor: '#ff0000', defaultIntensity: 0.9, animated: true, blendMode: 'screen' },
};

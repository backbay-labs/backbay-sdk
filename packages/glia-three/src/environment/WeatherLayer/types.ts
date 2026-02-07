import type { BaseLayerProps } from '../shared/types';
import type { AutumnLeafColorPreset } from './leafPresets';

export type WeatherType =
  | 'rain' | 'snow' | 'dust' | 'leaves' | 'embers'
  | 'fireflies' | 'ash' | 'sakura' | 'sparks' | 'spores';

export interface WeatherLayerProps extends BaseLayerProps {
  type: WeatherType;
  wind?: { x: number; y: number };
  color?: string;
  colors?: readonly string[];
  leafColorPreset?: AutumnLeafColorPreset;
  opacity?: number;
  blur?: boolean;
  maxParticles?: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  velocity: { x: number; y: number };
  life: number;
  maxLife: number;
  color: string;
  baseOpacity: number;
  depth: number; // 0 (near) → 1 (far)
  driftPhase: number;
  twinklePhase: number;
  twinkleSpeed: number;
  twinkleAmount: number;
}

export interface WeatherConfig {
  baseCount: number;
  sizeRange: [number, number];
  opacityRange: [number, number];
  speedRange: [number, number];
  motionStyle: 'fall' | 'rise' | 'drift' | 'erratic';
  shape: 'circle' | 'streak' | 'leaf' | 'petal' | 'glow';
  colors: string[];
}

export const WEATHER_CONFIGS: Record<WeatherType, WeatherConfig> = {
  rain: {
    baseCount: 200,
    sizeRange: [1, 3],
    opacityRange: [0.4, 0.7],
    speedRange: [15, 25],
    motionStyle: 'fall',
    shape: 'streak',
    colors: ['#a0c4ff', '#bde0fe'],
  },
  snow: {
    baseCount: 150,
    sizeRange: [2, 6],
    opacityRange: [0.6, 0.9],
    speedRange: [1, 3],
    motionStyle: 'drift',
    shape: 'circle',
    colors: ['#ffffff', '#e8f4ff'],
  },
  dust: {
    baseCount: 80,
    sizeRange: [1, 3],
    opacityRange: [0.2, 0.4],
    speedRange: [0.5, 2],
    motionStyle: 'drift',
    shape: 'circle',
    colors: ['#d4a574', '#c9b896'],
  },
  leaves: {
    baseCount: 30,
    sizeRange: [6, 12],
    opacityRange: [0.7, 1.0],
    speedRange: [2, 5],
    motionStyle: 'drift',
    shape: 'leaf',
    colors: ['#d4a373', '#e07b39', '#bc6c25'],
  },
  embers: {
    baseCount: 60,
    sizeRange: [2, 5],
    opacityRange: [0.5, 0.8],
    speedRange: [2, 5],
    motionStyle: 'rise',
    shape: 'glow',
    colors: ['#ff6b35', '#f7931e', '#ffcc00'],
  },
  fireflies: {
    baseCount: 40,
    sizeRange: [3, 6],
    opacityRange: [0.3, 1.0],
    speedRange: [0.3, 1],
    motionStyle: 'drift',
    shape: 'glow',
    colors: ['#90ee90', '#adff2f', '#7fff00'],
  },
  ash: {
    baseCount: 100,
    sizeRange: [2, 5],
    opacityRange: [0.3, 0.6],
    speedRange: [1, 3],
    motionStyle: 'fall',
    shape: 'circle',
    colors: ['#4a4a4a', '#6b6b6b', '#8b8b8b'],
  },
  sakura: {
    baseCount: 50,
    sizeRange: [6, 12],
    opacityRange: [0.6, 0.9],
    speedRange: [1, 3],
    motionStyle: 'drift',
    shape: 'petal',
    colors: ['#ffb7c5', '#ff69b4', '#ffc0cb'],
  },
  sparks: {
    baseCount: 40,
    sizeRange: [1, 3],
    opacityRange: [0.7, 1.0],
    speedRange: [8, 15],
    motionStyle: 'erratic',
    shape: 'glow',
    colors: ['#ffd700', '#ffffff', '#fffacd'],
  },
  spores: {
    baseCount: 60,
    sizeRange: [4, 8],
    opacityRange: [0.4, 0.7],
    speedRange: [0.5, 1.5],
    motionStyle: 'rise',
    shape: 'glow',
    colors: ['#9370db', '#8a2be2', '#da70d6'],
  },
};

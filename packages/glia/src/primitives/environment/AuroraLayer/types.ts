import type { BaseLayerProps } from '../shared/types';

export type AuroraType = 'aurora' | 'nebula' | 'gradient' | 'stars' | 'clouds' | 'sunset' | 'storm' | 'cosmic' | 'heat' | 'underwater';

export interface AuroraLayerProps extends BaseLayerProps {
  type: AuroraType;
  colors?: string[];
  complexity?: number;
  direction?: 'horizontal' | 'vertical' | 'radial';
  blend?: 'normal' | 'screen' | 'overlay' | 'multiply';
}

export interface AuroraConfig {
  colors: string[];
  animationSpeed: number;
  complexity: number;
}

export const AURORA_CONFIGS: Record<AuroraType, AuroraConfig> = {
  aurora: { colors: ['#00ff87', '#60efff', '#ff00aa'], animationSpeed: 0.008, complexity: 3 },
  nebula: { colors: ['#1a0533', '#4b0082', '#ff006e'], animationSpeed: 0.005, complexity: 4 },
  gradient: { colors: ['#667eea', '#764ba2'], animationSpeed: 0.003, complexity: 1 },
  stars: { colors: ['#ffffff', '#fffacd', '#e6e6fa'], animationSpeed: 0.01, complexity: 5 },
  clouds: { colors: ['#f0f0f0', '#d0d0d0', '#e8e8e8'], animationSpeed: 0.004, complexity: 3 },
  sunset: { colors: ['#ff6b35', '#f7c59f', '#2e294e'], animationSpeed: 0.002, complexity: 2 },
  storm: { colors: ['#1c1c1c', '#363636', '#4a4a4a'], animationSpeed: 0.015, complexity: 4 },
  cosmic: { colors: ['#0d0221', '#0f084b', '#26408b', '#a663cc'], animationSpeed: 0.003, complexity: 5 },
  heat: { colors: ['#ff4500', '#ff6347', '#ffa500'], animationSpeed: 0.02, complexity: 2 },
  underwater: { colors: ['#006994', '#00a8cc', '#40e0d0'], animationSpeed: 0.006, complexity: 3 },
};

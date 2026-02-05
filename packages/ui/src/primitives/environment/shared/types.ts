export type PerformanceTier = 'high' | 'medium' | 'low' | 'minimal';

export type EnvironmentStylePreset = 'cinematic' | 'ui';

export interface PerformanceConfig {
  tier: PerformanceTier;
  maxParticles: number;
  useShaders: boolean;
  targetFPS: number;
}

export const PERFORMANCE_PRESETS: Record<PerformanceTier, PerformanceConfig> = {
  high: { tier: 'high', maxParticles: 2000, useShaders: true, targetFPS: 60 },
  medium: { tier: 'medium', maxParticles: 800, useShaders: true, targetFPS: 60 },
  low: { tier: 'low', maxParticles: 300, useShaders: false, targetFPS: 30 },
  minimal: { tier: 'minimal', maxParticles: 0, useShaders: false, targetFPS: 0 },
};

export interface BaseLayerProps {
  intensity?: number;
  speed?: number;
  stylePreset?: EnvironmentStylePreset;
  enabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

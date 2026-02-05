/**
 * Environment primitives
 *
 * Atmospheric and environmental effect components:
 * - WeatherLayer: Particle-based weather effects (rain, snow, dust, etc.)
 * - FogLayer: Fog and mist effects
 * - VolumetricLight: Light shafts, godrays, and glow effects
 * - AuroraLayer: Sky and aurora effects
 * - EnvironmentLayer: Convenience wrapper combining all layers with presets
 */

export * from "./WeatherLayer";
export * from "./FogLayer";
export * from "./VolumetricLight";
export * from "./AuroraLayer";
export * from "./EnvironmentLayer";
export * from "./shared";

import type { WeatherLayerProps } from "../WeatherLayer";
import type { FogLayerProps } from "../FogLayer";
import type { VolumetricLightProps } from "../VolumetricLight";
import type { AuroraLayerProps } from "../AuroraLayer";

export type EnvironmentPreset =
  | "enchanted-forest"
  | "cyberpunk-city"
  | "deep-space"
  | "underwater"
  | "apocalypse"
  | "cozy-night"
  | "haunted"
  | "synthwave"
  | "zen-garden"
  | "volcanic"
  | "arctic"
  | "noir"
  | "ethereal"
  | "matrix"
  | "rave"
  | "alien-world";

export interface EnvironmentConfig {
  weather?: Omit<WeatherLayerProps, "enabled" | "className" | "style">;
  fog?: Omit<FogLayerProps, "enabled" | "className" | "style">;
  light?: Omit<VolumetricLightProps, "enabled" | "className" | "style">;
  sky?: Omit<AuroraLayerProps, "enabled" | "className" | "style">;
}

export const ENVIRONMENT_PRESETS: Record<EnvironmentPreset, EnvironmentConfig> = {
  "enchanted-forest": {
    weather: { type: "fireflies", intensity: 0.7 },
    fog: { type: "ground", intensity: 0.5, color: "#1a3a2a" },
    light: { type: "godrays", intensity: 0.6, color: "#d4f0c4" },
    sky: { type: "aurora", intensity: 0.4, colors: ["#00ff87", "#004d2f", "#001a0f"] },
  },
  "cyberpunk-city": {
    weather: { type: "rain", intensity: 0.8, wind: { x: -0.3, y: 0 } },
    fog: { type: "volumetric", intensity: 0.6, color: "#1a0033" },
    light: { type: "neon", intensity: 0.8, color: "#ff00ff", angle: 90 },
    sky: { type: "gradient", intensity: 0.7, colors: ["#0a001a", "#1a0033", "#330066"] },
  },
  "deep-space": {
    weather: { type: "spores", intensity: 0.3, color: "#ffffff" },
    fog: undefined,
    light: undefined,
    sky: { type: "nebula", intensity: 0.8, colors: ["#0d0221", "#1a0533", "#4b0082", "#9400d3"] },
  },
  underwater: {
    weather: { type: "spores", intensity: 0.4, color: "#40e0d0" },
    fog: { type: "mist", intensity: 0.5, color: "#006994" },
    light: { type: "caustics", intensity: 0.7, color: "#00d4ff" },
    sky: { type: "underwater", intensity: 0.9 },
  },
  apocalypse: {
    weather: { type: "ash", intensity: 0.8 },
    fog: { type: "volumetric", intensity: 0.7, color: "#2a1a0a" },
    light: undefined,
    sky: { type: "storm", intensity: 0.9, colors: ["#1c1c1c", "#363636", "#4a3020"] },
  },
  "cozy-night": {
    weather: { type: "fireflies", intensity: 0.4 },
    fog: { type: "mist", intensity: 0.3, color: "#0a0a20" },
    light: { type: "bloom", intensity: 0.5, color: "#fff5e6", source: { x: 0.5, y: 0.3 } },
    sky: { type: "stars", intensity: 0.6, colors: ["#ffffff", "#fffacd", "#e6e6fa"] },
  },
  haunted: {
    weather: { type: "embers", intensity: 0.3, color: "#4a90a4" },
    fog: { type: "ground", intensity: 0.8, color: "#1a1a2e" },
    light: { type: "godrays", intensity: 0.4, color: "#4a6fa5" },
    sky: { type: "storm", intensity: 0.7, colors: ["#0a0a0f", "#1a1a2e", "#2a2a4e"] },
  },
  synthwave: {
    weather: { type: "sparks", intensity: 0.4, color: "#ff00ff" },
    fog: undefined,
    light: { type: "scanner", intensity: 0.6, color: "#00ffff", source: { x: 0.5, y: 1 } },
    sky: { type: "gradient", intensity: 0.9, colors: ["#ff00ff", "#ff6ec7", "#0a001a"] },
  },
  "zen-garden": {
    weather: { type: "sakura", intensity: 0.5, wind: { x: 0.2, y: 0 } },
    fog: { type: "mist", intensity: 0.4, color: "#f0f0f0" },
    light: { type: "godrays", intensity: 0.5, color: "#ffe4b5" },
    sky: { type: "sunset", intensity: 0.7, colors: ["#ff6b35", "#f7c59f", "#2e294e"] },
  },
  volcanic: {
    weather: { type: "embers", intensity: 0.8 },
    fog: { type: "volumetric", intensity: 0.6, color: "#1a0a00" },
    light: undefined,
    sky: { type: "heat", intensity: 0.9, colors: ["#ff4500", "#ff6347", "#1a0500"] },
  },
  arctic: {
    weather: { type: "snow", intensity: 0.7, wind: { x: 0.2, y: 0 } },
    fog: { type: "mist", intensity: 0.5, color: "#e8f4ff" },
    light: { type: "rim", intensity: 0.4, color: "#00f0ff" },
    sky: { type: "aurora", intensity: 0.6, colors: ["#00ff87", "#60efff", "#0a1a2f"] },
  },
  noir: {
    weather: { type: "rain", intensity: 0.6, wind: { x: -0.2, y: 0 } },
    fog: { type: "depth", intensity: 0.7, color: "#0a0a0f" },
    light: { type: "spotlight", intensity: 0.8, color: "#ffffff", source: { x: 0.3, y: 0 }, width: 0.4 },
    sky: { type: "clouds", intensity: 0.5, colors: ["#1a1a1a", "#2a2a2a", "#0a0a0a"] },
  },
  ethereal: {
    weather: { type: "spores", intensity: 0.5, color: "#da70d6" },
    fog: undefined,
    light: { type: "bloom", intensity: 0.6, color: "#e6e6fa", source: { x: 0.5, y: 0.5 } },
    sky: { type: "nebula", intensity: 0.7, colors: ["#4b0082", "#8a2be2", "#da70d6"] },
  },
  matrix: {
    weather: { type: "rain", intensity: 0.9, color: "#00ff00", wind: { x: 0, y: 0 } },
    fog: undefined,
    light: { type: "scanner", intensity: 0.4, color: "#00ff00", source: { x: 0.5, y: 0 } },
    sky: { type: "gradient", intensity: 0.8, colors: ["#001a00", "#003300", "#000a00"] },
  },
  rave: {
    weather: { type: "sparks", intensity: 0.6 },
    fog: undefined,
    light: { type: "laser", intensity: 0.8, color: "#ff0000", angle: 45 },
    sky: { type: "cosmic", intensity: 0.7, colors: ["#0d0221", "#ff00ff", "#00ffff", "#ff00ff"] },
  },
  "alien-world": {
    weather: { type: "spores", intensity: 0.6, color: "#7fff00" },
    fog: { type: "volumetric", intensity: 0.5, color: "#1a0033" },
    light: { type: "caustics", intensity: 0.5, color: "#7fff00" },
    sky: { type: "nebula", intensity: 0.8, colors: ["#1a0033", "#4b0082", "#7fff00"] },
  },
};

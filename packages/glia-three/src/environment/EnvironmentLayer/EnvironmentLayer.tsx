"use client";

import { useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";
import { getPerformanceConfig } from "../shared/performance";
import type { EnvironmentStylePreset } from "../shared/types";
import { WeatherLayer } from "../WeatherLayer";
import type { WeatherLayerProps } from "../WeatherLayer";
import { FogLayer } from "../FogLayer";
import type { FogLayerProps } from "../FogLayer";
import { VolumetricLight } from "../VolumetricLight";
import type { VolumetricLightProps } from "../VolumetricLight";
import { AuroraLayer } from "../AuroraLayer";
import type { AuroraLayerProps } from "../AuroraLayer";
import { ENVIRONMENT_PRESETS, type EnvironmentPreset } from "./presets";

export interface EnvironmentLayerProps {
  preset: EnvironmentPreset;
  enabled?: boolean;
  intensity?: number;
  stylePreset?: EnvironmentStylePreset;
  className?: string;
  style?: React.CSSProperties;
  weatherOverride?: Partial<Omit<WeatherLayerProps, "enabled" | "className" | "style">>;
  fogOverride?: Partial<Omit<FogLayerProps, "enabled" | "className" | "style">>;
  lightOverride?: Partial<Omit<VolumetricLightProps, "enabled" | "className" | "style">>;
  skyOverride?: Partial<Omit<AuroraLayerProps, "enabled" | "className" | "style">>;
}

export function EnvironmentLayer({
  preset,
  enabled = true,
  intensity = 1,
  stylePreset,
  className,
  style,
  weatherOverride,
  fogOverride,
  lightOverride,
  skyOverride,
}: EnvironmentLayerProps) {
  const reducedMotion = useReducedMotion();
  const perfConfig = getPerformanceConfig();
  const resolvedStylePreset: EnvironmentStylePreset = stylePreset ?? (perfConfig.useShaders ? "cinematic" : "ui");

  if (!enabled || reducedMotion || perfConfig.tier === "minimal") {
    return null;
  }

  const config = ENVIRONMENT_PRESETS[preset];

  if (!config) {
    console.warn(
      `EnvironmentLayer: Unknown preset "${preset}". Available presets: ${Object.keys(ENVIRONMENT_PRESETS).join(", ")}`
    );
    return null;
  }

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={style}
      aria-hidden="true"
    >
      {config.sky && (
        <AuroraLayer
          enabled={enabled}
          {...config.sky}
          stylePreset={resolvedStylePreset}
          intensity={(config.sky.intensity ?? 1) * intensity}
          {...skyOverride}
        />
      )}
      {config.fog && (
        <FogLayer
          enabled={enabled}
          {...config.fog}
          stylePreset={resolvedStylePreset}
          intensity={(config.fog.intensity ?? 1) * intensity}
          {...fogOverride}
        />
      )}
      {config.light && (
        <VolumetricLight
          enabled={enabled}
          {...config.light}
          stylePreset={resolvedStylePreset}
          intensity={(config.light.intensity ?? 1) * intensity}
          {...lightOverride}
        />
      )}
      {config.weather && (
        <WeatherLayer
          enabled={enabled}
          {...config.weather}
          stylePreset={resolvedStylePreset}
          intensity={(config.weather.intensity ?? 1) * intensity}
          {...weatherOverride}
        />
      )}
    </div>
  );
}

EnvironmentLayer.displayName = "EnvironmentLayer";

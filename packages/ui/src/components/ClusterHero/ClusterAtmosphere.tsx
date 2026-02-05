"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { DustMotesLayer } from "../../primitives/ambient/DustMotesLayer";
import { VolumetricLight } from "../../primitives/environment/VolumetricLight";
import { FogLayer } from "../../primitives/environment/FogLayer";
import type { AtmosphereConfig } from "./types.js";

export interface ClusterAtmosphereProps {
  config: AtmosphereConfig;
  accentColor: string;
  className?: string;
}

export function ClusterAtmosphere({
  config,
  accentColor,
  className,
}: ClusterAtmosphereProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden="true"
    >
      {config.dustMotes && (
        <DustMotesLayer
          colors={config.dustMotes.colors}
          density={config.dustMotes.density}
          speed={config.dustMotes.speed}
        />
      )}
      {config.fog && (
        <FogLayer
          type={config.fog.type}
          color={config.fog.color}
          intensity={config.fog.intensity}
        />
      )}
      {config.light && (
        <VolumetricLight
          type={config.light.type}
          color={config.light.color}
          intensity={config.light.intensity}
          source={config.light.source}
        />
      )}
    </div>
  );
}

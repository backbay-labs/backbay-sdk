/**
 * HeroScene — Combined QuantumField + EnvironmentLayer
 *
 * Layers a shader-based quantum field substrate with atmospheric
 * environment effects (weather, fog, volumetric light, sky) to create
 * rich, cinematic hero backgrounds.
 */

import React from "react";
import { FieldLayer } from "./FieldLayer";
import { FieldProvider } from "./FieldProvider";
import type { FieldConfig } from "./types";
import {
  EnvironmentLayer,
  type EnvironmentLayerProps,
} from "@backbay/glia-three/environment";

export interface HeroSceneProps {
  /** Quantum field configuration (PCB/constellation/water shader base) */
  fieldConfig: Partial<FieldConfig>;
  /** Environment layer props (weather + fog + light + sky overlay) */
  environment?: Omit<EnvironmentLayerProps, "className" | "style">;
  /** Optional custom environment config (bypasses preset system) */
  customEnvironment?: {
    weather?: EnvironmentLayerProps["weatherOverride"];
    fog?: EnvironmentLayerProps["fogOverride"];
    light?: EnvironmentLayerProps["lightOverride"];
    sky?: EnvironmentLayerProps["skyOverride"];
  };
  /** Overall intensity multiplier for the environment (0-1) */
  environmentIntensity?: number;
  /** Background CSS for the scene container */
  background?: string;
}

const FIELD_BASE: Partial<FieldConfig> = {
  style: "pcb",
  ambientReveal: 0.8,
  lensEnabled: false,
  enableTrails: false,
};

export function HeroScene({
  fieldConfig,
  environment,
  customEnvironment,
  environmentIntensity = 0.8,
  background = "#000",
}: HeroSceneProps) {
  const merged = { ...FIELD_BASE, ...fieldConfig };

  return (
    <FieldProvider config={merged}>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Base layer: Quantum Field shader */}
        <FieldLayer config={merged} pinToViewport zIndex={0} />

        {/* Overlay: Environment atmospheric effects */}
        {(environment || customEnvironment) && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1,
              pointerEvents: "none",
            }}
          >
            <EnvironmentLayer
              preset="deep-space"
              {...environment}
              intensity={
                (environment?.intensity ?? 1) * environmentIntensity
              }
              weatherOverride={{
                ...environment?.weatherOverride,
                ...customEnvironment?.weather,
              }}
              fogOverride={{
                ...environment?.fogOverride,
                ...customEnvironment?.fog,
              }}
              lightOverride={{
                ...environment?.lightOverride,
                ...customEnvironment?.light,
              }}
              skyOverride={{
                ...environment?.skyOverride,
                ...customEnvironment?.sky,
              }}
            />
          </div>
        )}
      </div>
    </FieldProvider>
  );
}

HeroScene.displayName = "HeroScene";

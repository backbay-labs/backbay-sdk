"use client";

/**
 * AmbientField - 3D reactive background field
 *
 * A shader-based ambient layer that responds to Backbay domain events,
 * creating visual impulses, anchors, and hover effects.
 */

import * as React from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  createFieldUniforms,
  createPlaneMaterial,
  createPointsMaterial,
  createPointsGeometry,
} from "./shaders/constellation";
import { useFieldBus, useFieldState, FieldProvider } from "./FieldProvider";
import type { FieldUniforms } from "./types";
import { DEFAULT_FIELD_CONFIG } from "./types";

// -----------------------------------------------------------------------------
// Field Plane Component
// -----------------------------------------------------------------------------

interface FieldPlaneProps {
  uniforms: FieldUniforms;
  width: number;
  height: number;
}

function FieldPlane({ uniforms, width, height }: FieldPlaneProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const materialRef = React.useRef<THREE.ShaderMaterial | null>(null);

  // Create material once
  if (!materialRef.current) {
    materialRef.current = createPlaneMaterial(uniforms);
  }

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      materialRef.current?.dispose();
    };
  }, []);

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <primitive object={materialRef.current} attach="material" />
    </mesh>
  );
}

// -----------------------------------------------------------------------------
// Field Points Component
// -----------------------------------------------------------------------------

interface FieldPointsProps {
  uniforms: FieldUniforms;
  count: number;
  width: number;
  height: number;
}

function FieldPoints({ uniforms, count, width, height }: FieldPointsProps) {
  const pointsRef = React.useRef<THREE.Points>(null);
  const geometryRef = React.useRef<THREE.BufferGeometry | null>(null);
  const materialRef = React.useRef<THREE.ShaderMaterial | null>(null);

  // Create geometry and material once
  if (!geometryRef.current) {
    geometryRef.current = createPointsGeometry(count, width, height);
  }
  if (!materialRef.current) {
    materialRef.current = createPointsMaterial(uniforms);
  }

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      geometryRef.current?.dispose();
      materialRef.current?.dispose();
    };
  }, []);

  // Recreate geometry when dimensions change
  React.useEffect(() => {
    if (geometryRef.current) {
      geometryRef.current.dispose();
      geometryRef.current = createPointsGeometry(count, width, height);
    }
  }, [count, width, height]);

  return (
    <points ref={pointsRef} position={[0, 0, 0.02]}>
      <primitive object={geometryRef.current} attach="geometry" />
      <primitive object={materialRef.current} attach="material" />
    </points>
  );
}

// -----------------------------------------------------------------------------
// Field Scene (internal component that runs inside Canvas)
// -----------------------------------------------------------------------------

interface FieldSceneProps {
  enablePoints?: boolean;
  pointsCount?: number;
  probeRadius?: number;
}

function FieldScene({
  enablePoints = true,
  pointsCount = 3000,
  probeRadius = 0.08,
}: FieldSceneProps) {
  const bus = useFieldBus();
  const state = useFieldState();
  const { size, viewport } = useThree();

  // Create uniforms once
  const uniformsRef = React.useRef<FieldUniforms | null>(null);
  if (!uniformsRef.current) {
    uniformsRef.current = createFieldUniforms();
  }
  const uniforms = uniformsRef.current;

  // Update resolution
  React.useEffect(() => {
    uniforms.uResolution.value.x = size.width;
    uniforms.uResolution.value.y = size.height;
  }, [size, uniforms]);

  // Update probe radius
  React.useEffect(() => {
    uniforms.uProbeRadius.value = probeRadius;
  }, [probeRadius, uniforms]);

  // Animation frame
  useFrame((frameState, delta) => {
    const now = Date.now();

    // Update time
    uniforms.uTime.value = frameState.clock.elapsedTime;

    // Tick the bus
    bus.tick(delta * 1000, now);

    // Update hover state
    const hover = state.hover;
    uniforms.uHover.value.x = hover.uv.x;
    uniforms.uHover.value.y = hover.uv.y;
    uniforms.uHover.value.z = hover.intent === "etch" ? 1 : 0;
    uniforms.uHover.value.w = hover.active ? 1 : 0;

    // Update impulses
    const impulses = state.impulses;
    const config = bus.getConfig();
    const decayMs = config.impulseDecayMs;

    uniforms.uImpulseCount.value = Math.min(impulses.length, 24);

    for (let i = 0; i < 24; i++) {
      if (i < impulses.length) {
        const imp = impulses[i];
        uniforms.uImpulses.value[i].x = imp.uv.x;
        uniforms.uImpulses.value[i].y = imp.uv.y;
        uniforms.uImpulses.value[i].z = imp.radius;
        uniforms.uImpulses.value[i].w = imp.amplitude;

        // Calculate age (0-1)
        const age = Math.min(1, (now - imp.startTs) / decayMs);
        uniforms.uImpulsesAge.value[i] = age;
      } else {
        uniforms.uImpulsesAge.value[i] = 1;
      }
    }

    // Update anchors
    const anchors = Array.from(state.anchors.values());
    uniforms.uAnchorCount.value = Math.min(anchors.length, 8);

    for (let i = 0; i < 8; i++) {
      if (i < anchors.length) {
        const anchor = anchors[i];
        uniforms.uAnchors.value[i].x = anchor.uv.x;
        uniforms.uAnchors.value[i].y = anchor.uv.y;
        uniforms.uAnchors.value[i].z = anchor.strength;
        uniforms.uAnchors.value[i].w = (now - anchor.createdTs) * 0.001; // Phase

        // Color mapping (simplified)
        const colorMap: Record<string, [number, number, number]> = {
          cyan: [0, 0.94, 1],
          emerald: [0, 1, 0.53],
          amber: [1, 0.76, 0],
          rose: [1, 0.2, 0.5],
          violet: [0.56, 0.2, 1],
          slate: [0.4, 0.45, 0.5],
        };
        const rgb = colorMap[anchor.color] || colorMap.cyan;
        uniforms.uAnchorColors.value[i].x = rgb[0];
        uniforms.uAnchorColors.value[i].y = rgb[1];
        uniforms.uAnchorColors.value[i].z = rgb[2];
        uniforms.uAnchorColors.value[i].w = 1;
      }
    }
  });

  // Calculate plane dimensions based on viewport
  const planeWidth = viewport.width * 1.2;
  const planeHeight = viewport.height * 1.2;

  return (
    <>
      <FieldPlane uniforms={uniforms} width={planeWidth} height={planeHeight} />
      {enablePoints && (
        <FieldPoints
          uniforms={uniforms}
          count={pointsCount}
          width={planeWidth}
          height={planeHeight}
        />
      )}
    </>
  );
}

// -----------------------------------------------------------------------------
// Main AmbientField Component
// -----------------------------------------------------------------------------

export interface AmbientFieldProps {
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Field of view */
  fov?: number;
  /** Camera Z position */
  cameraZ?: number;
  /** Device pixel ratio */
  dpr?: number;
  /** Enable point stars */
  enablePoints?: boolean;
  /** Number of point stars */
  pointsCount?: number;
  /** Probe effect radius */
  probeRadius?: number;
  /** Use global field bus singleton */
  useGlobalBus?: boolean;
  /** Children to render inside provider context */
  children?: React.ReactNode;
}

export function AmbientField({
  className,
  style,
  fov = DEFAULT_FIELD_CONFIG.fov,
  cameraZ = DEFAULT_FIELD_CONFIG.cameraZ,
  dpr = DEFAULT_FIELD_CONFIG.dpr,
  enablePoints = DEFAULT_FIELD_CONFIG.enablePoints,
  pointsCount = DEFAULT_FIELD_CONFIG.pointsCount,
  probeRadius = DEFAULT_FIELD_CONFIG.probeRadius,
  useGlobalBus = false,
  children,
}: AmbientFieldProps) {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        ...style,
      }}
    >
      <FieldProvider useGlobal={useGlobalBus}>
        <Canvas
          dpr={dpr}
          camera={{
            fov,
            position: [0, 0, cameraZ],
            near: 0.1,
            far: 100,
          }}
          style={{ background: "transparent" }}
        >
          <FieldScene
            enablePoints={enablePoints}
            pointsCount={pointsCount}
            probeRadius={probeRadius}
          />
        </Canvas>
        {children}
      </FieldProvider>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Hook to access field bus from outside Canvas
// -----------------------------------------------------------------------------

export { useFieldBus, useFieldState } from "./FieldProvider";

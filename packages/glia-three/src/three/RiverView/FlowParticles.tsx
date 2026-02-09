"use client";

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getPointOnRiver, RIVER_DEFAULTS } from "./riverHelpers";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface FlowParticlesProps {
  /** The river curve to flow along. */
  curve: THREE.CatmullRomCurve3;
  /** River width — particles are distributed laterally within this. */
  width?: number;
  /** Number of particles. */
  count?: number;
  /** Base flow speed multiplier. */
  speed?: number;
  /** Particle colour. */
  color?: string;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function FlowParticles({
  curve,
  width = RIVER_DEFAULTS.width,
  count = RIVER_DEFAULTS.particleCount,
  speed = RIVER_DEFAULTS.flowSpeed,
  color = "#22D3EE",
}: FlowParticlesProps) {
  const pointsRef = React.useRef<THREE.Points>(null);

  const data = React.useMemo(() => {
    const positions = new Float32Array(count * 3);
    const ts = new Float32Array(count); // parametric t along curve
    const laterals = new Float32Array(count); // lateral offset
    const speeds = new Float32Array(count); // per-particle speed factor

    for (let i = 0; i < count; i++) {
      ts[i] = Math.random();
      laterals[i] = (Math.random() - 0.5) * width * 0.9;
      speeds[i] = 0.8 + Math.random() * 0.4; // 0.8x .. 1.2x

      const pt = getPointOnRiver(curve, ts[i], laterals[i]);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;
    }

    return { positions, ts, laterals, speeds };
  }, [curve, count, width]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const positions = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      // Advance along curve
      data.ts[i] += delta * 0.06 * speed * data.speeds[i];

      // Wrap back to start with a new random lateral offset
      if (data.ts[i] > 1) {
        data.ts[i] -= 1;
        data.laterals[i] = (Math.random() - 0.5) * width * 0.9;
      }

      const pt = getPointOnRiver(curve, data.ts[i], data.laterals[i]);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y + (Math.random() - 0.5) * 0.01; // tiny vertical jitter
      positions[i * 3 + 2] = pt.z;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[data.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.015}
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

FlowParticles.displayName = "FlowParticles";

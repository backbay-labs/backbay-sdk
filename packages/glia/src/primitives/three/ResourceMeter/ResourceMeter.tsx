"use client";

/**
 * ResourceMeter - 3D cylindrical gauge visualization
 *
 * A glass-like cylinder that fills to represent resource usage,
 * with color transitions based on configurable thresholds.
 */

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { ResourceMeterProps } from "./types";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const SIZE_MAP = {
  sm: { radius: 0.3, height: 2 },
  md: { radius: 0.5, height: 3 },
  lg: { radius: 0.7, height: 4 },
} as const;

const COLOR_EMERALD = new THREE.Color("#10B981");
const COLOR_AMBER = new THREE.Color("#F59E0B");
const COLOR_RED = new THREE.Color("#EF4444");

function getFillColor(
  value: number,
  thresholds: { warn: number; critical: number }
): THREE.Color {
  const color = new THREE.Color();
  if (value <= thresholds.warn) {
    // Emerald zone
    const t = value / thresholds.warn;
    color.lerpColors(COLOR_EMERALD, COLOR_AMBER, t * 0.3);
  } else if (value <= thresholds.critical) {
    // Transition from emerald-amber blend to amber
    const t =
      (value - thresholds.warn) / (thresholds.critical - thresholds.warn);
    color.lerpColors(COLOR_AMBER, COLOR_RED, t * 0.5);
  } else {
    // Critical zone: amber-red to full red
    const t =
      (value - thresholds.critical) / (100 - thresholds.critical);
    color.lerpColors(COLOR_RED, new THREE.Color("#DC2626"), Math.min(t, 1));
  }
  return color;
}

// -----------------------------------------------------------------------------
// Liquid Surface Sub-component
// -----------------------------------------------------------------------------

interface LiquidSurfaceProps {
  radius: number;
  y: number;
  color: THREE.Color;
  animate: boolean;
}

function LiquidSurface({ radius, y, color, animate }: LiquidSurfaceProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const geoRef = React.useRef<THREE.PlaneGeometry>(null);

  useFrame(({ clock }) => {
    if (!animate || !geoRef.current) return;
    const t = clock.elapsedTime;
    const positions = geoRef.current.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      positions.setY(
        i,
        Math.sin(t * 2 + dist * 4) * 0.02 +
          Math.sin(t * 3.1 + x * 3) * 0.01
      );
    }
    positions.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry ref={geoRef} args={[radius * 0.92, 24, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.4}
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// -----------------------------------------------------------------------------
// Tick Mark Ring
// -----------------------------------------------------------------------------

interface TickRingProps {
  y: number;
  radius: number;
}

function TickRing({ y, radius }: TickRingProps) {
  return (
    <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius * 1.01, 0.008, 4, 32]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.15}
        depthWrite={false}
      />
    </mesh>
  );
}

// -----------------------------------------------------------------------------
// Main ResourceMeter Component
// -----------------------------------------------------------------------------

export function ResourceMeter({
  value,
  label,
  unit = "%",
  maxValue,
  currentValue,
  thresholds = { warn: 60, critical: 85 },
  showLabel = true,
  animate = true,
  size = "md",
}: ResourceMeterProps) {
  const { radius, height } = SIZE_MAP[size];
  const animatedValue = React.useRef(0);
  const fillMatRef = React.useRef<THREE.MeshStandardMaterial>(null);
  const fillMeshRef = React.useRef<THREE.Mesh>(null);

  const clampedValue = Math.max(0, Math.min(100, value));

  // Smooth value transition
  useFrame((_, delta) => {
    const target = clampedValue;
    const diff = target - animatedValue.current;
    animatedValue.current += diff * Math.min(delta * 3, 1);

    const v = animatedValue.current;
    const fillHeight = (v / 100) * height;

    // Update fill cylinder scale and position
    if (fillMeshRef.current) {
      fillMeshRef.current.scale.y = Math.max(v / 100, 0.001);
      fillMeshRef.current.position.y = fillHeight / 2;
    }

    // Update fill color
    if (fillMatRef.current) {
      const color = getFillColor(v, thresholds);
      fillMatRef.current.color.copy(color);
      fillMatRef.current.emissive.copy(color);
      fillMatRef.current.emissiveIntensity =
        0.2 + (v > thresholds.critical ? 0.3 : 0);
    }
  });

  const initialColor = getFillColor(clampedValue, thresholds);

  // Build display string
  const displayText =
    currentValue != null && maxValue != null
      ? `${currentValue} / ${maxValue} ${unit}`
      : `${Math.round(clampedValue)}${unit}`;

  return (
    <group>
      {/* Glass base */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[radius * 1.3, radius * 1.3, 0.1, 32]} />
        <meshPhysicalMaterial
          color="#1a2a3a"
          transmission={0.2}
          roughness={0.1}
          metalness={0.3}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Outer glass shell */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius, height, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#88ccff"
          transmission={0.3}
          roughness={0.1}
          metalness={0.1}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Inner fill cylinder */}
      <mesh ref={fillMeshRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[radius * 0.92, radius * 0.92, height, 32]} />
        <meshStandardMaterial
          ref={fillMatRef}
          color={initialColor}
          emissive={initialColor}
          emissiveIntensity={0.2}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Liquid surface on top of fill */}
      <LiquidSurface
        radius={radius}
        y={(clampedValue / 100) * height}
        color={initialColor}
        animate={animate}
      />

      {/* Tick marks at 25%, 50%, 75% */}
      <TickRing y={height * 0.25} radius={radius} />
      <TickRing y={height * 0.5} radius={radius} />
      <TickRing y={height * 0.75} radius={radius} />

      {/* Point light inside for glow */}
      <pointLight
        position={[0, (clampedValue / 100) * height * 0.5, 0]}
        color={initialColor}
        intensity={0.15}
        distance={height}
      />

      {/* Html label */}
      {showLabel && (
        <Html position={[0, -0.4, 0]} center>
          <div
            className="text-xs font-mono px-3 py-2 rounded-md border text-center"
            style={{
              background: "rgba(2, 4, 10, 0.85)",
              backdropFilter: "blur(24px)",
              borderColor: "rgba(255,255,255,0.06)",
              boxShadow: `0 0 15px rgba(16,185,129,0.15)`,
              minWidth: "80px",
              whiteSpace: "nowrap",
            }}
          >
            <div
              className="font-bold tracking-wider mb-0.5"
              style={{ color: "#22D3EE", fontSize: "9px" }}
            >
              {label}
            </div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "10px" }}>
              {displayText}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

ResourceMeter.displayName = "ResourceMeter";

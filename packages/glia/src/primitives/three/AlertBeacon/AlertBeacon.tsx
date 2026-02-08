"use client";

/**
 * AlertBeacon - 3D alert severity orb with pulse and ripple effects
 *
 * A glowing sphere that communicates alert severity through color,
 * pulsation speed, and expanding ripple rings.
 */

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { AlertBeaconProps, AlertSeverity } from "./types";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { color: string; pulseSpeed: number; emissiveBase: number }
> = {
  info: { color: "#22D3EE", pulseSpeed: 1.5, emissiveBase: 0.4 },
  warning: { color: "#F59E0B", pulseSpeed: 2.5, emissiveBase: 0.5 },
  critical: { color: "#EF4444", pulseSpeed: 6, emissiveBase: 0.7 },
  resolved: { color: "#10B981", pulseSpeed: 0, emissiveBase: 0.3 },
};

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: "INFO",
  warning: "WARN",
  critical: "CRIT",
  resolved: "OK",
};

// -----------------------------------------------------------------------------
// Ripple Ring Sub-component
// -----------------------------------------------------------------------------

interface RippleRingProps {
  color: THREE.Color;
  offset: number; // 0, 0.333, 0.666
}

function RippleRing({ color, offset }: RippleRingProps) {
  const ringRef = React.useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.elapsedTime;
    // 2-second cycle, staggered by offset
    const progress = ((t + offset * 2) % 2) / 2; // 0 to 1
    const scale = 0.5 + progress * 2;
    const opacity = (1 - progress) * 0.4;

    ringRef.current.scale.set(scale, scale, 1);
    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.max(opacity, 0);
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.6, 0.02, 8, 48]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// -----------------------------------------------------------------------------
// Main AlertBeacon Component
// -----------------------------------------------------------------------------

export function AlertBeacon({
  severity,
  label,
  message,
  pulse = true,
  ripples = false,
  size = 1,
  onClick,
}: AlertBeaconProps) {
  const orbRef = React.useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);

  const config = SEVERITY_CONFIG[severity];
  const color = React.useMemo(() => new THREE.Color(config.color), [config.color]);

  // Pulse animation
  useFrame(({ clock }) => {
    if (!orbRef.current) return;
    const t = clock.elapsedTime;
    const mat = orbRef.current.material as THREE.MeshStandardMaterial;

    if (pulse && config.pulseSpeed > 0) {
      const p = Math.sin(t * config.pulseSpeed) * 0.5 + 0.5;
      const scaleVal = size * (0.9 + p * 0.2);
      orbRef.current.scale.setScalar(scaleVal);
      mat.emissiveIntensity = config.emissiveBase + p * 0.4;
    } else {
      orbRef.current.scale.setScalar(size);
      mat.emissiveIntensity = config.emissiveBase;
    }
  });

  return (
    <group
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Central orb */}
      <mesh ref={orbRef}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={config.emissiveBase}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Inner glow layer */}
      <mesh>
        <sphereGeometry args={[0.42 * size, 24, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Point light inside */}
      <pointLight color={color} intensity={0.3} distance={3} />

      {/* Ripple rings */}
      {ripples && (
        <>
          <RippleRing color={color} offset={0} />
          <RippleRing color={color} offset={0.333} />
          <RippleRing color={color} offset={0.666} />
        </>
      )}

      {/* Hover tooltip */}
      {hovered && (label || message) && (
        <Html position={[0, 0.8 * size, 0]} center>
          <div
            className="text-xs font-mono px-3 py-2 rounded-md border"
            style={{
              background: "rgba(2, 4, 10, 0.85)",
              backdropFilter: "blur(24px)",
              borderColor: "rgba(255,255,255,0.06)",
              boxShadow: `0 0 20px ${config.color}40`,
              minWidth: "100px",
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
          >
            {label && (
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-white/90 font-bold tracking-wider"
                  style={{ fontSize: "10px" }}
                >
                  {label}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded text-white font-bold"
                  style={{
                    fontSize: "8px",
                    background: config.color,
                    opacity: 0.9,
                  }}
                >
                  {SEVERITY_LABELS[severity]}
                </span>
              </div>
            )}
            {message && (
              <div
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "9px",
                  maxWidth: "160px",
                }}
              >
                {message}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

AlertBeacon.displayName = "AlertBeacon";

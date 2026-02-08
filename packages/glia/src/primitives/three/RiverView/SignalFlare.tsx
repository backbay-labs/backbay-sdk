"use client";

/**
 * SignalFlare - Crystalline flash effect that appears near an ActionNode
 * when a Detector fires a Signal.
 *
 * Tetrahedron shell with glowing edges and an inner emissive core.
 * Starts bright and large, then fades to a dim persistent glow marker.
 * Particle burst expands outward on flash then fades over 1s.
 */

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface SignalData {
  id: string;
  type: "novelty" | "risk" | "coverage-gap" | "anomaly" | "behavioral";
  score: number; // 0-1 intensity
  label: string;
  actionId: string;
  detectorId: string;
}

export interface SignalFlareProps {
  signal: SignalData;
  position: [number, number, number];
  visible?: boolean;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const SIGNAL_TYPE_COLORS: Record<SignalData["type"], string> = {
  novelty: "#22D3EE",
  risk: "#EF4444",
  "coverage-gap": "#F59E0B",
  anomaly: "#8B5CF6",
  behavioral: "#F43F5E",
};

const SIGNAL_TYPE_LABELS: Record<SignalData["type"], string> = {
  novelty: "NOVELTY",
  risk: "RISK",
  "coverage-gap": "COVERAGE GAP",
  anomaly: "ANOMALY",
  behavioral: "BEHAVIORAL",
};

// Initial flash duration in seconds
const FLASH_DURATION = 1.0;
const BURST_PARTICLE_COUNT = 30;
const BASE_SIZE = 0.06;

// Shared geometries
const _tetraGeo = new THREE.TetrahedronGeometry(BASE_SIZE, 0);
const _tetraEdgesGeo = new THREE.EdgesGeometry(_tetraGeo, 15);

// -----------------------------------------------------------------------------
// ParticleBurst Sub-component (expands outward then fades over 1s)
// -----------------------------------------------------------------------------

interface ParticleBurstProps {
  color: THREE.Color;
}

function ParticleBurst({ color }: ParticleBurstProps) {
  const pointsRef = React.useRef<THREE.Points>(null);
  const birthRef = React.useRef<number | null>(null);

  const { positions, directions } = React.useMemo(() => {
    const pos = new Float32Array(BURST_PARTICLE_COUNT * 3);
    const dirs: [number, number, number][] = [];
    for (let i = 0; i < BURST_PARTICLE_COUNT; i++) {
      // Start at origin
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
      // Random outward direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 0.15 + Math.random() * 0.2;
      dirs.push([
        speed * Math.sin(phi) * Math.cos(theta),
        speed * Math.sin(phi) * Math.sin(theta),
        speed * Math.cos(phi),
      ]);
    }
    return { positions: pos, directions: dirs };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    if (birthRef.current === null) {
      birthRef.current = clock.elapsedTime;
    }
    const elapsed = clock.elapsedTime - birthRef.current;
    const t = Math.min(elapsed / FLASH_DURATION, 1);

    const arr = pointsRef.current.geometry.attributes.position
      .array as Float32Array;
    for (let i = 0; i < BURST_PARTICLE_COUNT; i++) {
      const dir = directions[i];
      arr[i * 3] = dir[0] * t;
      arr[i * 3 + 1] = dir[1] * t;
      arr[i * 3 + 2] = dir[2] * t;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // Fade opacity
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = Math.max(0, 1 - t) * 0.8;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.015}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function SignalFlare({
  signal,
  position,
  visible = true,
}: SignalFlareProps) {
  const shellRef = React.useRef<THREE.Mesh>(null);
  const edgesRef = React.useRef<THREE.LineSegments>(null);
  const coreRef = React.useRef<THREE.Mesh>(null);
  const glowRef = React.useRef<THREE.Mesh>(null);
  const lightRef = React.useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = React.useState(false);

  // Track birth time to animate the initial flash
  const birthTime = React.useRef<number | null>(null);

  const colorHex = SIGNAL_TYPE_COLORS[signal.type];
  const color = React.useMemo(() => new THREE.Color(colorHex), [colorHex]);

  // Resting glow brightness scales with score
  const restingEmissive = 0.15 + signal.score * 0.25;
  const restingScale = 0.04 + signal.score * 0.03;

  useFrame(({ clock }) => {
    if (!shellRef.current) return;

    // Record birth time on first frame
    if (birthTime.current === null) {
      birthTime.current = clock.elapsedTime;
    }

    const elapsed = clock.elapsedTime - birthTime.current;
    const flashProgress = Math.min(elapsed / FLASH_DURATION, 1);
    // Ease-out curve for the flash decay
    const flashT = 1 - flashProgress * flashProgress;

    // Scale: starts large, settles to resting size
    const peakScale = 0.15 + signal.score * 0.1;
    const currentScale = restingScale + (peakScale - restingScale) * flashT;
    shellRef.current.scale.setScalar(currentScale / BASE_SIZE); // normalize to geometry radius

    // Shell emissive: bright flash decaying to resting glow
    const peakEmissive = 2.0 + signal.score * 2.0;
    const currentEmissive =
      restingEmissive + (peakEmissive - restingEmissive) * flashT;
    const mat = shellRef.current.material as THREE.MeshPhysicalMaterial;
    mat.emissiveIntensity = currentEmissive;

    // Edge wireframe opacity fades with flash
    if (edgesRef.current) {
      const edgeMat = edgesRef.current.material as THREE.LineBasicMaterial;
      edgeMat.opacity = 0.2 + flashT * 0.8;
      edgesRef.current.scale.setScalar(currentScale / BASE_SIZE);
    }

    // Inner core emissive fades with flash
    if (coreRef.current) {
      const coreMat = coreRef.current
        .material as THREE.MeshStandardMaterial;
      coreMat.emissiveIntensity = 0.5 + flashT * 1.5;
      coreRef.current.scale.setScalar(currentScale / BASE_SIZE);
    }

    // Outer glow sphere
    if (glowRef.current) {
      const glowMat = glowRef.current.material as THREE.MeshBasicMaterial;
      glowMat.opacity = 0.04 + flashT * 0.2;
      glowRef.current.scale.setScalar((currentScale * 2.5) / 0.12);
    }

    // Point light intensity follows flash
    if (lightRef.current) {
      lightRef.current.intensity = 0.05 + flashT * signal.score * 0.5;
    }
  });

  if (!visible) return null;

  return (
    <group
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main crystalline shell - tetrahedron */}
      <mesh ref={shellRef} geometry={_tetraGeo}>
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.0}
          transparent
          opacity={0.9}
          transmission={0.5}
          roughness={0.1}
          metalness={0.1}
          ior={1.5}
        />
      </mesh>

      {/* Edge wireframe with additive blending */}
      <lineSegments ref={edgesRef} geometry={_tetraEdgesGeo}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={1.0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>

      {/* Inner emissive core sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[BASE_SIZE * 0.3, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.0}
          toneMapped={false}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Core point light (flash-synced) */}
      <pointLight ref={lightRef} color={color} intensity={0.3} distance={2} />

      {/* Outer glow - backSide additive */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Particle burst on flash */}
      <ParticleBurst color={color} />

      {/* Hover label */}
      {hovered && (
        <Html position={[0, 0.3, 0]} center style={{ pointerEvents: "none" }}>
          <div
            className="text-xs font-mono px-3 py-2 rounded-md border"
            style={{
              background: "rgba(2, 4, 10, 0.85)",
              backdropFilter: "blur(24px)",
              borderColor: "rgba(255,255,255,0.06)",
              boxShadow: `0 0 16px ${colorHex}40`,
              minWidth: "100px",
              whiteSpace: "nowrap",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                style={{
                  fontSize: "10px",
                  color: colorHex,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontFamily: "monospace",
                }}
              >
                {SIGNAL_TYPE_LABELS[signal.type]}
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "2px 8px",
                fontSize: "9px",
                fontFamily: "monospace",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.4)" }}>Score</span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                {(signal.score * 100).toFixed(0)}%
              </span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>Label</span>
              <span style={{ color: "rgba(255,255,255,0.7)" }}>
                {signal.label}
              </span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

SignalFlare.displayName = "SignalFlare";

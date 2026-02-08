"use client";

/**
 * IncidentVortex - Whirlpool particle effect marking where an Incident
 * clusters multiple actions.
 *
 * Features a CrystallineOrganism-style glowing icosahedron core at the center,
 * TrustRings-style concentric orbital severity rings, spiraling additive-blended
 * particles, and Tron-like edge wireframe glow.
 */

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface IncidentData {
  id: string;
  label: string;
  severity: "low" | "medium" | "high" | "critical";
  actionIds: string[];
  position: [number, number, number];
}

export interface IncidentVortexProps {
  incident: IncidentData;
  selected?: boolean;
  onClick?: (id: string) => void;
  onHover?: (id: string | null) => void;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const SEVERITY_CONFIG: Record<
  IncidentData["severity"],
  { color: string; particleCount: number; radius: number; speed: number; tier: number }
> = {
  low: { color: "#22D3EE", particleCount: 60, radius: 0.6, speed: 1, tier: 0 },
  medium: { color: "#F59E0B", particleCount: 70, radius: 0.7, speed: 1.4, tier: 1 },
  high: { color: "#F43F5E", particleCount: 85, radius: 0.85, speed: 1.8, tier: 2 },
  critical: { color: "#EF4444", particleCount: 100, radius: 1.0, speed: 2.5, tier: 2 },
};

const SEVERITY_LABELS: Record<IncidentData["severity"], string> = {
  low: "LOW",
  medium: "MED",
  high: "HIGH",
  critical: "CRIT",
};

// Ring configs for 3 concentric orbital rings
const RING_CONFIGS = [
  { radiusFrac: 0.4, metalness: 0.7, roughness: 0.3, tilt: [0.3, 0, 0] as const, markerCount: 3 },
  { radiusFrac: 0.6, metalness: 0.5, roughness: 0.25, tilt: [0.15, 0.2, 0] as const, markerCount: 4 },
  { radiusFrac: 0.8, metalness: 0.3, roughness: 0.2, tilt: [0, 0, 0.25] as const, markerCount: 5 },
];

// -----------------------------------------------------------------------------
// Particle Seeds
// -----------------------------------------------------------------------------

interface ParticleSeed {
  angle: number;
  height: number;
  radiusFrac: number;
  speed: number;
}

function generateParticleSeeds(count: number): ParticleSeed[] {
  const seeds: ParticleSeed[] = [];
  for (let i = 0; i < count; i++) {
    seeds.push({
      angle: (i / count) * Math.PI * 2 + Math.random() * 0.4,
      height: Math.random(),
      radiusFrac: 0.3 + Math.random() * 0.7,
      speed: 0.7 + Math.random() * 0.6,
    });
  }
  return seeds;
}

// -----------------------------------------------------------------------------
// Severity Ring Sub-component
// -----------------------------------------------------------------------------

interface SeverityRingProps {
  radius: number;
  color: THREE.Color;
  metalness: number;
  roughness: number;
  tilt: readonly [number, number, number];
  isActive: boolean;
  markerCount: number;
  speed: number;
}

function SeverityRing({
  radius,
  color,
  metalness,
  roughness,
  tilt,
  isActive,
  markerCount,
  speed,
}: SeverityRingProps) {
  const ringRef = React.useRef<THREE.Mesh>(null);
  const glowRef = React.useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.elapsedTime;

    // Slow rotation
    ringRef.current.rotation.z = t * 0.08 * speed;

    // Pulse for active ring
    if (isActive && glowRef.current) {
      const pulse = Math.sin(t * 2.5) * 0.25 + 0.75;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  const tubeRadius = 0.025;

  return (
    <group rotation={[Math.PI / 2 + tilt[0], tilt[1], tilt[2]]}>
      {/* Main ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[radius, tubeRadius, 12, 48]} />
        <meshStandardMaterial
          color={color}
          metalness={metalness}
          roughness={roughness}
          transparent
          opacity={isActive ? 0.95 : 0.3}
          emissive={color}
          emissiveIntensity={isActive ? 0.6 : 0.05}
        />
      </mesh>

      {/* Glow ring for active tier */}
      {isActive && (
        <mesh ref={glowRef}>
          <torusGeometry args={[radius, tubeRadius * 2.5, 12, 48]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.12}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Marker spheres on active ring */}
      {isActive &&
        Array.from({ length: markerCount }).map((_, i) => {
          const angle = (i / markerCount) * Math.PI * 2;
          const mx = Math.cos(angle) * radius;
          const my = Math.sin(angle) * radius;
          return (
            <mesh key={i} position={[mx, my, 0]}>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial
                color={color}
                metalness={metalness}
                roughness={roughness}
                emissive={color}
                emissiveIntensity={0.8}
              />
            </mesh>
          );
        })}
    </group>
  );
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function IncidentVortex({
  incident,
  selected = false,
  onClick,
  onHover,
}: IncidentVortexProps) {
  const pointsRef = React.useRef<THREE.Points>(null);
  const coreGroupRef = React.useRef<THREE.Group>(null);
  const coreRef = React.useRef<THREE.Mesh>(null);
  const edgesRef = React.useRef<THREE.LineSegments>(null);
  const innerRef = React.useRef<THREE.Mesh>(null);
  const lightRef = React.useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = React.useState(false);

  const config = SEVERITY_CONFIG[incident.severity];
  const color = React.useMemo(() => new THREE.Color(config.color), [config.color]);

  const seeds = React.useMemo(
    () => generateParticleSeeds(config.particleCount),
    [config.particleCount],
  );

  // Build initial positions buffer attribute
  const positionAttr = React.useMemo(() => {
    const arr = new Float32Array(seeds.length * 3);
    return new THREE.BufferAttribute(arr, 3);
  }, [seeds]);

  const activeRadius = selected ? config.radius * 1.3 : config.radius;

  // Core geometry: Icosahedron + EdgesGeometry
  const coreSize = activeRadius * 0.22;
  const coreGeometry = React.useMemo(
    () => new THREE.IcosahedronGeometry(coreSize, 0),
    [coreSize],
  );
  const coreEdgesGeometry = React.useMemo(
    () => new THREE.EdgesGeometry(coreGeometry, 15),
    [coreGeometry],
  );

  // Animate particles + core + edges
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * config.speed;

    // --- Spiral particles ---
    if (pointsRef.current) {
      for (let i = 0; i < seeds.length; i++) {
        const s = seeds[i];
        const angle = s.angle + t * s.speed;
        const heightT = (s.height + t * 0.15 * s.speed) % 1;
        const r = activeRadius * s.radiusFrac * (0.2 + heightT * 0.8);
        const y = heightT * 1.2 - 0.1;

        positionAttr.setXYZ(i, Math.cos(angle) * r, y, Math.sin(angle) * r);
      }
      positionAttr.needsUpdate = true;
    }

    // --- Core rotation + breathing ---
    if (coreGroupRef.current) {
      coreGroupRef.current.rotation.y += 0.008 * config.speed;
      coreGroupRef.current.rotation.x += 0.004 * config.speed;

      // Breathing
      const breathe = 1 + Math.sin(t * 1.5) * 0.08;
      coreGroupRef.current.scale.setScalar(breathe);
    }

    // --- Edge wireframe pulsing ---
    if (edgesRef.current) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 2);
      const mat = edgesRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.5 + pulse * 0.5;
    }

    // --- Inner emissive sphere pulsing ---
    if (innerRef.current) {
      const coreScale = 0.85 + 0.3 * Math.sin(t * 3);
      innerRef.current.scale.setScalar(coreScale);
    }

    // --- Point light intensity ---
    if (lightRef.current) {
      const lightPulse = 0.7 + 0.3 * Math.sin(t * 2);
      lightRef.current.intensity = (selected ? 0.8 : 0.4) * lightPulse;
    }
  });

  const handlePointerOver = React.useCallback(() => {
    setHovered(true);
    onHover?.(incident.id);
    document.body.style.cursor = "pointer";
  }, [incident.id, onHover]);

  const handlePointerOut = React.useCallback(() => {
    setHovered(false);
    onHover?.(null);
    document.body.style.cursor = "auto";
  }, [onHover]);

  const handleClick = React.useCallback(() => {
    onClick?.(incident.id);
  }, [incident.id, onClick]);

  return (
    <group
      position={incident.position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* === Crystalline Core === */}
      <group ref={coreGroupRef}>
        {/* Inner emissive sphere */}
        <mesh ref={innerRef}>
          <sphereGeometry args={[coreSize * 0.35, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.5}
            toneMapped={false}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Icosahedron shell - meshPhysicalMaterial */}
        <mesh ref={coreRef} geometry={coreGeometry}>
          <meshPhysicalMaterial
            color={color}
            transparent
            opacity={0.4}
            transmission={0.4}
            roughness={0.15}
            metalness={0.2}
            ior={1.5}
            thickness={coreSize * 0.3}
            side={THREE.DoubleSide}
            envMapIntensity={0.4}
          />
        </mesh>

        {/* Glowing EdgesGeometry wireframe */}
        <lineSegments ref={edgesRef} geometry={coreEdgesGeometry}>
          <lineBasicMaterial
            color={color}
            transparent
            opacity={0.8}
            linewidth={2}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>
      </group>

      {/* === Point light for ambient glow === */}
      <pointLight
        ref={lightRef}
        color={color}
        intensity={selected ? 0.8 : 0.4}
        distance={3}
        decay={2}
      />

      {/* === Orbital Severity Rings === */}
      {RING_CONFIGS.map((ring, i) => (
        <SeverityRing
          key={i}
          radius={activeRadius * ring.radiusFrac}
          color={color}
          metalness={ring.metalness}
          roughness={ring.roughness}
          tilt={ring.tilt}
          isActive={i === config.tier}
          markerCount={ring.markerCount}
          speed={config.speed}
        />
      ))}

      {/* === Spiral particle cloud === */}
      <points ref={pointsRef}>
        <bufferGeometry attach="geometry">
          <primitive attach="attributes-position" object={positionAttr} />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={0.03}
          transparent
          opacity={selected ? 0.85 : 0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
          toneMapped={false}
        />
      </points>

      {/* === Outer glow halo === */}
      <mesh>
        <sphereGeometry args={[activeRadius * 0.5, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={selected ? 0.08 : 0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* === Hover tooltip === */}
      {hovered && (
        <Html position={[0, 1.5, 0]} center style={{ pointerEvents: "none" }}>
          <div
            className="text-xs font-mono px-3 py-2 rounded-md border"
            style={{
              background: "rgba(2, 4, 10, 0.85)",
              backdropFilter: "blur(24px)",
              borderColor: "rgba(255,255,255,0.06)",
              boxShadow: `0 0 20px ${config.color}40`,
              minWidth: "120px",
              whiteSpace: "nowrap",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-white/90 font-bold tracking-wider"
                style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em" }}
              >
                {incident.label}
              </span>
              <span
                className="px-1.5 py-0.5 rounded text-white font-bold"
                style={{
                  fontSize: "8px",
                  background: config.color,
                  opacity: 0.9,
                }}
              >
                {SEVERITY_LABELS[incident.severity]}
              </span>
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: "9px",
                fontFamily: "monospace",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              {incident.actionIds.length} action{incident.actionIds.length !== 1 ? "s" : ""}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

IncidentVortex.displayName = "IncidentVortex";

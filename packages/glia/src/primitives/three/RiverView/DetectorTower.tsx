"use client";

/**
 * DetectorTower - A watchtower/sensor positioned on the riverbank.
 *
 * Crystalline column base with a faceted sensor head that sweeps like a
 * lighthouse beam when active. Fires a brief beam toward an action when a
 * signal triggers. Uses CrystallineOrganism-style materials and wireframes.
 */

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface DetectorData {
  id: string;
  label: string;
  type: "heuristic" | "model" | "signature" | "behavioral";
  position: [number, number, number];
  active: boolean;
  signalCount: number;
}

export interface DetectorTowerProps {
  detector: DetectorData;
  onClick?: (id: string) => void;
  /** Position of the last action this detector fired a signal toward. */
  beamTarget?: [number, number, number] | null;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const DETECTOR_TYPE_COLORS: Record<DetectorData["type"], string> = {
  heuristic: "#22D3EE",
  model: "#8B5CF6",
  signature: "#F59E0B",
  behavioral: "#10B981",
};

const DETECTOR_TYPE_LABELS: Record<DetectorData["type"], string> = {
  heuristic: "HEURISTIC",
  model: "MODEL",
  signature: "SIGNATURE",
  behavioral: "BEHAVIORAL",
};

// Tower geometry constants
const BASE_HEIGHT = 0.5;
const HEAD_RADIUS = 0.1;
const SWEEP_CONE_LENGTH = 1.5;
const PARTICLE_COUNT = 20;

// -----------------------------------------------------------------------------
// Sweep Cone Sub-component (with edge wireframe glow)
// -----------------------------------------------------------------------------

interface SweepConeProps {
  color: THREE.Color;
  speed: number;
}

const _coneGeo = new THREE.ConeGeometry(0.4, SWEEP_CONE_LENGTH, 16, 1, true);
const _coneEdgesGeo = new THREE.EdgesGeometry(_coneGeo, 15);

function SweepCone({ color, speed }: SweepConeProps) {
  const coneRef = React.useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!coneRef.current) return;
    coneRef.current.rotation.y = clock.elapsedTime * speed * 1.2;
  });

  return (
    <group
      ref={coneRef}
      position={[0, BASE_HEIGHT, 0]}
      rotation={[0, 0, -Math.PI / 2]}
    >
      {/* Cone fill */}
      <mesh geometry={_coneGeo}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Edge wireframe glow on cone */}
      <lineSegments geometry={_coneEdgesGeo}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

// -----------------------------------------------------------------------------
// Beam Line Sub-component (fades after 1s)
// -----------------------------------------------------------------------------

interface BeamLineProps {
  from: [number, number, number];
  to: [number, number, number];
  color: THREE.Color;
}

function BeamLine({ from, to, color }: BeamLineProps) {
  const [opacity, setOpacity] = React.useState(0.7);
  const birthRef = React.useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (birthRef.current === null) {
      birthRef.current = clock.elapsedTime;
    }
    const elapsed = clock.elapsedTime - birthRef.current;
    const t = Math.max(0, 1 - elapsed);
    setOpacity(t * 0.7);
  });

  if (opacity <= 0.01) return null;

  return (
    <Line
      points={[from, to]}
      color={color}
      lineWidth={2}
      transparent
      opacity={opacity}
    />
  );
}

// -----------------------------------------------------------------------------
// Particle Aura Sub-component (~20 particles orbiting the sensor head)
// -----------------------------------------------------------------------------

interface ParticleAuraProps {
  color: THREE.Color;
}

function ParticleAura({ color }: ParticleAuraProps) {
  const pointsRef = React.useRef<THREE.Points>(null);

  const { positions, seeds } = React.useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const s: { theta: number; phi: number; radius: number; speed: number }[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = HEAD_RADIUS * (1.4 + Math.random() * 0.8);
      s.push({ theta, phi, radius, speed: 0.6 + Math.random() * 1.0 });
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return { positions: pos, seeds: s };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const arr = pointsRef.current.geometry.attributes.position
      .array as Float32Array;
    const t = clock.elapsedTime;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const seed = seeds[i];
      const theta = seed.theta + t * seed.speed;
      const phi = seed.phi + t * seed.speed * 0.3;
      arr[i * 3] = seed.radius * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = seed.radius * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = seed.radius * Math.cos(phi);
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} position={[0, BASE_HEIGHT, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.02}
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

// Shared geometries (created once, reused)
const _baseGeo = new THREE.OctahedronGeometry(1, 0);
const _baseEdgesGeo = new THREE.EdgesGeometry(_baseGeo, 15);
const _headGeo = new THREE.IcosahedronGeometry(HEAD_RADIUS, 0);
const _headEdgesGeo = new THREE.EdgesGeometry(_headGeo, 15);

export function DetectorTower({
  detector,
  onClick,
  beamTarget,
}: DetectorTowerProps) {
  const headRef = React.useRef<THREE.Mesh>(null);
  const headEdgesRef = React.useRef<THREE.LineSegments>(null);
  const [hovered, setHovered] = React.useState(false);

  const colorHex = DETECTOR_TYPE_COLORS[detector.type];
  const color = React.useMemo(() => new THREE.Color(colorHex), [colorHex]);

  // Animate sensor head glow + edge wireframe
  useFrame(({ clock }) => {
    if (!headRef.current) return;
    const mat = headRef.current.material as THREE.MeshPhysicalMaterial;

    if (detector.active) {
      const pulse = Math.sin(clock.elapsedTime * 3) * 0.2 + 0.8;
      mat.emissiveIntensity = 0.6 + pulse * 0.4;
    } else {
      mat.emissiveIntensity = 0.15;
    }

    // Pulse head edge wireframe opacity
    if (headEdgesRef.current) {
      const edgeMat = headEdgesRef.current.material as THREE.LineBasicMaterial;
      if (detector.active) {
        const ep = Math.sin(clock.elapsedTime * 4) * 0.15 + 0.65;
        edgeMat.opacity = ep;
      } else {
        edgeMat.opacity = 0.3;
      }
    }
  });

  const handleClick = React.useCallback(() => {
    onClick?.(detector.id);
  }, [detector.id, onClick]);

  return (
    <group
      position={detector.position}
      onClick={handleClick}
      onPointerOver={() => {
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {/* Tower base - faceted crystalline column (stretched octahedron) */}
      <group position={[0, BASE_HEIGHT / 2, 0]} scale={[0.1, BASE_HEIGHT / 2, 0.1]}>
        <mesh geometry={_baseGeo}>
          <meshPhysicalMaterial
            color="#1a1f2e"
            transparent
            opacity={0.85}
            transmission={0.3}
            roughness={0.2}
            metalness={0.3}
            ior={1.5}
            side={THREE.DoubleSide}
          />
        </mesh>
        <lineSegments geometry={_baseEdgesGeo}>
          <lineBasicMaterial
            color={color}
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </lineSegments>
      </group>

      {/* Sensor head - crystalline icosahedron */}
      <mesh ref={headRef} position={[0, BASE_HEIGHT, 0]} geometry={_headGeo}>
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={detector.active ? 0.8 : 0.15}
          transparent
          opacity={0.9}
          transmission={0.2}
          roughness={0.15}
          metalness={0.2}
          ior={1.5}
        />
      </mesh>

      {/* Head edge wireframe */}
      <lineSegments
        ref={headEdgesRef}
        position={[0, BASE_HEIGHT, 0]}
        geometry={_headEdgesGeo}
      >
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>

      {/* Sensor head outer glow */}
      {detector.active && (
        <mesh position={[0, BASE_HEIGHT, 0]}>
          <sphereGeometry args={[HEAD_RADIUS * 1.8, 12, 12]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.1}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Particle aura when active */}
      {detector.active && <ParticleAura color={color} />}

      {/* Rotating sweep cone (lighthouse beam) when active */}
      {detector.active && <SweepCone color={color} speed={1.5} />}

      {/* Point light when active (higher intensity for crystalline look) */}
      {detector.active && (
        <pointLight
          color={color}
          intensity={0.6}
          distance={2.5}
          position={[0, BASE_HEIGHT, 0]}
        />
      )}

      {/* Signal beam to action */}
      {beamTarget && (
        <BeamLine
          from={[0, BASE_HEIGHT, 0]}
          to={[
            beamTarget[0] - detector.position[0],
            beamTarget[1] - detector.position[1],
            beamTarget[2] - detector.position[2],
          ]}
          color={color}
        />
      )}

      {/* Signal count badge */}
      {detector.signalCount > 0 && (
        <Html
          position={[0.2, BASE_HEIGHT + 0.15, 0]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              background: colorHex,
              color: "#000",
              fontSize: "9px",
              fontFamily: "monospace",
              fontWeight: 700,
              padding: "1px 5px",
              borderRadius: "6px",
              minWidth: "16px",
              textAlign: "center",
              lineHeight: "14px",
            }}
          >
            {detector.signalCount}
          </div>
        </Html>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <Html
          position={[0, BASE_HEIGHT + 0.45, 0]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div
            className="text-xs font-mono px-3 py-2 rounded-md border"
            style={{
              background: "rgba(2, 4, 10, 0.85)",
              backdropFilter: "blur(24px)",
              borderColor: "rgba(255,255,255,0.06)",
              boxShadow: `0 0 16px ${colorHex}40`,
              minWidth: "110px",
              whiteSpace: "nowrap",
            }}
          >
            <div
              className="font-bold tracking-wider mb-1"
              style={{
                fontSize: "10px",
                color: colorHex,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontFamily: "monospace",
              }}
            >
              {detector.label}
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
              <span style={{ color: "rgba(255,255,255,0.4)" }}>Type</span>
              <span style={{ color: "rgba(255,255,255,0.8)" }}>
                {DETECTOR_TYPE_LABELS[detector.type]}
              </span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>Signals</span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                {detector.signalCount}
              </span>
              <span style={{ color: "rgba(255,255,255,0.4)" }}>Status</span>
              <span
                style={{
                  color: detector.active ? "#10B981" : "rgba(255,255,255,0.4)",
                  fontWeight: 600,
                }}
              >
                {detector.active ? "ACTIVE" : "IDLE"}
              </span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

DetectorTower.displayName = "DetectorTower";

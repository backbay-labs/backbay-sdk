"use client";

import * as React from "react";
import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { ActionKind, ActionNodeProps, PolicyStatus, RiverAction } from "./types";
import { ACTION_KIND_COLORS, POLICY_STATUS_COLORS } from "./types";
import type { VisualState } from "@backbay/glia-agent/emotion";
import type { GeometryType } from "../CrystallineOrganism/constants";
import { CRYSTALLINE_CONFIG, ANIMATION_CONFIG } from "../CrystallineOrganism/constants";

// -----------------------------------------------------------------------------
// ActionKind -> CrystallineOrganism geometry type mapping
// -----------------------------------------------------------------------------

const ACTION_GEOMETRY_MAP: Record<ActionKind, GeometryType> = {
  fs: "icosahedron",
  network: "dodecahedron",
  exec: "octahedron",
  codepatch: "tetrahedron",
  query: "box",
  message: "torus",
};

function createGeometry(type: GeometryType, size: number): THREE.BufferGeometry {
  switch (type) {
    case "octahedron":
      return new THREE.OctahedronGeometry(size, 0);
    case "icosahedron":
      return new THREE.IcosahedronGeometry(size, 0);
    case "dodecahedron":
      return new THREE.DodecahedronGeometry(size, 0);
    case "tetrahedron":
      return new THREE.TetrahedronGeometry(size, 0);
    case "box":
      return new THREE.BoxGeometry(size * 1.4, size * 1.4, size * 1.4);
    case "torus":
      return new THREE.TorusGeometry(size, size * 0.35, 8, 24);
    default:
      return new THREE.IcosahedronGeometry(size, 0);
  }
}

// -----------------------------------------------------------------------------
// Map RiverAction properties -> VisualState
// -----------------------------------------------------------------------------

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

function mapActionToVisualState(action: RiverAction): VisualState {
  const { riskScore, noveltyScore, blastRadius, policyStatus } = action;

  // Risk -> hue (200 cyan at low risk, 0 red at high risk)
  let coreHue = lerp(200, 0, riskScore);
  // Policy denied overrides hue to red
  if (policyStatus === "denied") {
    coreHue = 0;
  }

  return {
    // Qualitative (from risk ~ arousal/valence)
    coreHue,
    coreSaturation: lerp(0.5, 1.0, noveltyScore),
    emissiveIntensity: policyStatus === "denied"
      ? 1.0
      : lerp(0.3, 1.0, riskScore),
    scaleFactor: 1.0,
    motionNoise: policyStatus === "denied" ? 0.04 : riskScore > 0.7 ? 0.02 : 0,

    // Temporal (from risk ~ arousal)
    breathingRate: lerp(1.0, 2.5, riskScore),
    breathingAmplitude: lerp(0.08, 0.18, noveltyScore),
    ringRotationSpeed: lerp(0.5, 2.0, riskScore),
    particleVelocity: lerp(0.3, 1.0, riskScore),
    particleCount: Math.floor(lerp(8, 30, blastRadius)),
    glowPulseRate: lerp(0.8, 3.0, riskScore),

    // Spatial (from novelty ~ openness)
    particleFlowDirection: 1,
    particleSpreadAngle: lerp(0.3, 1.0, noveltyScore),
    breathingPhaseBias: action.timestamp * 0.001,
    ringTilt: lerp(0, 1, noveltyScore),
    auraExpansion: lerp(0.9, 1.2, noveltyScore),

    // Combined
    overallIntensity: lerp(0.5, 1.0, (riskScore + noveltyScore + blastRadius) / 3),
  };
}

// -----------------------------------------------------------------------------
// PolicyGlow Ring (preserved)
// -----------------------------------------------------------------------------

interface PolicyGlowProps {
  status: PolicyStatus;
  radius: number;
}

function PolicyGlow({ status, radius }: PolicyGlowProps) {
  const ringRef = React.useRef<THREE.Mesh>(null);
  const color = POLICY_STATUS_COLORS[status];

  const shouldFlash = status === "denied";
  const shouldPulse = status === "approval-required";

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.elapsedTime;

    if (shouldFlash) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 + Math.sin(t * 6) * 0.4;
    } else if (shouldPulse) {
      const scale = 1 + Math.sin(t * 2.5) * 0.1;
      ringRef.current.scale.setScalar(scale);
    }
  });

  if (status === "uncovered") return null;

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.03, 8, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// -----------------------------------------------------------------------------
// Tooltip (preserved)
// -----------------------------------------------------------------------------

function ActionTooltip({ action }: { action: RiverAction }) {
  const color = ACTION_KIND_COLORS[action.kind];
  const policyColor = POLICY_STATUS_COLORS[action.policyStatus];

  return (
    <div
      style={{
        background: "rgba(2, 4, 10, 0.85)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "6px",
        padding: "8px 12px",
        fontFamily: "monospace",
        fontSize: "10px",
        color: "rgba(226,232,240,1)",
        minWidth: "140px",
        boxShadow: `0 0 16px ${color}22, inset 0 1px 0 rgba(255,255,255,0.02)`,
        pointerEvents: "none" as const,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "11px", marginBottom: "4px", color }}>
        {action.label}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
        <span
          style={{
            fontSize: "7px",
            fontWeight: 700,
            padding: "1px 5px",
            borderRadius: "3px",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#E2E8F0",
            background: `${color}30`,
          }}
        >
          {action.kind}
        </span>
        <span
          style={{
            fontSize: "7px",
            fontWeight: 700,
            padding: "1px 5px",
            borderRadius: "3px",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: action.policyStatus === "uncovered" ? "#64748B" : policyColor,
            background:
              action.policyStatus === "uncovered"
                ? "rgba(100,116,139,0.15)"
                : `${policyColor}25`,
          }}
        >
          {action.policyStatus}
        </span>
      </div>

      <div style={{ display: "flex", gap: "10px", fontSize: "9px", color: "rgba(100,116,139,1)" }}>
        <span>risk {(action.riskScore * 100).toFixed(0)}%</span>
        <span>novel {(action.noveltyScore * 100).toFixed(0)}%</span>
        <span>blast {(action.blastRadius * 100).toFixed(0)}%</span>
      </div>

      {action.consequence && (
        <div
          style={{
            marginTop: "4px",
            paddingTop: "4px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            fontSize: "9px",
            color: "rgba(100,116,139,1)",
          }}
        >
          {action.consequence}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Inline OrganismParticles for ActionNode
// -----------------------------------------------------------------------------

const PARTICLE_MIN_RADIUS = 1.1;
const PARTICLE_MAX_RADIUS = 1.6;
const PARTICLE_OUTER_BOUND = 2.2;
const PARTICLE_INNER_BOUND = 0.7;
const MAX_PARTICLES = 30;

interface ActionParticle {
  theta: number;
  phi: number;
  radius: number;
  speed: number;
}

function ActionParticles({
  visualState,
  shellRadius,
}: {
  visualState: VisualState;
  shellRadius: number;
}) {
  const pointsRef = React.useRef<THREE.Points>(null);
  const particlesRef = React.useRef<ActionParticle[]>([]);

  const activeCount = visualState.particleCount;

  const positions = React.useMemo(() => {
    const pos = new Float32Array(MAX_PARTICLES * 3);
    const particles: ActionParticle[] = [];

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius =
        shellRadius *
        (PARTICLE_MIN_RADIUS + Math.random() * (PARTICLE_MAX_RADIUS - PARTICLE_MIN_RADIUS));
      const speed = 0.3 + Math.random() * 0.7;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      particles.push({ theta, phi, radius, speed });
    }

    particlesRef.current = particles;
    return pos;
  }, [shellRadius]);

  const particleColor = React.useMemo(() => {
    const hue = visualState.coreHue / 360;
    const sat = visualState.coreSaturation * 0.8;
    return new THREE.Color().setHSL(hue, sat, 0.6);
  }, [visualState.coreHue, visualState.coreSaturation]);

  useFrame(() => {
    if (!pointsRef.current) return;

    const posAttr = pointsRef.current.geometry.attributes.position;
    const positionsArray = posAttr.array as Float32Array;

    const flowDir = visualState.particleFlowDirection;
    const velocity = visualState.particleVelocity;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const particle = particlesRef.current[i];
      const idx = i * 3;

      if (i >= activeCount) {
        positionsArray[idx] = 0;
        positionsArray[idx + 1] = 0;
        positionsArray[idx + 2] = 1000;
        continue;
      }

      const x = positionsArray[idx];
      const y = positionsArray[idx + 1];
      const z = positionsArray[idx + 2];

      const r = Math.sqrt(x * x + y * y + z * z);
      if (r < 0.001) continue;

      const nx = x / r;
      const ny = y / r;
      const nz = z / r;

      const movement = flowDir * velocity * particle.speed * 0.06;
      const newR = r + movement;

      positionsArray[idx] = nx * newR;
      positionsArray[idx + 1] = ny * newR;
      positionsArray[idx + 2] = nz * newR;

      const minR = shellRadius * PARTICLE_INNER_BOUND;
      const maxR = shellRadius * PARTICLE_OUTER_BOUND;

      if (newR > maxR || newR < minR) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const spawnR =
          shellRadius *
          (PARTICLE_MIN_RADIUS + Math.random() * (PARTICLE_MAX_RADIUS - PARTICLE_MIN_RADIUS));

        positionsArray[idx] = spawnR * Math.sin(phi) * Math.cos(theta);
        positionsArray[idx + 1] = spawnR * Math.sin(phi) * Math.sin(theta);
        positionsArray[idx + 2] = spawnR * Math.cos(phi);
      }
    }

    posAttr.needsUpdate = true;
  });

  if (activeCount === 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={particleColor}
        size={0.03}
        transparent
        opacity={0.7 * visualState.overallIntensity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}

// -----------------------------------------------------------------------------
// ActionNode (CrystallineOrganism visuals)
// -----------------------------------------------------------------------------

export const ActionNode = React.memo(function ActionNode({
  action,
  position,
  selected,
  dimmed,
  onClick,
  onHover,
}: ActionNodeProps) {
  const groupRef = React.useRef<THREE.Group>(null);
  const shellRef = React.useRef<THREE.Mesh>(null);
  const edgesRef = React.useRef<THREE.LineSegments>(null);
  const coreRef = React.useRef<THREE.Mesh>(null);
  const targetScaleRef = React.useRef(new THREE.Vector3(1, 1, 1));
  const [hovered, setHovered] = React.useState(false);

  // Derive visual state from action properties
  const visualState = React.useMemo(() => mapActionToVisualState(action), [action]);

  // Size from blastRadius (matching original formula)
  const baseSize = 0.3 + action.blastRadius * 0.4;

  // Geometry type from ActionKind
  const geometryType = ACTION_GEOMETRY_MAP[action.kind];

  // Shell geometry
  const shellGeometry = React.useMemo(
    () => createGeometry(geometryType, baseSize),
    [geometryType, baseSize],
  );

  // Edges geometry for Tron-like glow
  const edgesGeometry = React.useMemo(
    () => new THREE.EdgesGeometry(shellGeometry, 15),
    [shellGeometry],
  );

  // Derive colors from visual state
  const { coreColor, edgeColor } = React.useMemo(() => {
    const hue = visualState.coreHue / 360;
    const sat = visualState.coreSaturation;
    return {
      coreColor: new THREE.Color().setHSL(hue, sat, 0.55),
      edgeColor: new THREE.Color().setHSL(hue, sat * 0.9, 0.6),
    };
  }, [visualState.coreHue, visualState.coreSaturation]);

  // Shell material properties
  const shellOpacity = dimmed ? 0.12 : 0.3 + visualState.emissiveIntensity * 0.3;

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    const edges = edgesRef.current;
    const core = coreRef.current;
    if (!group) return;

    const t = clock.elapsedTime;
    const scaleAlpha = 1 - Math.exp(-delta * 12);

    // Base scale from emotion
    let targetScale = visualState.scaleFactor;

    // Interaction scale modifiers
    if (selected) {
      targetScale *= ANIMATION_CONFIG.select.scaleFactor;
    } else if (hovered) {
      targetScale *= ANIMATION_CONFIG.hover.scaleFactor;
    }

    // Dimmed nodes shrink slightly
    if (dimmed) {
      targetScale *= 0.85;
    }

    // Breathing animation
    const breathPhase = t * visualState.breathingRate + visualState.breathingPhaseBias;
    targetScale += visualState.breathingAmplitude * Math.sin(breathPhase);

    // Motion noise for high risk / denied
    if (visualState.motionNoise > 0) {
      targetScale += visualState.motionNoise * Math.sin(t * 8) * Math.cos(t * 11);
    }

    targetScaleRef.current.setScalar(targetScale);
    group.scale.lerp(targetScaleRef.current, scaleAlpha);

    // Rotation from ringRotationSpeed
    group.rotation.y += delta * visualState.ringRotationSpeed * 0.15;
    group.rotation.x += delta * visualState.ringRotationSpeed * 0.08;

    // Gentle bobbing in the river current (preserved from original)
    const bob = Math.sin(t * 1.2 + action.timestamp * 0.001) * 0.08;
    group.position.y = bob;

    // Edge glow pulsing
    const pulse = 0.6 + 0.4 * Math.sin(t * visualState.glowPulseRate * Math.PI * 2);
    if (edges?.material && "opacity" in edges.material) {
      const mat = edges.material as THREE.LineBasicMaterial;
      mat.opacity = dimmed
        ? 0.15
        : 0.5 + pulse * 0.5 * visualState.emissiveIntensity;
    }

    // Core pulsing (faster than shell)
    if (core) {
      const coreScale = 0.9 + 0.2 * Math.sin(t * visualState.glowPulseRate * Math.PI * 3);
      core.scale.setScalar(coreScale);
    }

  });

  // -- Interaction handlers (preserved) --

  const handlePointerOver = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHovered(true);
      document.body.style.cursor = "pointer";
      onHover?.(action);
    },
    [action, onHover],
  );

  const handlePointerOut = React.useCallback(() => {
    setHovered(false);
    document.body.style.cursor = "auto";
    onHover?.(null);
  }, [onHover]);

  const handleClick = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onClick?.(action);
    },
    [action, onClick],
  );

  return (
    <group position={position}>
      {/* Interaction mesh - invisible but clickable */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[baseSize * 1.6, 16, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Crystalline shell group (animated) */}
      <group ref={groupRef}>
        {/* Inner energy core */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[baseSize * 0.2, 8, 8]} />
          <meshStandardMaterial
            color={coreColor}
            emissive={coreColor}
            emissiveIntensity={1.2 + visualState.emissiveIntensity}
            toneMapped={false}
            transparent
            opacity={dimmed ? 0.3 : 0.9}
          />
        </mesh>

        {/* Main crystalline shell */}
        <mesh ref={shellRef} geometry={shellGeometry}>
          <meshStandardMaterial
            color={edgeColor}
            transparent
            opacity={shellOpacity}
            roughness={0.2}
            metalness={0.3}
            emissive={edgeColor}
            emissiveIntensity={visualState.emissiveIntensity * 0.3}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Glowing edge wireframe (Tron-like) */}
        <lineSegments ref={edgesRef} geometry={edgesGeometry}>
          <lineBasicMaterial
            color={edgeColor}
            transparent
            opacity={0.8}
            linewidth={2}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>

        {/* Outer aura */}
        <mesh scale={visualState.auraExpansion}>
          <sphereGeometry args={[baseSize * 1.1, 12, 12]} />
          <meshStandardMaterial
            color={edgeColor}
            transparent
            opacity={
              (dimmed ? 0.02 : 0.06) * visualState.overallIntensity +
              (selected ? 0.06 : 0) +
              (hovered ? 0.03 : 0)
            }
            emissive={edgeColor}
            emissiveIntensity={0.2}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>

        {/* Selection orbital rings (CrystallineOrganism style) */}
        {(selected || hovered) && (
          <group rotation={[Math.PI / 2, 0, 0]}>
            <mesh>
              <torusGeometry args={[baseSize * 1.4, baseSize * 0.018, 8, 48]} />
              <meshStandardMaterial
                color={CRYSTALLINE_CONFIG.selectionRing}
                emissive={CRYSTALLINE_CONFIG.selectionRing}
                emissiveIntensity={selected ? 1.5 : 0.8}
                toneMapped={false}
                transparent
                opacity={selected ? 0.9 : 0.5}
              />
            </mesh>
            {/* Secondary tilted ring */}
            <mesh rotation={[visualState.ringTilt * 0.02, 0, 0.4]}>
              <torusGeometry args={[baseSize * 1.25, baseSize * 0.012, 8, 48]} />
              <meshStandardMaterial
                color={CRYSTALLINE_CONFIG.selectionRing}
                emissive={CRYSTALLINE_CONFIG.selectionRing}
                emissiveIntensity={selected ? 1.0 : 0.5}
                toneMapped={false}
                transparent
                opacity={selected ? 0.6 : 0.3}
              />
            </mesh>
          </group>
        )}
      </group>

      {/* Particle aura (outside animated group so particles stay world-relative) */}
      {!dimmed && (
        <ActionParticles visualState={visualState} shellRadius={baseSize} />
      )}

      {/* Policy status ring */}
      <PolicyGlow status={action.policyStatus} radius={baseSize * 1.3} />

      {/* Hover tooltip */}
      {hovered && (
        <Html distanceFactor={10} position={[0, baseSize * 1.8, 0]}>
          <ActionTooltip action={action} />
        </Html>
      )}
    </group>
  );
});
ActionNode.displayName = "ActionNode";

/**
 * OrganismShell - Emotion-Driven Crystalline Shell
 *
 * Renders faceted crystalline shells driven by the AVO emotion system.
 * Visual properties (color, glow, rotation, breathing) all derive from VisualState.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { OrganismShellProps } from "./types";
import {
  ORGANISM_GEOMETRY,
  ANIMATION_CONFIG,
  CRYSTALLINE_CONFIG,
} from "./constants";

// Geometry factory - creates the appropriate platonic solid
function createGeometry(type: string, size: number): THREE.BufferGeometry {
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

export function OrganismShell({
  type,
  visualState,
  size,
  selected = false,
  hovered = false,
}: OrganismShellProps) {
  const groupRef = useRef<THREE.Group>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const targetScaleRef = useRef(new THREE.Vector3(1, 1, 1));

  const geometryType = ORGANISM_GEOMETRY[type];

  // Main shell geometry
  const shellGeometry = useMemo(
    () => createGeometry(geometryType, size),
    [geometryType, size]
  );

  // Edges geometry for Tron-like glow
  const edgesGeometry = useMemo(
    () => new THREE.EdgesGeometry(shellGeometry, 15),
    [shellGeometry]
  );

  // Derive colors from emotion state
  const { coreColor, edgeColor, isError } = useMemo(() => {
    const hue = visualState.coreHue / 360;
    const sat = visualState.coreSaturation;

    // Core color from emotion hue
    const core = new THREE.Color().setHSL(hue, sat, 0.55);

    // Edge color slightly lighter/more emissive
    const edge = new THREE.Color().setHSL(hue, sat * 0.9, 0.6);

    // Detect error state (low valence + high arousal typically = error zone)
    // coreHue around 220 (blue) = negative valence area
    const error = visualState.coreHue > 180 && visualState.emissiveIntensity > 0.6;

    return { coreColor: core, edgeColor: edge, isError: error };
  }, [visualState.coreHue, visualState.coreSaturation, visualState.emissiveIntensity]);

  // Light intensity from emotion
  const lightIntensity = useMemo(() => {
    return CRYSTALLINE_CONFIG.baseLightIntensity * visualState.overallIntensity;
  }, [visualState.overallIntensity]);

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    const edges = edgesRef.current;
    const core = coreRef.current;
    const light = lightRef.current;
    if (!group) return;

    const t = clock.elapsedTime;
    const scaleAlpha = 1 - Math.exp(-delta * 12);

    // Base scale from emotion scaleFactor
    let targetScale = visualState.scaleFactor;

    // Interaction scale modifiers
    if (selected) {
      targetScale *= ANIMATION_CONFIG.select.scaleFactor;
    } else if (hovered) {
      targetScale *= ANIMATION_CONFIG.hover.scaleFactor;
    }

    // Breathing animation from emotion breathingRate/Amplitude
    const breathPhase = t * visualState.breathingRate + visualState.breathingPhaseBias;
    targetScale += visualState.breathingAmplitude * Math.sin(breathPhase);

    // Motion noise for low valence (uncertainty)
    if (visualState.motionNoise > 0) {
      targetScale += visualState.motionNoise * Math.sin(t * 8) * Math.cos(t * 11);
    }

    targetScaleRef.current.setScalar(targetScale);
    group.scale.lerp(targetScaleRef.current, scaleAlpha);

    // Rotation from ringRotationSpeed
    group.rotation.y += delta * visualState.ringRotationSpeed * 0.15;
    group.rotation.x += delta * visualState.ringRotationSpeed * 0.08;

    // Edge glow pulsing from glowPulseRate
    const pulse = 0.6 + 0.4 * Math.sin(t * visualState.glowPulseRate * Math.PI * 2);
    if (edges?.material && "opacity" in edges.material) {
      const mat = edges.material as THREE.LineBasicMaterial;
      mat.opacity = 0.5 + pulse * 0.5 * visualState.emissiveIntensity;
    }

    // Core pulsing (faster than shell)
    if (core) {
      const coreScale = 0.9 + 0.2 * Math.sin(t * visualState.glowPulseRate * Math.PI * 3);
      core.scale.setScalar(coreScale);
    }

    // Light intensity pulsing
    if (light) {
      light.intensity = lightIntensity * (0.7 + 0.3 * pulse);
    }
  });

  // Shell material properties from emotion
  const shellOpacity = 0.3 + visualState.emissiveIntensity * 0.3;
  const shellTransmission = 0.4 + (1 - visualState.emissiveIntensity) * 0.3;

  return (
    <group ref={groupRef}>
      {/* Inner energy core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[size * 0.2, 16, 16]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={1.2 + visualState.emissiveIntensity}
          toneMapped={false}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Point light at core */}
      <pointLight
        ref={lightRef}
        position={[0, 0, 0]}
        intensity={lightIntensity}
        distance={size * CRYSTALLINE_CONFIG.coreGlowRadius}
        decay={2}
        color={coreColor}
      />

      {/* Main crystalline shell - translucent */}
      <mesh ref={shellRef} geometry={shellGeometry}>
        <meshPhysicalMaterial
          color={edgeColor}
          transparent
          opacity={shellOpacity}
          transmission={shellTransmission}
          roughness={0.15}
          metalness={0.2}
          ior={1.5}
          thickness={size * 0.3}
          side={THREE.DoubleSide}
          envMapIntensity={0.4}
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

      {/* Outer aura - size from auraExpansion */}
      <mesh scale={visualState.auraExpansion}>
        <sphereGeometry args={[size * 1.1, 24, 24]} />
        <meshStandardMaterial
          color={edgeColor}
          transparent
          opacity={0.06 * visualState.overallIntensity + (selected ? 0.06 : 0) + (hovered ? 0.03 : 0)}
          emissive={edgeColor}
          emissiveIntensity={0.2}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Selection rings - orbital style like GlyphObject */}
      {selected && (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <torusGeometry args={[size * 1.4, size * 0.018, 8, 48]} />
            <meshStandardMaterial
              color={CRYSTALLINE_CONFIG.selectionRing}
              emissive={CRYSTALLINE_CONFIG.selectionRing}
              emissiveIntensity={1.5}
              toneMapped={false}
              transparent
              opacity={0.9}
            />
          </mesh>
          {/* Secondary tilted ring */}
          <mesh rotation={[visualState.ringTilt * 0.02, 0, 0.4]}>
            <torusGeometry args={[size * 1.25, size * 0.012, 8, 48]} />
            <meshStandardMaterial
              color={CRYSTALLINE_CONFIG.selectionRing}
              emissive={CRYSTALLINE_CONFIG.selectionRing}
              emissiveIntensity={1.0}
              toneMapped={false}
              transparent
              opacity={0.6}
            />
          </mesh>
        </group>
      )}

      {/* Hover glow */}
      {hovered && !selected && (
        <mesh>
          <sphereGeometry args={[size * 1.25, 24, 24]} />
          <meshBasicMaterial
            color={edgeColor}
            transparent
            opacity={0.12}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Error state overlay - extra glow when in error zone */}
      {isError && (
        <mesh>
          <sphereGeometry args={[size * 1.3, 16, 16]} />
          <meshBasicMaterial
            color={CRYSTALLINE_CONFIG.errorGlow}
            transparent
            opacity={0.08 + visualState.motionNoise * 0.15}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

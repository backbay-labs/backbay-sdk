"use client";

import { PointMaterial, Points, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Color, Group, Mesh, MeshStandardMaterial } from "three";
import type { GlyphObjectProps } from "./types";
import { useGlyphController } from "./useGlyphController";
import { useGlyphEmotion } from "./useGlyphEmotion";

/** Maximum particle count for buffer allocation */
const MAX_PARTICLES = 100;
/** Minimum radius particles spawn at */
const PARTICLE_MIN_RADIUS = 1.2;
/** Maximum radius particles spawn at */
const PARTICLE_MAX_RADIUS = 1.7;
/** Radius at which particles reset (too far) */
const PARTICLE_OUTER_BOUND = 2.5;
/** Radius at which particles reset (too close) */
const PARTICLE_INNER_BOUND = 0.8;

/** Linear interpolation helper */
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const GLYPH_COLORS = {
  core: "#f2c96b",
  coreEmissive: "#d4a84b",
  ring: "#6b8cbe",
  ringEmissive: "#9bb4e3",
  face: "#8a8f98",
  faceEmissive: "#dc143c",
};

// ── Procedural geometry (used when no GLB model is available) ───────────────

function ProceduralGlyphGeometry() {
  const coreRef = useRef<Mesh>(null);
  const ring1Ref = useRef<Mesh>(null);
  const ring2Ref = useRef<Mesh>(null);
  const ring3Ref = useRef<Mesh>(null);
  const browRef = useRef<Mesh>(null);
  const eyeLRef = useRef<Mesh>(null);
  const eyeRRef = useRef<Mesh>(null);

  return (
    <group>
      {/* Core body */}
      <mesh ref={coreRef} name="glyph_core">
        <icosahedronGeometry args={[0.6, 2]} />
        <meshStandardMaterial
          color={GLYPH_COLORS.core}
          emissive={GLYPH_COLORS.coreEmissive}
          emissiveIntensity={0.5}
          roughness={0.45}
          metalness={0.2}
        />
      </mesh>

      {/* Ring 1 — equatorial */}
      <mesh ref={ring1Ref} name="glyph_ring_1" rotation={[0, 0, 0]}>
        <torusGeometry args={[0.85, 0.035, 16, 64]} />
        <meshStandardMaterial
          color={GLYPH_COLORS.ring}
          emissive={GLYPH_COLORS.ringEmissive}
          emissiveIntensity={1.0}
          roughness={0.25}
          metalness={0.2}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ring 2 — tilted */}
      <mesh ref={ring2Ref} name="glyph_ring_2" rotation={[Math.PI / 3, 0, Math.PI / 6]}>
        <torusGeometry args={[0.92, 0.025, 16, 64]} />
        <meshStandardMaterial
          color={GLYPH_COLORS.ring}
          emissive={GLYPH_COLORS.ringEmissive}
          emissiveIntensity={0.8}
          roughness={0.25}
          metalness={0.2}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ring 3 — opposite tilt */}
      <mesh ref={ring3Ref} name="glyph_ring_3" rotation={[-Math.PI / 4, 0, -Math.PI / 5]}>
        <torusGeometry args={[0.88, 0.02, 16, 64]} />
        <meshStandardMaterial
          color={GLYPH_COLORS.ring}
          emissive={GLYPH_COLORS.ringEmissive}
          emissiveIntensity={0.6}
          roughness={0.25}
          metalness={0.2}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Brow */}
      <mesh ref={browRef} name="glyph_brow" position={[0, 0.32, 0.48]}>
        <boxGeometry args={[0.28, 0.04, 0.04]} />
        <meshStandardMaterial
          color={GLYPH_COLORS.face}
          emissive={GLYPH_COLORS.faceEmissive}
          emissiveIntensity={0.35}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {/* Eye Left */}
      <mesh ref={eyeLRef} name="glyph_eye_l" position={[-0.13, 0.2, 0.52]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial
          color={GLYPH_COLORS.face}
          emissive={GLYPH_COLORS.faceEmissive}
          emissiveIntensity={0.4}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>

      {/* Eye Right */}
      <mesh ref={eyeRRef} name="glyph_eye_r" position={[0.13, 0.2, 0.52]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial
          color={GLYPH_COLORS.face}
          emissive={GLYPH_COLORS.faceEmissive}
          emissiveIntensity={0.4}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>
    </group>
  );
}

// ── GLB Model loader (used when modelUrl is provided) ──────────────────────

function GLBModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

// ── Main component ─────────────────────────────────────────────────────────

export function GlyphObject({
  state = "idle",
  anchor,
  dimensions,
  visualState: directVisualState,
  scale = 1,
  position = [0, 0, 0],
  variant = "sentinel",
  modelUrl,
  enableBlending = false,
  oneShot,
  oneShotNonce,
  enableParticles,
  onClick,
}: GlyphObjectProps) {
  const showParticles = enableParticles ?? variant === "sentinel";
  const rootRef = useRef<Group>(null);
  const sceneRef = useRef<Group>(null);
  const timeOffset = useRef(Math.random() * Math.PI * 2);
  const ringPhase = useRef(Math.random() * Math.PI * 2);
  const ringTiltRadiansRef = useRef(0);
  const coreMaterialsRef = useRef<MeshStandardMaterial[]>([]);
  const ringMeshesRef = useRef<Mesh[]>([]);
  const tmpBaseQuat = useMemo(() => new THREE.Quaternion(), []);
  const tmpOffsetQuat = useMemo(() => new THREE.Quaternion(), []);
  const tmpEuler = useMemo(() => new THREE.Euler(), []);

  const particlesRef = useRef<THREE.Points>(null);

  // Face mesh refs for expression animation
  const browRef = useRef<Mesh | null>(null);
  const eyeLeftRef = useRef<Mesh | null>(null);
  const eyeRightRef = useRef<Mesh | null>(null);

  const usesModel = !!modelUrl;

  // Animation controller — only meaningful when a GLB with animations is loaded.
  // For procedural geometry there are no baked animations, so we pass an empty map.
  const actionsMap = useMemo(() => ({} as Record<string, THREE.AnimationAction | undefined>), []);

  const { dimensions: emotionDimensions, visualState } = useGlyphEmotion({
    state,
    anchor,
    dimensions,
    visualState: directVisualState,
  });

  useGlyphController(state, actionsMap, {
    arousal: emotionDimensions.arousal,
    dimensions: emotionDimensions,
    enableBlending,
    oneShot,
    oneShotNonce,
  });

  const coreColor = useMemo(() => {
    const hue = visualState.coreHue / 360;
    const saturation = visualState.coreSaturation;
    const lightness = 0.55;
    return new Color().setHSL(hue, saturation, lightness);
  }, [visualState.coreHue, visualState.coreSaturation]);

  const coreEmissiveColor = useMemo(() => {
    const hue = visualState.coreHue / 360;
    const saturation = visualState.coreSaturation * 0.9;
    const lightness = 0.4;
    return new Color().setHSL(hue, saturation, lightness);
  }, [visualState.coreHue, visualState.coreSaturation]);

  const emissiveBoost =
    variant === "sentinel" ? 0.7 : variant === "graph" ? 0.5 : variant === "minimal" ? 0.35 : 0.4;
  const haloOpacity =
    variant === "sentinel" ? 0.22 : variant === "graph" ? 0.18 : variant === "minimal" ? 0.12 : 0.16;

  // Traverse the scene group (procedural or GLB) to find core/ring/face meshes.
  useLayoutEffect(() => {
    const sceneGroup = sceneRef.current;
    if (!sceneGroup) return;

    const coreMaterials: MeshStandardMaterial[] = [];
    const ringMeshes: Mesh[] = [];

    sceneGroup.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;

      const mesh = obj;
      mesh.castShadow = false;
      mesh.receiveShadow = false;

      const meshName = (mesh.name || "").toLowerCase();
      const geometryName = (mesh.geometry?.name || "").toLowerCase();

      // Collect orbital ring meshes
      if (meshName.includes("ring") || meshName.includes("torus") || geometryName.includes("torus")) {
        ringMeshes.push(mesh);
      }

      // Collect face meshes for expression animation
      if (meshName.includes("brow")) {
        browRef.current = mesh;
        if (mesh.userData.__glyphDeltaY === undefined) mesh.userData.__glyphDeltaY = 0;
      }
      if (meshName.includes("eye_l")) {
        eyeLeftRef.current = mesh;
        if (mesh.userData.__glyphDeltaX === undefined) mesh.userData.__glyphDeltaX = 0;
        if (mesh.userData.__glyphScaleMul === undefined) mesh.userData.__glyphScaleMul = 1;
      }
      if (meshName.includes("eye_r")) {
        eyeRightRef.current = mesh;
        if (mesh.userData.__glyphDeltaX === undefined) mesh.userData.__glyphDeltaX = 0;
        if (mesh.userData.__glyphScaleMul === undefined) mesh.userData.__glyphScaleMul = 1;
      }

      const mats = Array.isArray(mesh.material)
        ? (mesh.material as MeshStandardMaterial[])
        : [mesh.material as MeshStandardMaterial];

      mats.forEach((m) => {
        if (!m) return;

        const name = (m.name || "").toLowerCase();

        const isCore = name.includes("core") || meshName.includes("core") || name.includes("body");
        const isFace =
          name.includes("eye") ||
          name.includes("brow") ||
          meshName.includes("eye") ||
          meshName.includes("face");
        const isRingLike =
          name.includes("ring") || name.includes("orbit") || meshName.includes("ring") || meshName.includes("orbit");

        m.flatShading = false;
        m.metalness = 0.2;
        m.roughness = 0.55;
        m.emissive.set("#000000");
        m.emissiveIntensity = 0;

        if (isCore) {
          coreMaterials.push(m);
          m.color.set(GLYPH_COLORS.core);
          m.emissive.set(GLYPH_COLORS.coreEmissive);
          m.emissiveIntensity = 0.35 * emissiveBoost + 0.15;
          m.roughness = 0.45;
        } else if (isRingLike) {
          m.color.set(GLYPH_COLORS.ring);
          m.emissive.set(GLYPH_COLORS.ringEmissive);
          m.emissiveIntensity = 0.9 * emissiveBoost + 0.2;
          m.roughness = 0.25;
          m.toneMapped = false;
          m.side = THREE.DoubleSide;
          m.needsUpdate = true;
        } else if (isFace) {
          m.color.set(GLYPH_COLORS.face);
          m.emissive.set(GLYPH_COLORS.faceEmissive);
          m.emissiveIntensity = 0.25 * emissiveBoost + 0.15;
          m.roughness = 0.7;
        }
      });
    });

    coreMaterialsRef.current = coreMaterials;
    ringMeshesRef.current = ringMeshes;
  }, [usesModel, emissiveBoost]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime() + timeOffset.current;
    if (!rootRef.current) return;

    // Apply breathing animation scaled by visualState.breathingRate
    const breathingSpeed = visualState.breathingRate * 0.5;
    const breathingAmplitude = visualState.breathingAmplitude * 1.5;

    rootRef.current.rotation.x = (0.04 + breathingAmplitude) * Math.sin(t * breathingSpeed);
    rootRef.current.rotation.y = 0.03 * Math.cos(t * 0.25);

    // Apply emotion-driven colors and emissive to core materials
    coreMaterialsRef.current.forEach((m) => {
      m.color.copy(coreColor);
      m.emissive.copy(coreEmissiveColor);
      m.emissiveIntensity = visualState.emissiveIntensity * emissiveBoost + 0.15;
    });

    // Apply per-ring rotation and tilt from visualState
    ringPhase.current = (ringPhase.current + delta * visualState.ringRotationSpeed) % (Math.PI * 2);

    const ringCount = ringMeshesRef.current.length;
    const targetTiltRadians = (visualState.ringTilt * Math.PI) / 180;
    const tiltLerpT = 1 - Math.exp(-delta * 10);
    ringTiltRadiansRef.current = lerp(ringTiltRadiansRef.current, targetTiltRadians, tiltLerpT);
    const tiltRadians = ringTiltRadiansRef.current;

    ringMeshesRef.current.forEach((ring, i) => {
      const phaseOffset = ringCount > 0 ? (i / ringCount) * Math.PI * 2 : 0;
      tmpBaseQuat.copy(ring.quaternion);

      tmpEuler.set(tiltRadians, ringPhase.current + phaseOffset, 0);
      tmpOffsetQuat.setFromEuler(tmpEuler);

      ring.quaternion.copy(tmpBaseQuat.multiply(tmpOffsetQuat));
    });

    // Face expressions: drive eye/brow meshes from AVO dimensions
    const { arousal, valence, openness } = emotionDimensions;

    if (browRef.current) {
      const browDeltaY = lerp(-0.05, 0.05, valence);
      const prevDeltaY = (browRef.current.userData.__glyphDeltaY as number | undefined) ?? 0;
      const baseY = browRef.current.position.y - prevDeltaY;
      browRef.current.position.y = baseY + browDeltaY;
      browRef.current.userData.__glyphDeltaY = browDeltaY;
    }

    if (eyeLeftRef.current) {
      const scaleMul = lerp(0.9, 1.1, arousal);
      const prevScaleMul = (eyeLeftRef.current.userData.__glyphScaleMul as number | undefined) ?? 1;
      const baseScaleX = eyeLeftRef.current.scale.x / prevScaleMul;
      const baseScaleY = eyeLeftRef.current.scale.y / prevScaleMul;
      const baseScaleZ = eyeLeftRef.current.scale.z / prevScaleMul;
      eyeLeftRef.current.scale.set(baseScaleX * scaleMul, baseScaleY * scaleMul, baseScaleZ * scaleMul);
      eyeLeftRef.current.userData.__glyphScaleMul = scaleMul;

      const deltaX = lerp(0.02, -0.02, openness);
      const prevDeltaX = (eyeLeftRef.current.userData.__glyphDeltaX as number | undefined) ?? 0;
      const baseX = eyeLeftRef.current.position.x - prevDeltaX;
      eyeLeftRef.current.position.x = baseX + deltaX;
      eyeLeftRef.current.userData.__glyphDeltaX = deltaX;
    }

    if (eyeRightRef.current) {
      const scaleMul = lerp(0.9, 1.1, arousal);
      const prevScaleMul = (eyeRightRef.current.userData.__glyphScaleMul as number | undefined) ?? 1;
      const baseScaleX = eyeRightRef.current.scale.x / prevScaleMul;
      const baseScaleY = eyeRightRef.current.scale.y / prevScaleMul;
      const baseScaleZ = eyeRightRef.current.scale.z / prevScaleMul;
      eyeRightRef.current.scale.set(baseScaleX * scaleMul, baseScaleY * scaleMul, baseScaleZ * scaleMul);
      eyeRightRef.current.userData.__glyphScaleMul = scaleMul;

      const deltaX = lerp(-0.02, 0.02, openness);
      const prevDeltaX = (eyeRightRef.current.userData.__glyphDeltaX as number | undefined) ?? 0;
      const baseX = eyeRightRef.current.position.x - prevDeltaX;
      eyeRightRef.current.position.x = baseX + deltaX;
      eyeRightRef.current.userData.__glyphDeltaX = deltaX;
    }
  });

  const emotionScale = scale * visualState.scaleFactor;

  const glowColor = useMemo(() => {
    const hue = visualState.coreHue / 360;
    return new Color().setHSL(hue, 0.6, 0.5);
  }, [visualState.coreHue]);

  const particlePositions = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = PARTICLE_MIN_RADIUS + Math.random() * (PARTICLE_MAX_RADIUS - PARTICLE_MIN_RADIUS);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  // Animate particles
  useFrame(() => {
    if (!showParticles || !particlesRef.current) return;

    const posAttr = particlesRef.current.geometry.attributes.position;
    const positions = posAttr.array as Float32Array;
    const flowDir = visualState.particleFlowDirection;
    const velocity = visualState.particleVelocity;
    const activeCount = visualState.particleCount;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const idx = i * 3;
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];

      const r = Math.sqrt(x * x + y * y + z * z);
      if (r < 0.001) continue;

      const nx = x / r;
      const ny = y / r;
      const nz = z / r;

      const movement = flowDir * velocity * 0.08;
      const newR = r + movement;

      positions[idx] = nx * newR;
      positions[idx + 1] = ny * newR;
      positions[idx + 2] = nz * newR;

      const shouldReset =
        newR > PARTICLE_OUTER_BOUND || newR < PARTICLE_INNER_BOUND || i >= activeCount;

      if (shouldReset) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const spawnR = PARTICLE_MIN_RADIUS + Math.random() * (PARTICLE_MAX_RADIUS - PARTICLE_MIN_RADIUS);
        positions[idx] = spawnR * Math.sin(phi) * Math.cos(theta);
        positions[idx + 1] = spawnR * Math.sin(phi) * Math.sin(theta);
        positions[idx + 2] = spawnR * Math.cos(phi);

        if (i >= activeCount) {
          positions[idx] = 0;
          positions[idx + 1] = 0;
          positions[idx + 2] = 1000;
        }
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <group
      ref={rootRef}
      position={position}
      scale={emotionScale}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <pointLight
        position={[0, 0, 0.4]}
        intensity={(variant === "sentinel" ? 0.9 : 0.6) * visualState.overallIntensity}
        distance={variant === "sentinel" ? 4 : 3}
        decay={2}
        color={glowColor}
      />

      <group ref={sceneRef}>
        {modelUrl ? (
          <Suspense fallback={<ProceduralGlyphGeometry />}>
            <GLBModel url={modelUrl} />
          </Suspense>
        ) : (
          <ProceduralGlyphGeometry />
        )}
      </group>

      <mesh scale={1.08 * visualState.auraExpansion}>
        <sphereGeometry args={[1, 64, 32]} />
        <meshStandardMaterial
          transparent
          opacity={haloOpacity * visualState.overallIntensity}
          color={coreColor}
          emissive={coreEmissiveColor}
          emissiveIntensity={0.2 * emissiveBoost * visualState.emissiveIntensity}
          roughness={0.85}
          metalness={0}
        />
      </mesh>

      {showParticles && (
        <Points ref={particlesRef} positions={particlePositions} stride={3} frustumCulled={false}>
          <PointMaterial
            transparent
            color={glowColor}
            size={0.035}
            sizeAttenuation={true}
            depthWrite={false}
            opacity={0.65 * visualState.overallIntensity}
            toneMapped={false}
          />
        </Points>
      )}
    </group>
  );
}

/**
 * OrganismParticles - Emotion-Driven Particle System
 *
 * Particle aura around the organism, driven by VisualState from the AVO emotion system.
 * Similar to GlyphObject's particle system but for crystalline organisms.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { OrganismParticlesProps } from "./types";

const MIN_RADIUS = 1.1;
const MAX_RADIUS = 1.6;
const OUTER_BOUND = 2.2;
const INNER_BOUND = 0.7;

interface Particle {
  theta: number;
  phi: number;
  radius: number;
  speed: number;
}

export function OrganismParticles({ visualState, shellRadius }: OrganismParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const particlesRef = useRef<Particle[]>([]);

  const maxParticles = 100;
  const activeCount = visualState.particleCount;

  // Initialize particle positions
  const positions = useMemo(() => {
    const pos = new Float32Array(maxParticles * 3);
    const particles: Particle[] = [];

    for (let i = 0; i < maxParticles; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = shellRadius * (MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS));
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

  // Particle color from emotion hue
  const particleColor = useMemo(() => {
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

    for (let i = 0; i < maxParticles; i++) {
      const particle = particlesRef.current[i];
      const idx = i * 3;

      // Hide particles beyond active count
      if (i >= activeCount) {
        positionsArray[idx] = 0;
        positionsArray[idx + 1] = 0;
        positionsArray[idx + 2] = 1000; // Far away
        continue;
      }

      const x = positionsArray[idx];
      const y = positionsArray[idx + 1];
      const z = positionsArray[idx + 2];

      const r = Math.sqrt(x * x + y * y + z * z);
      if (r < 0.001) continue;

      // Normalize
      const nx = x / r;
      const ny = y / r;
      const nz = z / r;

      // Move radially based on flow direction and velocity
      const movement = flowDir * velocity * particle.speed * 0.06;
      const newR = r + movement;

      // Update position
      positionsArray[idx] = nx * newR;
      positionsArray[idx + 1] = ny * newR;
      positionsArray[idx + 2] = nz * newR;

      // Reset if out of bounds
      const minR = shellRadius * INNER_BOUND;
      const maxR = shellRadius * OUTER_BOUND;

      if (newR > maxR || newR < minR) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const spawnR = shellRadius * (MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS));

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
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
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

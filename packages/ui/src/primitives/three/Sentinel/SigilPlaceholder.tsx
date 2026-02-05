'use client';

import { useFrame } from '@react-three/fiber';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Group } from 'three';

const RING_SEGMENTS = 64;
const TICK_COUNT = 16;
const RUNE_COUNT = 28;

export const SigilPlaceholder: React.FC<{ scale?: number }> = ({ scale = 1 }) => {
  const groupRef = useRef<Group>(null);
  const runeRef = useRef<Group>(null);
  const shimmerRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const ticks = useMemo(() => Array.from({ length: TICK_COUNT }, (_, i) => i), []);
  const runes = useMemo(
    () =>
      Array.from({ length: RUNE_COUNT }, (_, i) => {
        const angle = (i / RUNE_COUNT) * Math.PI * 2;
        const width = 0.028 + 0.014 * Math.abs(Math.sin(i * 1.7));
        const height = 0.007 + 0.01 * Math.abs(Math.cos(i * 1.3));
        const opacity = 0.18 + 0.12 * Math.abs(Math.sin(i * 0.9));
        return { i, angle, width, height, opacity };
      }),
    []
  );
  const noiseTexture = useMemo(() => {
    const size = 64;
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < size * size; i += 1) {
      const intensity = 130 + Math.floor(Math.random() * 125);
      data[i * 4] = intensity;
      data[i * 4 + 1] = Math.min(255, intensity + 40);
      data[i * 4 + 2] = 30;
      data[i * 4 + 3] = 120 + Math.floor(Math.random() * 120);
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.z += delta * 0.25;
    groupRef.current.rotation.x = 0.12;
    if (runeRef.current) {
      runeRef.current.rotation.z -= delta * 0.08;
    }
    if (shimmerRef.current?.map) {
      shimmerRef.current.map.offset.x =
        (shimmerRef.current.map.offset.x + delta * 0.08) % 1;
      shimmerRef.current.map.offset.y =
        (shimmerRef.current.map.offset.y + delta * 0.05) % 1;
      shimmerRef.current.opacity = 0.12 + Math.sin(Date.now() * 0.002) * 0.03;
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.62, 0.66, RING_SEGMENTS]} />
        <meshStandardMaterial
          color="#d4a84b"
          emissive="#d4a84b"
          emissiveIntensity={0.35}
          transparent
          opacity={0.6}
          metalness={0.4}
          roughness={0.3}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.44, 0.455, RING_SEGMENTS]} />
        <meshStandardMaterial
          color="#f2c96b"
          emissive="#f2c96b"
          emissiveIntensity={0.4}
          transparent
          opacity={0.7}
          metalness={0.35}
          roughness={0.35}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.7, RING_SEGMENTS]} />
        <meshBasicMaterial
          ref={shimmerRef}
          map={noiseTexture}
          color="#f2c96b"
          transparent
          opacity={0.14}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[0.22, 0.01, 12, 96]} />
        <meshStandardMaterial
          color="#6b8cbe"
          emissive="#9bb4e3"
          emissiveIntensity={0.35}
          transparent
          opacity={0.6}
          metalness={0.2}
          roughness={0.2}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.12, 0.125, 32]} />
        <meshStandardMaterial
          color="#e6d3a3"
          emissive="#f2c96b"
          emissiveIntensity={0.4}
          transparent
          opacity={0.7}
          metalness={0.4}
          roughness={0.3}
          toneMapped={false}
        />
      </mesh>
      <group ref={runeRef}>
        {runes.map((rune) => {
          const x = Math.cos(rune.angle) * 0.52;
          const y = Math.sin(rune.angle) * 0.52;
          return (
            <mesh
              key={`rune-${rune.i}`}
              position={[x, y, 0]}
              rotation={[0, 0, rune.angle]}
            >
              <boxGeometry args={[rune.width, rune.height, 0.01]} />
              <meshBasicMaterial
                color="#d4a84b"
                transparent
                opacity={rune.opacity}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          );
        })}
      </group>
      {ticks.map((i) => {
        const angle = (i / TICK_COUNT) * Math.PI * 2;
        const x = Math.cos(angle) * 0.74;
        const y = Math.sin(angle) * 0.74;
        return (
          <mesh key={`tick-${i}`} position={[x, y, 0]} rotation={[0, 0, angle]}>
            <boxGeometry args={[0.06, 0.012, 0.01]} />
            <meshStandardMaterial
              color="#d4a84b"
              emissive="#d4a84b"
              emissiveIntensity={0.3}
              transparent
              opacity={0.6}
              metalness={0.3}
              roughness={0.4}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export default SigilPlaceholder;

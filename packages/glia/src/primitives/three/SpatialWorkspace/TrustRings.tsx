"use client";

/**
 * TrustRings - Concentric rings representing trust tiers
 *
 * Three tiers (bronze, silver, gold) displayed as metallic rings
 * with the user's current tier highlighted.
 */

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { TrustTier } from "@backbay/contract";
import { TRUST_RING_CONFIG } from "./types";
import type { TrustRingsProps } from "./types";

// -----------------------------------------------------------------------------
// Single Trust Ring
// -----------------------------------------------------------------------------

interface TrustRingProps {
  tier: TrustTier;
  isCurrent: boolean;
  isHovered: boolean;
  interactive: boolean;
  showLabel: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

function TrustRing({
  tier,
  isCurrent,
  isHovered,
  interactive,
  showLabel,
  onClick,
  onHover,
}: TrustRingProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const glowRef = React.useRef<THREE.Mesh>(null);
  const config = TRUST_RING_CONFIG[tier];

  const tubeRadius = 0.05;

  // Slow rotation and current tier effects
  useFrame((state) => {
    if (!meshRef.current) return;

    // Slow rotation
    meshRef.current.rotation.z = state.clock.elapsedTime * 0.05;

    // Pulse for current tier
    if (isCurrent && glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.8;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  const color = new THREE.Color(config.color);

  return (
    <group>
      {/* Main ring */}
      <mesh
        ref={meshRef}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={interactive ? (e) => {
          e.stopPropagation();
          onClick();
        } : undefined}
        onPointerOver={interactive ? (e) => {
          e.stopPropagation();
          onHover(true);
          document.body.style.cursor = "pointer";
        } : undefined}
        onPointerOut={interactive ? () => {
          onHover(false);
          document.body.style.cursor = "auto";
        } : undefined}
      >
        <torusGeometry args={[config.radius, tubeRadius, 16, 64]} />
        <meshStandardMaterial
          color={color}
          metalness={config.metalness}
          roughness={config.roughness}
          transparent
          opacity={isCurrent ? 1.0 : isHovered ? 0.8 : 0.4}
          emissive={color}
          emissiveIntensity={isCurrent ? 0.3 : isHovered ? 0.2 : 0.05}
        />
      </mesh>

      {/* Glow ring for current tier */}
      {isCurrent && (
        <mesh ref={glowRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[config.radius, tubeRadius * 2, 16, 64]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.15}
          />
        </mesh>
      )}

      {/* Label */}
      {(showLabel || isHovered) && (
        <Html
          position={[config.radius + 0.3, 0, 0]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div className={`text-xs font-mono px-2 py-1 rounded border border-white/[0.06] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] ${
            isCurrent ? "bg-[rgba(2,4,10,0.85)]" : "bg-[rgba(2,4,10,0.7)]"
          }`}>
            <span style={{ color: config.color }} className="font-bold">
              {tier.toUpperCase()}
            </span>
            {isCurrent && (
              <span className="text-white/60 ml-2">← YOU</span>
            )}
          </div>
        </Html>
      )}

      {/* Tier markers around the ring */}
      {isCurrent && (
        <group rotation={[Math.PI / 2, 0, 0]}>
          {[0, 1, 2, 3].map((i) => {
            const angle = (i / 4) * Math.PI * 2;
            const x = Math.cos(angle) * config.radius;
            const y = Math.sin(angle) * config.radius;
            return (
              <mesh key={i} position={[x, y, 0]}>
                <sphereGeometry args={[0.06, 16, 16]} />
                <meshStandardMaterial
                  color={color}
                  metalness={config.metalness}
                  roughness={config.roughness}
                  emissive={color}
                  emissiveIntensity={0.5}
                />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}

// -----------------------------------------------------------------------------
// Trust Rings Container
// -----------------------------------------------------------------------------

export function TrustRings({
  currentTier,
  position = [0, 0, 0],
  showLabels = true,
  interactive = true,
  onTierClick,
}: TrustRingsProps) {
  const [hoveredTier, setHoveredTier] = React.useState<TrustTier | null>(null);
  const tiers: TrustTier[] = ["bronze", "silver", "gold"];

  return (
    <group position={position}>
      {/* Base plane for visual grounding */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <ringGeometry args={[0.5, TRUST_RING_CONFIG.gold.radius + 0.5, 64]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Trust rings */}
      {tiers.map((tier) => (
        <TrustRing
          key={tier}
          tier={tier}
          isCurrent={tier === currentTier}
          isHovered={hoveredTier === tier}
          interactive={interactive}
          showLabel={showLabels}
          onClick={() => onTierClick?.(tier)}
          onHover={(hovered) => setHoveredTier(hovered ? tier : null)}
        />
      ))}

      {/* Center indicator */}
      <mesh>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial
          color={TRUST_RING_CONFIG[currentTier].color}
          metalness={0.8}
          roughness={0.2}
          emissive={new THREE.Color(TRUST_RING_CONFIG[currentTier].color)}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Connection lines from center to current ring */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((angle, i) => {
        const endRadius = TRUST_RING_CONFIG[currentTier].radius;
        const endX = Math.cos(angle) * endRadius;
        const endZ = Math.sin(angle) * endRadius;

        const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(endX, 0, endZ)];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <line key={`line-${i}`}>
            <primitive object={lineGeometry} attach="geometry" />
            <lineBasicMaterial
              color={TRUST_RING_CONFIG[currentTier].color}
              transparent
              opacity={0.2}
            />
          </line>
        );
      })}
    </group>
  );
}

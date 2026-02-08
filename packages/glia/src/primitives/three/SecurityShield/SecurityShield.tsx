"use client";

/**
 * SecurityShield - 3D hexagonal force-field visualization
 *
 * A protective dome made of tessellated hexagons that visualizes
 * security/protection status with dynamic visual effects.
 */

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Instances, Instance } from "@react-three/drei";
import * as THREE from "three";
import type { SecurityShieldProps, HexagonTileData } from "./types";
import { STATUS_COLORS } from "./types";

// -----------------------------------------------------------------------------
// Geometry Utilities
// -----------------------------------------------------------------------------

/**
 * Generate hexagonal tile positions for a dome surface
 */
function generateHexDomeTiles(
  radius: number,
  rings: number = 4
): HexagonTileData[] {
  const tiles: HexagonTileData[] = [];
  const hexSize = radius / (rings * 1.8);

  // Generate concentric rings of hexagons on a hemispherical surface
  let index = 0;

  // Center top hexagon
  tiles.push({
    position: [0, radius * 0.95, 0],
    rotation: [0, 0, 0],
    scale: hexSize * 0.8,
    index: index++,
  });

  // Generate rings from top to base
  for (let ring = 1; ring <= rings; ring++) {
    const phi = (ring / rings) * (Math.PI / 2) * 0.85; // Latitude angle
    const ringRadius = radius * Math.sin(phi);
    const y = radius * Math.cos(phi);
    const hexCount = Math.max(6, Math.floor(ring * 6));

    for (let i = 0; i < hexCount; i++) {
      const theta = (i / hexCount) * Math.PI * 2 + (ring % 2) * (Math.PI / hexCount);
      const x = ringRadius * Math.cos(theta);
      const z = ringRadius * Math.sin(theta);

      // Calculate normal direction for rotation
      const normal = new THREE.Vector3(x, y, z).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
      const euler = new THREE.Euler().setFromQuaternion(quaternion);

      tiles.push({
        position: [x, y, z],
        rotation: [euler.x, euler.y, euler.z],
        scale: hexSize * (1 - ring * 0.05),
        index: index++,
      });
    }
  }

  return tiles;
}

// -----------------------------------------------------------------------------
// Hexagon Shape
// -----------------------------------------------------------------------------

function createHexagonShape(size: number): THREE.Shape {
  const shape = new THREE.Shape();
  const sides = 6;

  for (let i = 0; i <= sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * size;
    const y = Math.sin(angle) * size;

    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  return shape;
}

// -----------------------------------------------------------------------------
// Instanced Hexagon Tile Component
// -----------------------------------------------------------------------------

interface HexTileInstanceProps {
  tile: HexagonTileData;
  color: THREE.Color;
  opacity: number;
  time: number;
  pulseSpeed: number;
  level: number;
  rippleCenter: THREE.Vector3;
  rippleStrength: number;
}

const HexTileInstance = React.memo(function HexTileInstance({
  tile,
  opacity,
  time,
  pulseSpeed,
  level,
  rippleCenter,
  rippleStrength,
}: HexTileInstanceProps) {
  const instanceRef = React.useRef<THREE.InstancedMesh>(null);

  // Calculate per-tile animation offset
  const tileOffset = tile.index * 0.15;
  const tilePulse = pulseSpeed > 0 ? Math.sin(time * pulseSpeed + tileOffset) * 0.15 + 0.85 : 1;

  // Calculate ripple effect based on distance from ripple center
  const tilePos = new THREE.Vector3(...tile.position);
  const distFromRipple = tilePos.distanceTo(rippleCenter);
  const rippleWave = Math.max(0, 1 - distFromRipple * 0.5) * rippleStrength;

  const finalOpacity = opacity * level * tilePulse + rippleWave * 0.3;
  const scale = tile.scale * (1 + rippleWave * 0.2);

  return (
    <Instance
      ref={instanceRef}
      position={tile.position}
      rotation={tile.rotation}
      scale={[scale, scale, scale]}
      color={new THREE.Color().setHSL(0.5, 1, 0.5 + finalOpacity * 0.3)}
    />
  );
});

// -----------------------------------------------------------------------------
// Main SecurityShield Component
// -----------------------------------------------------------------------------

export function SecurityShield({
  level,
  status,
  threatsBlocked = 0,
  radius = 2,
  position = [0, 0, 0],
  showStats = true,
  onClick,
  animationSpeed = 1,
  showHoneycomb = true,
}: SecurityShieldProps) {
  const domeRef = React.useRef<THREE.Mesh>(null);
  const honeycombRef = React.useRef<THREE.Group>(null);
  const baseRingRef = React.useRef<THREE.Mesh>(null);
  const rippleRef = React.useRef<THREE.Mesh>(null);

  const [lastThreats, setLastThreats] = React.useState(threatsBlocked);
  const [ripple, setRipple] = React.useState(0);
  const [rippleCenter] = React.useState(() => new THREE.Vector3(0, radius * 0.5, 0));
  const timeRef = React.useRef(0);

  // Generate hexagon tiles for dome
  const hexTiles = React.useMemo(() => generateHexDomeTiles(radius * 0.98, 5), [radius]);

  // Get status configuration
  const statusConfig = STATUS_COLORS[status];
  const primaryColor = React.useMemo(
    () => new THREE.Color(statusConfig.primary),
    [statusConfig.primary]
  );
  const glowColor = React.useMemo(
    () => new THREE.Color(statusConfig.glow),
    [statusConfig.glow]
  );

  // Ripple effect when threats blocked changes
  React.useEffect(() => {
    if (threatsBlocked > lastThreats) {
      setRipple(1);
      // Randomize ripple center for visual interest
      rippleCenter.set(
        (Math.random() - 0.5) * radius,
        radius * (0.3 + Math.random() * 0.4),
        (Math.random() - 0.5) * radius
      );
    }
    setLastThreats(threatsBlocked);
  }, [threatsBlocked, lastThreats, rippleCenter, radius]);

  // Animation frame
  useFrame((state, delta) => {
    timeRef.current = state.clock.elapsedTime * animationSpeed;
    const t = timeRef.current;

    // Main dome animation
    if (domeRef.current) {
      const material = domeRef.current.material as THREE.MeshStandardMaterial;
      const pulseSpeed = statusConfig.pulseSpeed * animationSpeed;

      let pulse = 1;
      if (pulseSpeed > 0) {
        pulse = Math.sin(t * pulseSpeed) * 0.15 + 0.85;

        // Breach mode: add flicker
        if (status === "breach") {
          pulse *= 0.8 + Math.random() * 0.4;
        }
      }

      material.opacity = level * pulse * 0.5;
      material.emissiveIntensity = level * pulse * 0.4;
    }

    // Base ring glow animation
    if (baseRingRef.current) {
      const material = baseRingRef.current.material as THREE.MeshStandardMaterial;
      const ringPulse = Math.sin(t * statusConfig.pulseSpeed * 1.5) * 0.2 + 0.8;
      material.emissiveIntensity = level * ringPulse * 0.6;
    }

    // Ripple decay
    if (ripple > 0) {
      setRipple((r) => Math.max(0, r - delta * 2.5));
    }

    // Ripple mesh animation
    if (rippleRef.current && ripple > 0) {
      const scale = 1 + (1 - ripple) * 0.4;
      rippleRef.current.scale.setScalar(scale);
      const mat = rippleRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = ripple * 0.4;
    }

    // Honeycomb rotation for subtle motion
    if (honeycombRef.current && status !== "offline") {
      honeycombRef.current.rotation.y += delta * 0.03 * animationSpeed;
    }
  });

  // Hexagon geometry for instances
  const hexGeometry = React.useMemo(() => {
    const shape = createHexagonShape(1);
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2); // Face outward
    return geometry;
  }, []);

  return (
    <group position={position} onClick={onClick}>
      {/* Main shield dome - smooth hemisphere base */}
      <mesh ref={domeRef}>
        <sphereGeometry args={[radius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={primaryColor}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          emissive={primaryColor}
          emissiveIntensity={0.3}
          wireframe={status === "offline"}
          depthWrite={false}
        />
      </mesh>

      {/* Inner glow layer */}
      <mesh>
        <sphereGeometry args={[radius * 0.95, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={level * 0.15}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Honeycomb pattern overlay - instanced hexagons */}
      {showHoneycomb && status !== "offline" && (
        <group ref={honeycombRef}>
          <Instances geometry={hexGeometry} limit={hexTiles.length}>
            <meshBasicMaterial
              color={primaryColor}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
            {hexTiles.map((tile) => (
              <HexTileInstance
                key={tile.index}
                tile={tile}
                color={primaryColor}
                opacity={0.25}
                time={timeRef.current}
                pulseSpeed={statusConfig.pulseSpeed}
                level={level}
                rippleCenter={rippleCenter}
                rippleStrength={ripple}
              />
            ))}
          </Instances>
        </group>
      )}

      {/* Hexagonal wireframe overlay for structure */}
      <mesh>
        <sphereGeometry args={[radius * 1.01, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          color={primaryColor}
          transparent
          opacity={status === "offline" ? 0.1 : 0.2}
          wireframe
          depthWrite={false}
        />
      </mesh>

      {/* Base ring - glowing torus */}
      <mesh ref={baseRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.04, 16, 64]} />
        <meshStandardMaterial
          color={primaryColor}
          emissive={primaryColor}
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Secondary outer ring for depth */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.05, 0.02, 8, 64]} />
        <meshBasicMaterial
          color={primaryColor}
          transparent
          opacity={level * 0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Ripple effect mesh */}
      {ripple > 0 && (
        <mesh ref={rippleRef}>
          <sphereGeometry args={[radius * 1.02, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={ripple * 0.3}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Threat block flash effect */}
      {ripple > 0.5 && (
        <mesh position={[rippleCenter.x * 0.8, rippleCenter.y, rippleCenter.z * 0.8]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial
            color="#ff0000"
            transparent
            opacity={(ripple - 0.5) * 2}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Scan line effect for active status */}
      {status === "active" && (
        <ScanLine radius={radius} color={primaryColor} speed={animationSpeed} />
      )}

      {/* Warning rotating segments */}
      {status === "warning" && (
        <WarningIndicators radius={radius} color={primaryColor} speed={animationSpeed} />
      )}

      {/* Stats display */}
      {showStats && (
        <Html position={[0, radius + 0.5, 0]} center>
          <div
            className="text-xs font-mono px-3 py-2 rounded-md border"
            style={{
              background: "rgba(2, 4, 10, 0.85)",
              backdropFilter: "blur(24px)",
              borderColor: "rgba(255,255,255,0.06)",
              boxShadow: `0 0 20px ${statusConfig.primary}40, inset 0 1px 0 rgba(255,255,255,0.02)`,
              minWidth: "90px",
            }}
          >
            <div
              className="font-bold tracking-wider text-center mb-1"
              style={{ color: statusConfig.primary }}
            >
              {status.toUpperCase()}
            </div>
            <div className="text-white/80 text-center">
              <span className="text-white/50">Level:</span> {Math.round(level * 100)}%
            </div>
            {threatsBlocked > 0 && (
              <div className="text-red-400 text-center mt-1 animate-pulse">
                <span className="text-red-500/70">Blocked:</span> {threatsBlocked}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// -----------------------------------------------------------------------------
// Sub-components for status effects
// -----------------------------------------------------------------------------

interface ScanLineProps {
  radius: number;
  color: THREE.Color;
  speed: number;
}

function ScanLine({ radius, color, speed }: ScanLineProps) {
  const ringRef = React.useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.elapsedTime * speed;
    // Scan from top to bottom and back
    const scanProgress = (Math.sin(t * 0.8) + 1) / 2;
    const y = radius * (1 - scanProgress * 0.9);
    const ringRadius = Math.sqrt(radius * radius - y * y);

    ringRef.current.position.y = y;
    ringRef.current.scale.set(ringRadius, ringRadius, 1);

    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.3 + scanProgress * 0.2;
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.98, 1, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

interface WarningIndicatorsProps {
  radius: number;
  color: THREE.Color;
  speed: number;
}

function WarningIndicators({ radius, color, speed }: WarningIndicatorsProps) {
  const groupRef = React.useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.elapsedTime * speed * 0.5;
  });

  return (
    <group ref={groupRef}>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 4) * Math.PI * 2) * radius * 0.7,
            radius * 0.5,
            Math.sin((i / 4) * Math.PI * 2) * radius * 0.7,
          ]}
          rotation={[0, (i / 4) * Math.PI * 2, 0]}
        >
          <coneGeometry args={[0.1, 0.3, 3]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

SecurityShield.displayName = "SecurityShield";

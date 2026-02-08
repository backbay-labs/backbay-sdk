"use client";

import * as React from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import {
  Threat,
  ThreatDotProps,
  ThreatRadarProps,
  THREAT_TYPE_COLORS,
  THREAT_TYPE_LABELS,
} from "./types";

/**
 * Calculates the glow intensity based on whether the sweep recently passed
 */
function getSweepGlowIntensity(
  threatAngle: number,
  sweepAngle: number,
  falloffRange: number = Math.PI / 3
): number {
  // Normalize angles to 0-2π
  const normalizedThreat = ((threatAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const normalizedSweep = ((sweepAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

  // Calculate angular distance (accounting for wrap-around)
  let diff = normalizedSweep - normalizedThreat;
  if (diff < 0) diff += Math.PI * 2;

  // Glow fades as sweep moves away
  if (diff < falloffRange) {
    return 1 - diff / falloffRange;
  }
  return 0;
}

/**
 * Individual threat indicator dot
 */
function ThreatDot({
  threat,
  radarRadius,
  showLabel,
  sweepAngle,
  onThreatClick,
  onThreatHover,
}: ThreatDotProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const ringRef = React.useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  // Position from polar coordinates
  const x = Math.cos(threat.angle) * threat.distance * radarRadius;
  const z = Math.sin(threat.angle) * threat.distance * radarRadius;

  // Base color from threat type
  const typeColor = new THREE.Color(THREAT_TYPE_COLORS[threat.type]);

  // Lerp toward red based on severity
  const finalColor = new THREE.Color().lerpColors(
    new THREE.Color("#22ff44"),
    typeColor,
    threat.severity
  );

  // Size scales with severity
  const baseSize = 0.04 + threat.severity * 0.08;
  const size = isHovered ? baseSize * 1.3 : baseSize;

  // Sweep glow effect
  const sweepGlow = getSweepGlowIntensity(threat.angle, sweepAngle);

  useFrame((state) => {
    if (!meshRef.current) return;

    const t = state.clock.elapsedTime;
    const pulseSpeed = threat.active ? 6 : 1.5;
    const pulseAmount = threat.active ? 0.25 : 0.1;

    // Pulsing scale
    const scale = 1 + Math.sin(t * pulseSpeed) * pulseAmount;
    meshRef.current.scale.setScalar(scale);

    // Update emissive based on sweep proximity
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    if (material) {
      const baseEmissive = threat.active ? 0.8 : 0.4;
      material.emissiveIntensity = baseEmissive + sweepGlow * 0.6;
    }

    // Animate warning ring for active threats
    if (ringRef.current && threat.active) {
      const ringScale = 1.5 + Math.sin(t * 3) * 0.3;
      ringRef.current.scale.setScalar(ringScale);
      const ringMat = ringRef.current.material as THREE.MeshBasicMaterial;
      if (ringMat) {
        ringMat.opacity = 0.15 + Math.sin(t * 3) * 0.1;
      }
    }
  });

  const handlePointerEnter = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setIsHovered(true);
      onThreatHover?.(threat);
      document.body.style.cursor = "pointer";
    },
    [threat, onThreatHover]
  );

  const handlePointerLeave = React.useCallback(() => {
    setIsHovered(false);
    onThreatHover?.(null);
    document.body.style.cursor = "auto";
  }, [onThreatHover]);

  const handleClick = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onThreatClick?.(threat);
    },
    [threat, onThreatClick]
  );

  return (
    <group position={[x, 0.08, z]}>
      {/* Main threat dot */}
      <mesh
        ref={meshRef}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={finalColor}
          emissive={finalColor}
          emissiveIntensity={threat.active ? 0.8 : 0.4}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Outer glow sphere */}
      <mesh scale={1.8}>
        <sphereGeometry args={[size, 12, 12]} />
        <meshBasicMaterial
          color={finalColor}
          transparent
          opacity={0.15 + sweepGlow * 0.2}
        />
      </mesh>

      {/* Active threat warning ring */}
      {threat.active && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.8, size * 2.5, 24]} />
          <meshBasicMaterial
            color={finalColor}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Threat type label */}
      {(showLabel || isHovered) && (
        <Html
          position={[0, 0.25, 0]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div
            className="whitespace-nowrap select-none"
            style={{
              background: "rgba(2, 4, 10, 0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: finalColor.getStyle(),
              fontSize: "10px",
              fontFamily: "monospace",
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: "3px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              textShadow: `0 0 4px ${finalColor.getStyle()}`,
              boxShadow: `0 0 8px ${finalColor.getStyle()}40, inset 0 1px 0 rgba(255,255,255,0.02)`,
            }}
          >
            {THREAT_TYPE_LABELS[threat.type]}
            {threat.active && " [ACTIVE]"}
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * ThreatRadar - A 3D radar visualization for security threat monitoring
 *
 * Displays threats as pulsing dots on a rotating radar dish with a sweep line
 * that illuminates threats as it passes over them.
 */
export function ThreatRadar({
  threats,
  scanSpeed = 0.5,
  radius = 3,
  position = [0, 0, 0],
  showLabels = false,
  onThreatClick,
  onThreatHover,
  sweepColor = "#00ff66",
  gridColor = "#00ff44",
  showStats = true,
  enableGlow = true,
  rotation = [0, 0, 0],
}: ThreatRadarProps) {
  const sweepRef = React.useRef<THREE.Group>(null);
  const sweepAngleRef = React.useRef(0);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  // Track sweep angle for threat glow effect
  useFrame((_, delta) => {
    if (!sweepRef.current) return;
    sweepAngleRef.current =
      (sweepAngleRef.current + delta * scanSpeed * Math.PI * 2) % (Math.PI * 2);
    sweepRef.current.rotation.y = -sweepAngleRef.current;

    // Force re-render periodically for sweep glow updates
    // This is throttled by React's batching
    forceUpdate();
  });

  // Generate range ring points
  const rangeRings = React.useMemo(() => {
    return [0.25, 0.5, 0.75, 1.0].map((r) => {
      const points: [number, number, number][] = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        points.push([
          Math.cos(a) * r * radius,
          0,
          Math.sin(a) * r * radius,
        ]);
      }
      return points;
    });
  }, [radius]);

  // Generate polar grid lines
  const gridLines = React.useMemo(() => {
    return [0, 1, 2, 3, 4, 5].map((i) => {
      const angle = (i / 6) * Math.PI;
      return {
        start: [-Math.cos(angle) * radius, 0, -Math.sin(angle) * radius] as [
          number,
          number,
          number
        ],
        end: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [
          number,
          number,
          number
        ],
      };
    });
  }, [radius]);

  // Sweep trail geometry (pie slice)
  const sweepTrailPoints = React.useMemo(() => {
    const points: THREE.Vector3[] = [];
    const trailAngle = Math.PI / 4; // 45 degree trail
    const segments = 32;

    points.push(new THREE.Vector3(0, 0, 0));
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * trailAngle;
      points.push(
        new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius)
      );
    }
    return points;
  }, [radius]);

  const sweepTrailGeometry = React.useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    const trailAngle = Math.PI / 4;
    const segments = 32;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * trailAngle;
      shape.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
    }
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [radius]);

  // Count active threats
  const activeCount = threats.filter((t) => t.active).length;
  const criticalCount = threats.filter((t) => t.severity > 0.7).length;

  return (
    <group position={position} rotation={rotation}>
      {/* Base disc with subtle gradient effect */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[radius + 0.05, 64]} />
        <meshStandardMaterial
          color="#0a0f0a"
          metalness={0.3}
          roughness={0.8}
        />
      </mesh>

      {/* Inner disc with grid texture simulation */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[radius, 64]} />
        <meshStandardMaterial
          color="#061208"
          transparent
          opacity={0.95}
          metalness={0.2}
          roughness={0.9}
        />
      </mesh>

      {/* Range rings */}
      {rangeRings.map((points, i) => (
        <Line
          key={`ring-${i}`}
          points={points}
          color={gridColor}
          lineWidth={1}
          transparent
          opacity={0.25 + i * 0.05}
        />
      ))}

      {/* Polar grid lines */}
      {gridLines.map((line, i) => (
        <Line
          key={`grid-${i}`}
          points={[line.start, line.end]}
          color={gridColor}
          lineWidth={1}
          transparent
          opacity={0.15}
        />
      ))}

      {/* Radar sweep group */}
      <group ref={sweepRef}>
        {/* Main sweep line */}
        <Line
          points={[
            [0, 0.03, 0],
            [radius, 0.03, 0],
          ]}
          color={sweepColor}
          lineWidth={2.5}
        />

        {/* Sweep trail (fading pie slice) */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <primitive object={sweepTrailGeometry} attach="geometry" />
          <meshBasicMaterial
            color={sweepColor}
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Sweep glow effect */}
        {enableGlow && (
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <primitive
              object={sweepTrailGeometry.clone()}
              attach="geometry"
            />
            <meshBasicMaterial
              color={sweepColor}
              transparent
              opacity={0.06}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      {/* Threat indicators */}
      {threats.map((threat) => (
        <ThreatDot
          key={threat.id}
          threat={threat}
          radarRadius={radius}
          showLabel={showLabels}
          sweepAngle={sweepAngleRef.current}
          onThreatClick={onThreatClick}
          onThreatHover={onThreatHover}
        />
      ))}

      {/* Center indicator */}
      <group position={[0, 0.05, 0]}>
        <mesh>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color={sweepColor}
            emissive={sweepColor}
            emissiveIntensity={0.6}
          />
        </mesh>
        {enableGlow && (
          <mesh scale={2}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshBasicMaterial color={sweepColor} transparent opacity={0.15} />
          </mesh>
        )}
      </group>

      {/* Cardinal direction markers */}
      {["N", "E", "S", "W"].map((dir, i) => {
        const angle = (i * Math.PI) / 2;
        const markerRadius = radius + 0.2;
        return (
          <Html
            key={dir}
            position={[
              Math.sin(angle) * markerRadius,
              0,
              -Math.cos(angle) * markerRadius,
            ]}
            center
            style={{ pointerEvents: "none" }}
          >
            <div
              style={{
                color: gridColor,
                fontSize: "10px",
                fontFamily: "monospace",
                fontWeight: 700,
                opacity: 0.5,
                letterSpacing: "0.12em",
                textShadow: `0 0 4px ${gridColor}`,
              }}
            >
              {dir}
            </div>
          </Html>
        );
      })}

      {/* Stats HUD */}
      {showStats && (
        <Html position={[0, 0.95, 0]} center style={{ pointerEvents: "none" }}>
          <div
            style={{
              background: "rgba(2, 4, 10, 0.85)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: gridColor,
              fontSize: "10px",
              fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
              lineHeight: "1.5",
              padding: "10px 16px",
              borderRadius: "6px",
              boxShadow: `0 0 16px ${gridColor}18, inset 0 1px 0 rgba(255,255,255,0.02)`,
              minWidth: "156px",
              backdropFilter: "blur(24px)",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: "11px",
                marginBottom: "8px",
                letterSpacing: "2px",
                borderBottom: `1px solid ${gridColor}40`,
                paddingBottom: "4px",
              }}
            >
              THREAT RADAR
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                rowGap: "6px",
                columnGap: "10px",
              }}
            >
              <span style={{ opacity: 0.55, textTransform: "uppercase", fontSize: "9px" }}>
                Contacts
              </span>
              <span style={{ fontWeight: 700, fontSize: "11px" }}>{threats.length}</span>
              <span style={{ opacity: 0.55, textTransform: "uppercase", fontSize: "9px" }}>
                Active
              </span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "11px",
                  color: activeCount > 0 ? "#ff6644" : gridColor,
                }}
              >
                {activeCount}
              </span>
              <span style={{ opacity: 0.55, textTransform: "uppercase", fontSize: "9px" }}>
                Critical
              </span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "11px",
                  color: criticalCount > 0 ? "#ff3344" : gridColor,
                }}
              >
                {criticalCount}
              </span>
            </div>
          </div>
        </Html>
      )}

      {/* Edge glow ring */}
      {enableGlow && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <ringGeometry args={[radius - 0.02, radius + 0.04, 64]} />
          <meshBasicMaterial
            color={gridColor}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

ThreatRadar.displayName = "ThreatRadar";

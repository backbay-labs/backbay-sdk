"use client";

/**
 * AuditTrail - 3D scrolling audit event timeline visualization
 *
 * Displays security audit events as a vertical or horizontal timeline
 * with color-coded severity and interactive event cards.
 */

import * as React from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import type {
  AuditEvent,
  AuditTrailProps,
  EventNodeProps,
  FlowParticlesProps,
} from "./types";
import {
  SEVERITY_COLORS,
  EVENT_GEOMETRIES,
  EVENT_TYPE_LABELS,
  THEME_COLORS,
} from "./types";

// -----------------------------------------------------------------------------
// Flow Particles Sub-component
// -----------------------------------------------------------------------------

function FlowParticles({
  length,
  orientation,
  particleCount = 30,
  speed = 0.5,
  color = "#00ccff",
}: FlowParticlesProps) {
  const particlesRef = React.useRef<THREE.Points>(null);

  const particles = React.useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const progress = Math.random();
      if (orientation === "horizontal") {
        positions[i * 3] = -length / 2 + progress * length;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      } else {
        positions[i * 3] = (Math.random() - 0.5) * 0.2;
        positions[i * 3 + 1] = length / 2 - progress * length;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      }
      speeds[i] = 0.3 + Math.random() * 0.7;
    }

    return { positions, speeds };
  }, [length, orientation, particleCount]);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    const posAttr = particlesRef.current.geometry.attributes.position;
    const positions = posAttr.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const idx = orientation === "horizontal" ? i * 3 : i * 3 + 1;
      const direction = orientation === "horizontal" ? 1 : -1;
      positions[idx] += delta * speed * particles.speeds[i] * direction;

      // Wrap around
      if (orientation === "horizontal") {
        if (positions[idx] > length / 2) positions[idx] = -length / 2;
      } else {
        if (positions[idx] < -length / 2) positions[idx] = length / 2;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.03}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// -----------------------------------------------------------------------------
// Event Node Sub-component
// -----------------------------------------------------------------------------

function EventNode({
  event,
  position,
  onEventClick,
  onEventHover,
  showDetails,
  theme = "cyber",
}: EventNodeProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  const themeColors = THEME_COLORS[theme];
  const severityColor = new THREE.Color(SEVERITY_COLORS[event.severity]);
  const geometryType = EVENT_GEOMETRIES[event.type];

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Rotation animation
    meshRef.current.rotation.y = t * 0.5;
    meshRef.current.rotation.z = Math.sin(t * 0.3) * 0.1;

    // Pulse for critical/error events
    if (event.severity === "critical" || event.severity === "error") {
      const pulse = 1 + Math.sin(t * 5) * 0.15;
      meshRef.current.scale.setScalar(pulse * (isHovered ? 1.3 : 1));
    } else {
      meshRef.current.scale.setScalar(isHovered ? 1.3 : 1);
    }

    // Update emissive
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    if (material) {
      material.emissiveIntensity = isHovered ? 1.2 : 0.6;
    }
  });

  const handlePointerEnter = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setIsHovered(true);
      onEventHover?.(event);
      document.body.style.cursor = "pointer";
    },
    [event, onEventHover]
  );

  const handlePointerLeave = React.useCallback(() => {
    setIsHovered(false);
    onEventHover?.(null);
    document.body.style.cursor = "auto";
  }, [onEventHover]);

  const handleClick = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onEventClick?.(event);
    },
    [event, onEventClick]
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  // Create geometry based on event type
  const renderGeometry = () => {
    const size = 0.08;
    switch (geometryType) {
      case "torus":
        return <torusGeometry args={[size, size * 0.4, 8, 16]} />;
      case "box":
        return <boxGeometry args={[size * 1.5, size * 1.5, size * 1.5]} />;
      case "octahedron":
        return <octahedronGeometry args={[size * 1.2]} />;
      case "icosahedron":
        return <icosahedronGeometry args={[size * 1.1]} />;
      case "cone":
        return <coneGeometry args={[size, size * 2, 8]} />;
      default:
        return <sphereGeometry args={[size, 16, 16]} />;
    }
  };

  return (
    <group position={position}>
      {/* Main event geometry */}
      <mesh
        ref={meshRef}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      >
        {renderGeometry()}
        <meshStandardMaterial
          color={severityColor}
          emissive={severityColor}
          emissiveIntensity={0.6}
          transparent
          opacity={event.success ? 0.9 : 0.6}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Outer glow */}
      <mesh scale={2.5}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial
          color={severityColor}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Failed indicator X */}
      {!event.success && (
        <group scale={0.15}>
          <Line
            points={[
              [-1, -1, 0],
              [1, 1, 0],
            ]}
            color="#ff0000"
            lineWidth={3}
          />
          <Line
            points={[
              [-1, 1, 0],
              [1, -1, 0],
            ]}
            color="#ff0000"
            lineWidth={3}
          />
        </group>
      )}

      {/* Event label / tooltip */}
      {(showDetails || isHovered) && (
        <Html position={[0.25, 0.15, 0]} center={false}>
          <div
            style={{
              background: "rgba(0, 0, 0, 0.92)",
              border: `1px solid ${isHovered ? severityColor.getStyle() : themeColors.primary}`,
              borderRadius: "4px",
              padding: isHovered ? "10px 14px" : "4px 8px",
              fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
              fontSize: isHovered ? "11px" : "9px",
              color: "#ffffff",
              minWidth: isHovered ? "200px" : "auto",
              boxShadow: `0 0 20px ${severityColor.getStyle()}30`,
              transition: "all 0.15s ease",
            }}
          >
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  color: severityColor.getStyle(),
                  fontWeight: 700,
                  fontSize: "8px",
                  padding: "2px 5px",
                  background: `${severityColor.getStyle()}25`,
                  borderRadius: "3px",
                }}
              >
                {EVENT_TYPE_LABELS[event.type]}
              </span>
              <span
                style={{
                  fontSize: "8px",
                  opacity: 0.45,
                  textTransform: "uppercase",
                }}
              >
                {event.severity}
              </span>
              {!event.success && (
                <span
                  style={{
                    color: "#ff4444",
                    fontSize: "7px",
                    fontWeight: 700,
                    marginLeft: "auto",
                    opacity: 0.7,
                  }}
                >
                  FAILED
                </span>
              )}
            </div>

            {/* Expanded details */}
            {isHovered && (
              <>
                <div
                  style={{
                    marginTop: "8px",
                    paddingTop: "8px",
                    borderTop: "1px solid #333",
                  }}
                >
                  <div style={{ marginBottom: "6px" }}>
                    <span style={{ color: "#666", fontSize: "9px" }}>Actor</span>
                    <div style={{ color: themeColors.primary }}>{event.actor}</div>
                  </div>
                  <div style={{ marginBottom: "6px" }}>
                    <span style={{ color: "#666", fontSize: "9px" }}>Resource</span>
                    <div
                      style={{
                        wordBreak: "break-all",
                        opacity: 0.9,
                        fontSize: "10px",
                      }}
                    >
                      {event.resource}
                    </div>
                  </div>
                  <div style={{ marginBottom: "6px" }}>
                    <span style={{ color: "#666", fontSize: "9px" }}>Action</span>
                    <div style={{ opacity: 0.9, fontSize: "10px" }}>{event.action}</div>
                  </div>
                  {event.details && (
                    <div>
                      <span style={{ color: "#666", fontSize: "9px" }}>Details</span>
                      <div style={{ opacity: 0.7, fontSize: "10px" }}>
                        {event.details}
                      </div>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    marginTop: "8px",
                    paddingTop: "6px",
                    borderTop: "1px solid #222",
                    fontSize: "9px",
                    opacity: 0.5,
                  }}
                >
                  {formatTime(event.timestamp)}
                </div>
              </>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// -----------------------------------------------------------------------------
// Main AuditTrail Component
// -----------------------------------------------------------------------------

export function AuditTrail({
  events,
  maxEvents = 20,
  length = 10,
  position = [0, 0, 0],
  orientation = "horizontal",
  showDetails = false,
  onEventClick,
  onEventHover,
  autoScroll = true,
  theme = "cyber",
  showSummary = true,
  enableParticles = true,
  rotation = [0, 0, 0],
}: AuditTrailProps) {
  const groupRef = React.useRef<THREE.Group>(null);

  // Limit displayed events
  const displayedEvents = React.useMemo(() => {
    return events.slice(-maxEvents);
  }, [events, maxEvents]);

  // Theme colors
  const themeColors = THEME_COLORS[theme];

  // Calculate positions for events along the timeline
  const eventPositions = React.useMemo(() => {
    if (displayedEvents.length === 0) return [];
    const spacing = length / Math.max(1, displayedEvents.length);
    return displayedEvents.map((_, i) => {
      if (orientation === "horizontal") {
        const x = -length / 2 + spacing / 2 + i * spacing;
        return [x, 0, 0] as [number, number, number];
      } else {
        const y = length / 2 - spacing / 2 - i * spacing;
        return [0, y, 0] as [number, number, number];
      }
    });
  }, [displayedEvents.length, length, orientation]);

  // Timeline spine points
  const spinePoints = React.useMemo(() => {
    const padding = 0.5;
    if (orientation === "horizontal") {
      return [
        [-length / 2 - padding, 0, 0] as [number, number, number],
        [length / 2 + padding, 0, 0] as [number, number, number],
      ];
    } else {
      return [
        [0, length / 2 + padding, 0] as [number, number, number],
        [0, -length / 2 - padding, 0] as [number, number, number],
      ];
    }
  }, [length, orientation]);

  // Count severities
  const severityCounts = React.useMemo(() => {
    return displayedEvents.reduce(
      (acc, e) => {
        acc[e.severity]++;
        if (!e.success) acc.failed++;
        return acc;
      },
      { info: 0, warning: 0, error: 0, critical: 0, failed: 0 }
    );
  }, [displayedEvents]);

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Main timeline spine */}
      <Line
        points={spinePoints}
        color={themeColors.spine}
        lineWidth={3}
        transparent
        opacity={0.8}
      />

      {/* Glow layer */}
      <Line
        points={spinePoints}
        color={themeColors.primary}
        lineWidth={8}
        transparent
        opacity={0.15}
      />

      {/* Flow particles */}
      {enableParticles && (
        <FlowParticles
          length={length}
          orientation={orientation}
          color={themeColors.particle}
          particleCount={40}
          speed={0.8}
        />
      )}

      {/* Event nodes */}
      {displayedEvents.map((event, index) => (
        <EventNode
          key={event.id}
          event={event}
          position={eventPositions[index]}
          onEventClick={onEventClick}
          onEventHover={onEventHover}
          showDetails={showDetails}
          theme={theme}
        />
      ))}

      {/* Connection lines from events to spine */}
      {displayedEvents.map((event, index) => {
        const pos = eventPositions[index];
        const lineEnd =
          orientation === "horizontal"
            ? ([pos[0], -0.15, 0] as [number, number, number])
            : ([-0.15, pos[1], 0] as [number, number, number]);
        return (
          <Line
            key={`line-${event.id}`}
            points={[pos, lineEnd]}
            color={SEVERITY_COLORS[event.severity]}
            lineWidth={1}
            transparent
            opacity={0.3}
          />
        );
      })}

      {/* Direction arrow */}
      <group
        position={
          orientation === "horizontal"
            ? [length / 2 + 0.7, 0, 0]
            : [0, -length / 2 - 0.7, 0]
        }
      >
        <mesh
          rotation={
            orientation === "horizontal"
              ? [0, 0, -Math.PI / 2]
              : [0, 0, Math.PI]
          }
        >
          <coneGeometry args={[0.08, 0.2, 6]} />
          <meshBasicMaterial
            color={themeColors.primary}
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>

      {/* Summary HUD */}
      {showSummary && (
        <Html
          position={
            orientation === "horizontal"
              ? [-length / 2 - 1.5, 0.5, 0]
              : [0.8, length / 2 + 0.3, 0]
          }
          center
        >
          <div
            style={{
              background: "rgba(0, 8, 12, 0.95)",
              border: `1px solid ${themeColors.primary}50`,
              borderRadius: "5px",
              padding: "10px 14px",
              fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
              fontSize: "10px",
              color: themeColors.primary,
              boxShadow: `0 0 20px ${themeColors.glow}, inset 0 0 15px ${themeColors.glow}`,
              minWidth: "110px",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: "11px",
                marginBottom: "8px",
                letterSpacing: "1.5px",
                borderBottom: `1px solid ${themeColors.primary}40`,
                paddingBottom: "6px",
                textAlign: "center",
              }}
            >
              AUDIT LOG
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "2px",
              }}
            >
              <span style={{ opacity: 0.6 }}>Events:</span>
              <span style={{ fontWeight: 600 }}>{displayedEvents.length}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "2px",
                color: SEVERITY_COLORS.warning,
              }}
            >
              <span style={{ opacity: 0.7 }}>Warn:</span>
              <span style={{ fontWeight: 600 }}>{severityCounts.warning}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "2px",
                color: SEVERITY_COLORS.error,
              }}
            >
              <span style={{ opacity: 0.7 }}>Error:</span>
              <span style={{ fontWeight: 600 }}>{severityCounts.error}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "2px",
                color: SEVERITY_COLORS.critical,
              }}
            >
              <span style={{ opacity: 0.7 }}>Critical:</span>
              <span style={{ fontWeight: 600 }}>{severityCounts.critical}</span>
            </div>
            {severityCounts.failed > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "4px",
                  paddingTop: "4px",
                  borderTop: "1px solid #333",
                  color: "#ff4444",
                }}
              >
                <span style={{ opacity: 0.7 }}>Failed:</span>
                <span style={{ fontWeight: 600 }}>{severityCounts.failed}</span>
              </div>
            )}
          </div>
        </Html>
      )}

      {/* Background frame glow */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry
          args={
            orientation === "horizontal"
              ? [length + 2, 1.5]
              : [1.5, length + 2]
          }
        />
        <meshBasicMaterial
          color={themeColors.primary}
          transparent
          opacity={0.02}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

AuditTrail.displayName = "AuditTrail";

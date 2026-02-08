"use client";

import * as React from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { DataStreamProps, StreamEvent, EventType } from "./types";
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "./types";

// -----------------------------------------------------------------------------
// Curve Builders
// -----------------------------------------------------------------------------

function buildRibbonCurve(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(-5, 0, 0),
    new THREE.Vector3(-2.5, 0.8, 0.5),
    new THREE.Vector3(0, -0.4, -0.3),
    new THREE.Vector3(2.5, 0.6, 0.4),
    new THREE.Vector3(5, 0, 0),
  ]);
}

function buildHelixCurve(): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = [];
  const turns = 3;
  const segments = 60;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI * 2 * turns;
    const x = -5 + t * 10;
    const y = Math.sin(angle) * 1.2;
    const z = Math.cos(angle) * 1.2;
    points.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(points);
}

function buildArcCurve(): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = [];
  const segments = 40;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = Math.PI * t;
    const x = -4 + t * 8;
    const y = Math.sin(angle) * 3;
    const z = -Math.cos(angle) * 0.5;
    points.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(points);
}

function getCurve(shape: "ribbon" | "helix" | "arc"): THREE.CatmullRomCurve3 {
  switch (shape) {
    case "helix":
      return buildHelixCurve();
    case "arc":
      return buildArcCurve();
    default:
      return buildRibbonCurve();
  }
}

// -----------------------------------------------------------------------------
// Stream Particles (ambient current along tube)
// -----------------------------------------------------------------------------

function StreamParticles({
  curve,
  count = 80,
  speed,
  paused,
}: {
  curve: THREE.CatmullRomCurve3;
  count?: number;
  speed: number;
  paused: boolean;
}) {
  const pointsRef = React.useRef<THREE.Points>(null);

  const data = React.useMemo(() => {
    const positions = new Float32Array(count * 3);
    const offsets = new Float32Array(count);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      offsets[i] = Math.random();
      speeds[i] = 0.6 + Math.random() * 0.8;
      const pt = curve.getPointAt(offsets[i]);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y;
      positions[i * 3 + 2] = pt.z;
    }
    return { positions, offsets, speeds };
  }, [curve, count]);

  useFrame((_, delta) => {
    if (!pointsRef.current || paused) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const positions = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      data.offsets[i] += delta * 0.08 * speed * data.speeds[i];
      if (data.offsets[i] > 1) data.offsets[i] -= 1;
      const pt = curve.getPointAt(data.offsets[i]);
      // Small jitter for organic feel
      positions[i * 3] = pt.x + (Math.random() - 0.5) * 0.02;
      positions[i * 3 + 1] = pt.y + (Math.random() - 0.5) * 0.02;
      positions[i * 3 + 2] = pt.z + (Math.random() - 0.5) * 0.02;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[data.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#22D3EE"
        size={0.025}
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// -----------------------------------------------------------------------------
// Event Node
// -----------------------------------------------------------------------------

function EventNode({
  event,
  curve,
  progress,
  dimmed,
  size,
  onEventClick,
  onEventHover,
}: {
  event: StreamEvent;
  curve: THREE.CatmullRomCurve3;
  progress: number;
  dimmed: boolean;
  size: number;
  onEventClick?: (id: string) => void;
  onEventHover?: (id: string | null) => void;
}) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);

  const color = EVENT_TYPE_COLORS[event.type];
  const threeColor = React.useMemo(() => new THREE.Color(color), [color]);

  const position = React.useMemo(() => {
    const clamped = Math.max(0, Math.min(1, progress));
    return curve.getPointAt(clamped);
  }, [curve, progress]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.y = t * 0.6;
    meshRef.current.rotation.x = Math.sin(t * 0.4) * 0.2;

    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    if (material) {
      material.opacity = dimmed ? 0.2 : hovered ? 1 : 0.85;
      material.emissiveIntensity = dimmed ? 0.1 : hovered ? 1.4 : 0.7;
    }
  });

  const handlePointerEnter = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHovered(true);
      onEventHover?.(event.id);
      document.body.style.cursor = "pointer";
    },
    [event.id, onEventHover]
  );

  const handlePointerLeave = React.useCallback(() => {
    setHovered(false);
    onEventHover?.(null);
    document.body.style.cursor = "auto";
  }, [onEventHover]);

  const handleClick = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onEventClick?.(event.id);
    },
    [event.id, onEventClick]
  );

  const formatTime = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const useOctahedron = event.type === "error" || event.type === "warning";

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh
        ref={meshRef}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      >
        {useOctahedron ? (
          <octahedronGeometry args={[size]} />
        ) : (
          <sphereGeometry args={[size, 16, 16]} />
        )}
        <meshStandardMaterial
          color={threeColor}
          emissive={threeColor}
          emissiveIntensity={0.7}
          transparent
          opacity={0.85}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Outer glow */}
      <mesh scale={2.2}>
        <sphereGeometry args={[size, 12, 12]} />
        <meshBasicMaterial
          color={threeColor}
          transparent
          opacity={dimmed ? 0.03 : 0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Tooltip on hover */}
      {hovered && (
        <Html position={[0.3, 0.3, 0]} center={false}>
          <div
            style={{
              background: "rgba(2, 4, 10, 0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "4px",
              padding: "10px 14px",
              fontFamily: "monospace",
              fontSize: "11px",
              color: "#ffffff",
              minWidth: "180px",
              boxShadow: `0 0 20px ${color}30, inset 0 1px 0 rgba(255,255,255,0.02)`,
            }}
          >
            {/* Type badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  color,
                  fontWeight: 700,
                  fontSize: "8px",
                  padding: "2px 5px",
                  background: `${color}25`,
                  borderRadius: "3px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                {EVENT_TYPE_LABELS[event.type]}
              </span>
              <span
                style={{
                  fontSize: "8px",
                  opacity: 0.45,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                {formatTime(event.timestamp)}
              </span>
            </div>

            {/* Label */}
            <div
              style={{
                marginTop: "8px",
                fontSize: "10px",
                fontWeight: 600,
              }}
            >
              {event.label}
            </div>

            {/* Value */}
            {event.value != null && (
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "9px",
                  opacity: 0.6,
                }}
              >
                Value: {event.value}
              </div>
            )}

            {/* Metadata */}
            {event.metadata &&
              Object.keys(event.metadata).length > 0 && (
                <div
                  style={{
                    marginTop: "6px",
                    paddingTop: "6px",
                    borderTop: "1px solid #333",
                  }}
                >
                  {Object.entries(event.metadata).map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "9px",
                        opacity: 0.55,
                        marginBottom: "2px",
                      }}
                    >
                      <span style={{ textTransform: "uppercase", letterSpacing: "0.12em" }}>
                        {k}
                      </span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </Html>
      )}
    </group>
  );
}

// -----------------------------------------------------------------------------
// Time Axis
// -----------------------------------------------------------------------------

function TimeAxis({
  curve,
  events,
  offsets,
}: {
  curve: THREE.CatmullRomCurve3;
  events: StreamEvent[];
  offsets: number[];
}) {
  // Render a few tick marks along the bottom
  const ticks = React.useMemo(() => {
    const count = Math.min(5, events.length);
    if (count === 0) return [];
    const step = Math.floor(events.length / count);
    const result: { position: THREE.Vector3; label: string }[] = [];
    for (let i = 0; i < count; i++) {
      const idx = i * step;
      if (idx >= events.length) break;
      const t = Math.max(0, Math.min(1, offsets[idx] ?? 0));
      const pt = curve.getPointAt(t);
      const d = new Date(events[idx].timestamp);
      const label = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      result.push({ position: pt, label });
    }
    return result;
  }, [curve, events, offsets]);

  return (
    <>
      {ticks.map((tick, i) => (
        <Html
          key={i}
          position={[tick.position.x, tick.position.y - 0.6, tick.position.z]}
          center
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "7px",
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              whiteSpace: "nowrap",
            }}
          >
            {tick.label}
          </div>
        </Html>
      ))}
    </>
  );
}

// -----------------------------------------------------------------------------
// Main DataStream Component
// -----------------------------------------------------------------------------

export function DataStream({
  events,
  maxVisible = 50,
  speed = 1,
  streamShape = "ribbon",
  onEventClick,
  onEventHover,
  highlightType = null,
  paused = false,
}: DataStreamProps) {
  const groupRef = React.useRef<THREE.Group>(null);
  const tubeRef = React.useRef<THREE.Mesh>(null);

  const curve = React.useMemo(() => getCurve(streamShape), [streamShape]);

  const tubeGeometry = React.useMemo(
    () => new THREE.TubeGeometry(curve, 128, 0.08, 12, false),
    [curve]
  );

  // Visible events (capped)
  const visibleEvents = React.useMemo(
    () => events.slice(0, maxVisible),
    [events, maxVisible]
  );

  // Flowing offsets: each event gets a progress value [0..1] along the curve
  const offsetsRef = React.useRef<number[]>([]);

  // Initialize offsets evenly
  React.useEffect(() => {
    const count = visibleEvents.length;
    offsetsRef.current = visibleEvents.map((_, i) =>
      count > 1 ? i / (count - 1) : 0.5
    );
  }, [visibleEvents]);

  // Animate offsets forward
  useFrame((_, delta) => {
    if (paused) return;
    const offsets = offsetsRef.current;
    for (let i = 0; i < offsets.length; i++) {
      offsets[i] += delta * 0.03 * speed;
      if (offsets[i] > 1) {
        offsets[i] -= 1;
      }
    }
  });

  // Tube pulse
  useFrame((state) => {
    if (!tubeRef.current) return;
    const mat = tubeRef.current.material as THREE.MeshStandardMaterial;
    if (mat) {
      mat.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  // Compute event sizes
  const eventSizes = React.useMemo(() => {
    const values = visibleEvents.map((e) => e.value ?? 1);
    const max = Math.max(...values, 1);
    return values.map((v) => 0.06 + (v / max) * 0.1);
  }, [visibleEvents]);

  return (
    <group ref={groupRef}>
      {/* Stream tube */}
      <mesh ref={tubeRef} geometry={tubeGeometry}>
        <meshStandardMaterial
          color="#22D3EE"
          emissive="#22D3EE"
          emissiveIntensity={0.3}
          transparent
          opacity={0.15}
          metalness={0.4}
          roughness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outer glow tube */}
      <mesh>
        <tubeGeometry args={[curve, 64, 0.18, 8, false]} />
        <meshBasicMaterial
          color="#22D3EE"
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ambient flow particles */}
      <StreamParticles curve={curve} count={80} speed={speed} paused={paused} />

      {/* Event nodes */}
      {visibleEvents.map((event, i) => (
        <EventNode
          key={event.id}
          event={event}
          curve={curve}
          progress={offsetsRef.current[i] ?? (visibleEvents.length > 1 ? i / (visibleEvents.length - 1) : 0.5)}
          dimmed={highlightType != null && event.type !== highlightType}
          size={eventSizes[i]}
          onEventClick={onEventClick}
          onEventHover={onEventHover}
        />
      ))}

      {/* Time axis ticks */}
      <TimeAxis
        curve={curve}
        events={visibleEvents}
        offsets={
          offsetsRef.current.length > 0
            ? offsetsRef.current
            : visibleEvents.map((_, i) =>
                visibleEvents.length > 1 ? i / (visibleEvents.length - 1) : 0.5
              )
        }
      />
    </group>
  );
}

DataStream.displayName = "DataStream";

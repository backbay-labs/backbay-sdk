"use client";

/**
 * FlowDiagram3D - 3D workflow/pipeline visualization
 *
 * Renders pipeline stages as colored nodes connected by animated particle
 * streams. Supports linear, branching, and parallel layouts.
 */

import * as React from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { Html, Line, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type {
  FlowStage,
  FlowConnection,
  FlowDiagram3DProps,
  StageStatus,
} from "./types";
import { STATUS_COLORS, STATUS_LABELS } from "./types";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const NODE_WIDTH = 1.6;
const NODE_HEIGHT = 0.8;
const NODE_DEPTH = 0.4;
const HORIZONTAL_SPACING = 2.8;
const VERTICAL_SPACING = 2.2;
const LANE_SPACING = 2.4;
const PARTICLE_COUNT = 12;

// -----------------------------------------------------------------------------
// Stage Node Sub-component
// -----------------------------------------------------------------------------

interface StageNodeProps {
  stage: FlowStage;
  position: [number, number, number];
  isActive: boolean;
  onClick?: (id: string) => void;
}

function StageNode({ stage, position, isActive, onClick }: StageNodeProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const ringRef = React.useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  const color = new THREE.Color(STATUS_COLORS[stage.status]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    // Running: breathing cyan glow (2s cycle)
    if (stage.status === "running") {
      const pulse = 0.4 + Math.sin(t * Math.PI) * 0.3;
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      if (mat) mat.emissiveIntensity = pulse;
    }

    // Spin ring for running stages
    if (ringRef.current && stage.status === "running") {
      ringRef.current.rotation.z = t * 2;
    }
  });

  const handlePointerEnter = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setIsHovered(true);
      document.body.style.cursor = "pointer";
    },
    []
  );

  const handlePointerLeave = React.useCallback(() => {
    setIsHovered(false);
    document.body.style.cursor = "auto";
  }, []);

  const handleClick = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onClick?.(stage.id);
    },
    [onClick, stage.id]
  );

  const isSkipped = stage.status === "skipped";

  return (
    <group position={position}>
      {/* Main stage box */}
      <RoundedBox
        ref={meshRef}
        args={[NODE_WIDTH, NODE_HEIGHT, NODE_DEPTH]}
        radius={0.08}
        smoothness={4}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      >
        <meshStandardMaterial
          color={isSkipped ? "#1E293B" : color}
          emissive={color}
          emissiveIntensity={stage.status === "running" ? 0.5 : 0.2}
          transparent
          opacity={isSkipped ? 0.3 : 0.85}
          metalness={0.4}
          roughness={0.3}
          wireframe={isSkipped}
        />
      </RoundedBox>

      {/* Progress fill bar for running stages */}
      {stage.status === "running" && stage.progress != null && (
        <mesh position={[-(NODE_WIDTH / 2) * (1 - stage.progress), -NODE_HEIGHT / 2 - 0.06, NODE_DEPTH / 2 + 0.01]}>
          <planeGeometry args={[NODE_WIDTH * stage.progress, 0.06]} />
          <meshBasicMaterial color="#22D3EE" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Animated spinning ring for running */}
      {stage.status === "running" && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.65, 0.025, 8, 32, Math.PI * 1.5]} />
          <meshBasicMaterial
            color="#22D3EE"
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Outer glow */}
      {(isActive || isHovered) && (
        <mesh>
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.1}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Failed X indicator */}
      {stage.status === "failed" && (
        <group scale={0.25} position={[0, 0, NODE_DEPTH / 2 + 0.05]}>
          <Line
            points={[[-1, -1, 0], [1, 1, 0]]}
            color="#F43F5E"
            lineWidth={3}
          />
          <Line
            points={[[-1, 1, 0], [1, -1, 0]]}
            color="#F43F5E"
            lineWidth={3}
          />
        </group>
      )}

      {/* Html label overlay */}
      <Html position={[0, 0, NODE_DEPTH / 2 + 0.1]} center>
        <div
          style={{
            background: "rgba(2, 4, 10, 0.85)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "4px",
            padding: "6px 10px",
            fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
            fontSize: "10px",
            color: "rgba(226,232,240,1)",
            minWidth: "100px",
            textAlign: "center",
            boxShadow: `0 0 16px ${STATUS_COLORS[stage.status]}20, inset 0 1px 0 rgba(255,255,255,0.02)`,
            pointerEvents: "none",
          }}
        >
          {/* Icon + label */}
          <div style={{ fontWeight: 700, fontSize: "11px", marginBottom: "4px" }}>
            {stage.icon ? `${stage.icon} ` : ""}{stage.label}
          </div>

          {/* Status badge */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                fontSize: "7px",
                fontWeight: 700,
                padding: "1px 5px",
                borderRadius: "3px",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: STATUS_COLORS[stage.status],
                background: `${STATUS_COLORS[stage.status]}25`,
              }}
            >
              {STATUS_LABELS[stage.status]}
            </span>
            {stage.duration && (
              <span style={{ fontSize: "9px", color: "rgba(100,116,139,1)" }}>
                {stage.duration}
              </span>
            )}
          </div>

          {/* Progress for running */}
          {stage.status === "running" && stage.progress != null && (
            <div style={{ marginTop: "4px", fontSize: "9px", color: "#22D3EE" }}>
              {Math.round(stage.progress * 100)}%
            </div>
          )}

          {/* Description on hover */}
          {isHovered && stage.description && (
            <div
              style={{
                marginTop: "6px",
                paddingTop: "6px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                fontSize: "9px",
                color: "rgba(100,116,139,1)",
                maxWidth: "160px",
              }}
            >
              {stage.description}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

// -----------------------------------------------------------------------------
// Connection Particles Sub-component
// -----------------------------------------------------------------------------

interface ConnectionParticlesProps {
  curve: THREE.CatmullRomCurve3;
  color: string;
  speed: number;
}

function ConnectionParticles({ curve, color, speed }: ConnectionParticlesProps) {
  const pointsRef = React.useRef<THREE.Points>(null);

  const offsets = React.useMemo(
    () => new Float32Array(PARTICLE_COUNT).map(() => Math.random()),
    []
  );

  const positions = React.useMemo(
    () => new Float32Array(PARTICLE_COUNT * 3),
    []
  );

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.elapsedTime * speed;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const progress = (t * 0.3 + offsets[i]) % 1;
      const point = curve.getPointAt(progress);
      arr[i * 3] = point.x;
      arr[i * 3 + 1] = point.y;
      arr[i * 3 + 2] = point.z;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.06}
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// -----------------------------------------------------------------------------
// Connection Edge Sub-component
// -----------------------------------------------------------------------------

interface ConnectionEdgeProps {
  from: [number, number, number];
  to: [number, number, number];
  connection: FlowConnection;
  fromStatus: StageStatus;
  toStatus: StageStatus;
}

function ConnectionEdge({ from, to, connection, fromStatus, toStatus }: ConnectionEdgeProps) {
  const isFailed = fromStatus === "failed" || toStatus === "failed";
  const isSkipped = fromStatus === "skipped" || toStatus === "skipped";
  const shouldAnimate = connection.animated !== false && !isSkipped;

  const edgeColor = isFailed ? "#F43F5E" : isSkipped ? "#334155" : "#22D3EE";

  // Build CatmullRom curve with a midpoint control offset
  const { curve, linePoints } = React.useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
    // Add slight vertical bend for visual depth
    mid.z += 0.3;

    const c = new THREE.CatmullRomCurve3([start, mid, end]);
    const pts = c.getPoints(32).map(
      (p) => [p.x, p.y, p.z] as [number, number, number]
    );
    return { curve: c, linePoints: pts };
  }, [from, to]);

  return (
    <group>
      {/* Connection line */}
      <Line
        points={linePoints}
        color={edgeColor}
        lineWidth={isFailed ? 1 : 1.5}
        transparent
        opacity={isSkipped ? 0.15 : 0.5}
        dashed={isFailed || isSkipped}
        dashScale={1.5}
        dashSize={0.15}
        gapSize={0.12}
      />

      {/* Glow line */}
      {!isSkipped && (
        <Line
          points={linePoints}
          color={edgeColor}
          lineWidth={4}
          transparent
          opacity={0.08}
        />
      )}

      {/* Animated particles */}
      {shouldAnimate && (
        <ConnectionParticles
          curve={curve}
          color={edgeColor}
          speed={isFailed ? 0.4 : 0.8}
        />
      )}

      {/* Condition label at midpoint */}
      {connection.condition && (
        <Html
          position={[
            (from[0] + to[0]) / 2,
            (from[1] + to[1]) / 2 + 0.35,
            (from[2] + to[2]) / 2 + 0.3,
          ]}
          center
        >
          <div
            style={{
              background: "rgba(2, 4, 10, 0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "3px",
              padding: "2px 6px",
              fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
              fontSize: "8px",
              color: "rgba(100,116,139,1)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            {connection.condition}
          </div>
        </Html>
      )}
    </group>
  );
}

// -----------------------------------------------------------------------------
// Layout helpers
// -----------------------------------------------------------------------------

function computePositions(
  stages: FlowStage[],
  connections: FlowConnection[],
  layout: FlowDiagram3DProps["layout"],
  direction: FlowDiagram3DProps["direction"]
): Map<string, [number, number, number]> {
  const positions = new Map<string, [number, number, number]>();
  const isHorizontal = direction !== "vertical";

  if (layout === "branching") {
    // Detect fork/join: stages that have multiple outgoing or incoming connections
    const outCount = new Map<string, number>();
    const inCount = new Map<string, number>();
    stages.forEach((s) => {
      outCount.set(s.id, 0);
      inCount.set(s.id, 0);
    });
    connections.forEach((c) => {
      outCount.set(c.from, (outCount.get(c.from) ?? 0) + 1);
      inCount.set(c.to, (inCount.get(c.to) ?? 0) + 1);
    });

    // Topological column assignment via BFS
    const col = new Map<string, number>();
    const lane = new Map<string, number>();

    // Find root nodes (no incoming connections)
    const roots = stages.filter(
      (s) => !connections.some((c) => c.to === s.id)
    );

    // BFS to assign columns
    const queue: string[] = roots.map((r) => r.id);
    roots.forEach((r) => col.set(r.id, 0));

    const visited = new Set<string>();
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const currentCol = col.get(current) ?? 0;
      const children = connections
        .filter((c) => c.from === current)
        .map((c) => c.to);

      children.forEach((child, idx) => {
        const existingCol = col.get(child);
        const nextCol = currentCol + 1;
        if (existingCol === undefined || nextCol > existingCol) {
          col.set(child, nextCol);
        }
        if (!lane.has(child)) {
          lane.set(child, idx);
        }
        queue.push(child);
      });
    }

    // Assign any unvisited stages
    stages.forEach((s) => {
      if (!col.has(s.id)) col.set(s.id, 0);
      if (!lane.has(s.id)) lane.set(s.id, 0);
    });

    // Group by column to center lanes
    const columnGroups = new Map<number, string[]>();
    stages.forEach((s) => {
      const c = col.get(s.id) ?? 0;
      const group = columnGroups.get(c) ?? [];
      group.push(s.id);
      columnGroups.set(c, group);
    });

    stages.forEach((s) => {
      const c = col.get(s.id) ?? 0;
      const group = columnGroups.get(c) ?? [s.id];
      const laneIdx = group.indexOf(s.id);
      const laneOffset = (laneIdx - (group.length - 1) / 2) * LANE_SPACING;

      if (isHorizontal) {
        positions.set(s.id, [c * HORIZONTAL_SPACING, laneOffset, 0]);
      } else {
        positions.set(s.id, [laneOffset, -c * VERTICAL_SPACING, 0]);
      }
    });
  } else if (layout === "parallel") {
    // Each stage on its own lane, same column
    const lanes = stages.length;
    stages.forEach((s, i) => {
      const laneOffset = (i - (lanes - 1) / 2) * LANE_SPACING;
      if (isHorizontal) {
        positions.set(s.id, [0, laneOffset, 0]);
      } else {
        positions.set(s.id, [laneOffset, 0, 0]);
      }
    });
  } else {
    // Linear
    const total = stages.length;
    stages.forEach((s, i) => {
      const offset = (i - (total - 1) / 2);
      if (isHorizontal) {
        positions.set(s.id, [offset * HORIZONTAL_SPACING, 0, 0]);
      } else {
        positions.set(s.id, [0, -offset * VERTICAL_SPACING, 0]);
      }
    });
  }

  return positions;
}

// -----------------------------------------------------------------------------
// Main FlowDiagram3D Component
// -----------------------------------------------------------------------------

export function FlowDiagram3D({
  stages,
  connections,
  layout = "linear",
  direction = "horizontal",
  onStageClick,
  activeStageId = null,
}: FlowDiagram3DProps) {
  const stageMap = React.useMemo(() => {
    const m = new Map<string, FlowStage>();
    stages.forEach((s) => m.set(s.id, s));
    return m;
  }, [stages]);

  const positions = React.useMemo(
    () => computePositions(stages, connections, layout, direction),
    [stages, connections, layout, direction]
  );

  return (
    <group>
      {/* Connections */}
      {connections.map((conn) => {
        const fromPos = positions.get(conn.from);
        const toPos = positions.get(conn.to);
        if (!fromPos || !toPos) return null;

        const fromStage = stageMap.get(conn.from);
        const toStage = stageMap.get(conn.to);

        return (
          <ConnectionEdge
            key={`${conn.from}-${conn.to}`}
            from={fromPos}
            to={toPos}
            connection={conn}
            fromStatus={fromStage?.status ?? "pending"}
            toStatus={toStage?.status ?? "pending"}
          />
        );
      })}

      {/* Stage nodes */}
      {stages.map((stage) => {
        const pos = positions.get(stage.id);
        if (!pos) return null;

        return (
          <StageNode
            key={stage.id}
            stage={stage}
            position={pos}
            isActive={activeStageId === stage.id}
            onClick={onStageClick}
          />
        );
      })}

      {/* Background glow plane */}
      <mesh position={[0, 0, -0.3]}>
        <planeGeometry args={[
          (stages.length + 1) * HORIZONTAL_SPACING,
          LANE_SPACING * 2 + 2,
        ]} />
        <meshBasicMaterial
          color="#22D3EE"
          transparent
          opacity={0.015}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

FlowDiagram3D.displayName = "FlowDiagram3D";

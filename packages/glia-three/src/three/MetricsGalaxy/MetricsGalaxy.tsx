"use client";

import * as React from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import type {
  MetricNode,
  MetricConnection,
  MetricsGalaxyProps,
} from "./types";

// --- Neon palette from design DNA ---
const NEON = {
  cyan: "#22D3EE",
  magenta: "#F43F5E",
  emerald: "#10B981",
  violet: "#8B5CF6",
  yellow: "#EAB308",
  red: "#EF4444",
};

// Category-to-color mapping (fallback cycles through neons)
const CATEGORY_COLORS: Record<string, string> = {
  compute: NEON.cyan,
  network: NEON.violet,
  storage: NEON.magenta,
  memory: NEON.emerald,
};

function getCategoryColor(category?: string): string {
  if (category && CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  return NEON.cyan;
}

/**
 * Determine the status color of a metric based on its threshold.
 * Green (healthy) -> Yellow (warn) -> Red (critical)
 */
function getStatusColor(metric: MetricNode): THREE.Color {
  if (!metric.threshold) return new THREE.Color(NEON.emerald);

  const { warn, critical } = metric.threshold;
  if (metric.value >= critical) return new THREE.Color(NEON.red);
  if (metric.value >= warn) return new THREE.Color(NEON.yellow);
  return new THREE.Color(NEON.emerald);
}

/**
 * Returns a sphere scale factor; larger when closer to critical threshold.
 */
function getNodeScale(metric: MetricNode): number {
  if (!metric.threshold) return 1;
  const ratio = metric.value / metric.threshold.critical;
  return 0.8 + Math.min(ratio, 1.5) * 0.7;
}

// --- Layout algorithms ---

function galaxyLayout(metrics: MetricNode[]): Map<string, THREE.Vector3> {
  const map = new Map<string, THREE.Vector3>();
  const phi = (1 + Math.sqrt(5)) / 2; // golden ratio
  const n = metrics.length;
  metrics.forEach((m, i) => {
    const theta = (2 * Math.PI * i) / phi;
    const r = 1.2 + Math.sqrt(i / n) * 3;
    const y = (i / (n - 1 || 1) - 0.5) * 2;
    map.set(m.id, new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
  });
  return map;
}

function gridLayout(metrics: MetricNode[]): Map<string, THREE.Vector3> {
  const map = new Map<string, THREE.Vector3>();
  const cols = Math.ceil(Math.sqrt(metrics.length));
  const spacing = 2;
  metrics.forEach((m, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = (col - (cols - 1) / 2) * spacing;
    const z = (row - (Math.ceil(metrics.length / cols) - 1) / 2) * spacing;
    map.set(m.id, new THREE.Vector3(x, 0, z));
  });
  return map;
}

function radialLayout(metrics: MetricNode[]): Map<string, THREE.Vector3> {
  const map = new Map<string, THREE.Vector3>();
  // Group by category
  const groups = new Map<string, MetricNode[]>();
  metrics.forEach((m) => {
    const cat = m.category || "default";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(m);
  });

  const groupKeys = Array.from(groups.keys());
  const sectorAngle = (2 * Math.PI) / groupKeys.length;

  groupKeys.forEach((cat, gi) => {
    const nodes = groups.get(cat)!;
    const baseAngle = gi * sectorAngle;
    nodes.forEach((m, ni) => {
      const r = 1.5 + ni * 1.2;
      const spread = sectorAngle * 0.3;
      const angle = baseAngle + (ni / (nodes.length || 1) - 0.5) * spread;
      map.set(m.id, new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r));
    });
  });
  return map;
}

function computeLayout(
  metrics: MetricNode[],
  layout: "galaxy" | "grid" | "radial"
): Map<string, THREE.Vector3> {
  switch (layout) {
    case "grid":
      return gridLayout(metrics);
    case "radial":
      return radialLayout(metrics);
    default:
      return galaxyLayout(metrics);
  }
}

// --- Mini sparkline as a Line halo ---

function SparklineHalo({
  history,
  color,
  radius,
}: {
  history: number[];
  color: THREE.Color;
  radius: number;
}) {
  const points = React.useMemo(() => {
    if (history.length < 2) return null;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    const pts: [number, number, number][] = history.map((v, i) => {
      const angle = (i / (history.length - 1)) * Math.PI * 2;
      const normalized = (v - min) / range;
      const r = radius + normalized * 0.15;
      return [Math.cos(angle) * r, normalized * 0.1, Math.sin(angle) * r];
    });
    // Close the loop
    pts.push(pts[0]);
    return pts;
  }, [history, radius]);

  if (!points) return null;

  return (
    <Line
      points={points}
      color={color.getStyle()}
      lineWidth={1.5}
      transparent
      opacity={0.5}
    />
  );
}

// --- Tooltip overlay ---

function MetricTooltip({ metric, color }: { metric: MetricNode; color: THREE.Color }) {
  const trendArrow = metric.trend > 0 ? "\u25B2" : metric.trend < 0 ? "\u25BC" : "\u25CF";
  const trendColor =
    metric.trend > 0 ? NEON.emerald : metric.trend < 0 ? NEON.red : "rgba(100,116,139,1)";

  return (
    <Html position={[0, 0.6, 0]} center style={{ pointerEvents: "none" }}>
      <div
        style={{
          background: "rgba(2,4,10,0.85)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: `0 0 12px ${color.getStyle()}30, inset 0 1px 0 rgba(255,255,255,0.02)`,
          padding: "8px 12px",
          borderRadius: "6px",
          minWidth: "120px",
          fontFamily: "monospace",
          fontSize: "10px",
          letterSpacing: "0.12em",
          textTransform: "uppercase" as const,
          color: "rgba(226,232,240,1)",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: "11px",
            marginBottom: "4px",
            color: color.getStyle(),
            textShadow: `0 0 4px ${color.getStyle()}`,
          }}
        >
          {metric.label}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
          <span style={{ fontWeight: 700, fontSize: "13px" }}>
            {metric.value}
            <span style={{ fontSize: "9px", opacity: 0.7, marginLeft: "2px" }}>
              {metric.unit}
            </span>
          </span>
          <span style={{ color: trendColor, fontSize: "10px" }}>
            {trendArrow} {Math.abs(metric.trend).toFixed(1)}%
          </span>
        </div>
        {metric.history && metric.history.length > 1 && (
          <svg
            width="96"
            height="20"
            viewBox="0 0 96 20"
            style={{ display: "block", marginTop: "4px" }}
          >
            <polyline
              points={metric.history
                .map((v, i) => {
                  const min = Math.min(...metric.history!);
                  const max = Math.max(...metric.history!);
                  const range = max - min || 1;
                  const x = (i / (metric.history!.length - 1)) * 96;
                  const y = 18 - ((v - min) / range) * 16;
                  return `${x},${y}`;
                })
                .join(" ")}
              fill="none"
              stroke={color.getStyle()}
              strokeWidth="1.5"
              opacity="0.7"
            />
          </svg>
        )}
        {metric.category && (
          <div style={{ fontSize: "8px", color: "rgba(100,116,139,1)", marginTop: "2px" }}>
            {metric.category}
          </div>
        )}
      </div>
    </Html>
  );
}

// --- Individual metric node ---

function MetricSphere({
  metric,
  position,
  highlighted,
  dimmed,
  onMetricClick,
  onMetricHover,
}: {
  metric: MetricNode;
  position: THREE.Vector3;
  highlighted: boolean;
  dimmed: boolean;
  onMetricClick?: (id: string) => void;
  onMetricHover?: (id: string | null) => void;
}) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const glowRef = React.useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  const statusColor = React.useMemo(() => getStatusColor(metric), [metric]);
  const catColor = React.useMemo(() => new THREE.Color(getCategoryColor(metric.category)), [metric.category]);
  const baseScale = getNodeScale(metric);
  const sphereRadius = 0.18;

  const isCritical = metric.threshold ? metric.value >= metric.threshold.critical : false;
  const isWarn = metric.threshold
    ? metric.value >= metric.threshold.warn && !isCritical
    : false;

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Breathing pulse
    const pulseSpeed = isCritical ? 4 : 2.5;
    const pulseAmount = isCritical ? 0.15 : 0.06;
    const pulse = 1 + Math.sin(t * pulseSpeed * (Math.PI / 1.25)) * pulseAmount;

    const targetScale = (highlighted ? 1.4 : dimmed ? 0.7 : 1) * baseScale * pulse;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );

    // Slow drift
    meshRef.current.position.y =
      position.y + Math.sin(t * 0.4 + position.x * 2) * 0.08;

    // Glow ring
    if (glowRef.current) {
      const glowScale = 1.8 + Math.sin(t * pulseSpeed * (Math.PI / 1.25)) * 0.2;
      glowRef.current.scale.setScalar(glowScale);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = (highlighted ? 0.3 : 0.12) + Math.sin(t * pulseSpeed) * 0.05;
      }
    }
  });

  const handlePointerEnter = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setIsHovered(true);
      onMetricHover?.(metric.id);
      document.body.style.cursor = "pointer";
    },
    [metric.id, onMetricHover]
  );

  const handlePointerLeave = React.useCallback(() => {
    setIsHovered(false);
    onMetricHover?.(null);
    document.body.style.cursor = "auto";
  }, [onMetricHover]);

  const handleClick = React.useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onMetricClick?.(metric.id);
    },
    [metric.id, onMetricClick]
  );

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Core sphere */}
      <mesh
        ref={meshRef}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      >
        <sphereGeometry args={[sphereRadius, 24, 24]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={highlighted ? 1.2 : isCritical ? 0.9 : 0.5}
          transparent
          opacity={dimmed ? 0.4 : 0.9}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Glow ring */}
      <mesh ref={glowRef} scale={1.8}>
        <sphereGeometry args={[sphereRadius, 16, 16]} />
        <meshBasicMaterial
          color={statusColor}
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Pulsing ring for warn/critical */}
      {(isWarn || isCritical) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[sphereRadius * 1.6, sphereRadius * 2.2, 32]} />
          <meshBasicMaterial
            color={statusColor}
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Sparkline halo */}
      {metric.history && metric.history.length > 1 && (
        <SparklineHalo
          history={metric.history}
          color={catColor}
          radius={sphereRadius * 2.5}
        />
      )}

      {/* Hover tooltip */}
      {isHovered && <MetricTooltip metric={metric} color={statusColor} />}
    </group>
  );
}

// --- Connection lines ---

function ConnectionLine({
  from,
  to,
  strength = 0.5,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  strength?: number;
}) {
  return (
    <Line
      points={[
        [from.x, from.y, from.z],
        [to.x, to.y, to.z],
      ]}
      color={NEON.cyan}
      lineWidth={1}
      transparent
      opacity={0.08 + strength * 0.22}
    />
  );
}

/**
 * MetricsGalaxy - A 3D galaxy visualization for system metrics monitoring.
 *
 * Renders metric nodes as pulsing spheres arranged in galaxy, grid, or radial layouts.
 * Supports threshold-based coloring, sparkline halos, connection lines, and interactive tooltips.
 */
export function MetricsGalaxy({
  metrics,
  connections,
  layout = "galaxy",
  onMetricClick,
  onMetricHover,
  highlightedId = null,
  autoRotate = false,
}: MetricsGalaxyProps) {
  const groupRef = React.useRef<THREE.Group>(null);

  const positions = React.useMemo(
    () => computeLayout(metrics, layout),
    [metrics, layout]
  );

  // Auto-rotation
  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Connection lines (render first, behind nodes) */}
      {connections?.map((conn) => {
        const fromPos = positions.get(conn.from);
        const toPos = positions.get(conn.to);
        if (!fromPos || !toPos) return null;
        return (
          <ConnectionLine
            key={`${conn.from}-${conn.to}`}
            from={fromPos}
            to={toPos}
            strength={conn.strength}
          />
        );
      })}

      {/* Metric nodes */}
      {metrics.map((metric) => {
        const pos = positions.get(metric.id);
        if (!pos) return null;
        return (
          <MetricSphere
            key={metric.id}
            metric={metric}
            position={pos}
            highlighted={highlightedId === metric.id}
            dimmed={highlightedId != null && highlightedId !== metric.id}
            onMetricClick={onMetricClick}
            onMetricHover={onMetricHover}
          />
        );
      })}
    </group>
  );
}

MetricsGalaxy.displayName = "MetricsGalaxy";

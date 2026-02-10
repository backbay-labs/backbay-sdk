"use client";

import * as React from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";

// =============================================================================
// TYPES
// =============================================================================

export interface TimeRulerProps {
  curve: THREE.CatmullRomCurve3;
  timeRange: [number, number];
  currentTime: number;
  tickCount?: number;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatTickTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// =============================================================================
// TICK MARK
// =============================================================================

const TICK_STYLE_BASE: React.CSSProperties = {
  fontFamily: "ui-monospace, monospace",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  background: "rgba(2,4,10,0.7)",
  borderRadius: "3px",
  padding: "1px 4px",
};

const TICK_STYLE_CURRENT: React.CSSProperties = {
  ...TICK_STYLE_BASE,
  fontSize: "10px",
  color: "#22D3EE",
  border: "1px solid rgba(34,211,238,0.3)",
  textShadow: "0 0 6px rgba(34,211,238,0.5)",
};

const TICK_STYLE_DEFAULT: React.CSSProperties = {
  ...TICK_STYLE_BASE,
  fontSize: "8px",
  color: "#64748B",
  border: "1px solid rgba(255,255,255,0.04)",
  textShadow: "none",
};

function TickMark({
  position,
  label,
  isCurrent,
}: {
  position: THREE.Vector3;
  label: string;
  isCurrent: boolean;
}) {
  return (
    <group position={position}>
      {/* Vertical tick line */}
      <mesh>
        <boxGeometry args={[0.01, isCurrent ? 0.25 : 0.12, 0.01]} />
        <meshBasicMaterial
          color={isCurrent ? "#22D3EE" : "#64748B"}
          transparent
          opacity={isCurrent ? 1 : 0.5}
        />
      </mesh>

      {/* Label */}
      <Html
        position={[0, isCurrent ? -0.25 : -0.18, 0]}
        center
        distanceFactor={8}
        style={{ pointerEvents: "none" }}
      >
        <span style={isCurrent ? TICK_STYLE_CURRENT : TICK_STYLE_DEFAULT}>
          {label}
        </span>
      </Html>
    </group>
  );
}

// =============================================================================
// TIME RULER
// =============================================================================

export function TimeRuler({
  curve,
  timeRange,
  currentTime,
  tickCount = 10,
}: TimeRulerProps) {
  const [start, end] = timeRange;
  const duration = end - start;

  const ticks = React.useMemo(() => {
    const items: Array<{
      position: THREE.Vector3;
      label: string;
      isCurrent: boolean;
    }> = [];

    for (let i = 0; i <= tickCount; i++) {
      const t = i / tickCount;
      const time = start + t * duration;
      const point = curve.getPointAt(t);
      // Offset slightly below the river
      const pos = new THREE.Vector3(point.x, point.y - 0.4, point.z);
      items.push({
        position: pos,
        // Render labels as elapsed time within the active range.
        label: formatTickTime(time - start),
        isCurrent: false,
      });
    }

    return items;
  }, [curve, start, duration, tickCount]);

  // Current time marker
  const currentMarker = React.useMemo(() => {
    if (duration <= 0) return null;
    const t = Math.max(0, Math.min(1, (currentTime - start) / duration));
    const point = curve.getPointAt(t);
    const pos = new THREE.Vector3(point.x, point.y - 0.4, point.z);
    return {
      position: pos,
      // Render labels as elapsed time within the active range.
      label: formatTickTime(currentTime - start),
      isCurrent: true,
    };
  }, [curve, currentTime, start, duration]);

  return (
    <group>
      {ticks.map((tick, i) => (
        <TickMark
          key={i}
          position={tick.position}
          label={tick.label}
          isCurrent={tick.isCurrent}
        />
      ))}
      {currentMarker && (
        <TickMark
          position={currentMarker.position}
          label={currentMarker.label}
          isCurrent
        />
      )}
    </group>
  );
}

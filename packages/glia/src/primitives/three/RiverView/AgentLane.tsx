"use client";

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  getPointOnRiver,
  laneOffset as computeLaneOffset,
  RIVER_DEFAULTS,
  AGENT_COLORS,
} from "./riverHelpers";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface AgentLaneProps {
  /** The river curve. */
  curve: THREE.CatmullRomCurve3;
  /** This lane's index (0-based). */
  laneIndex: number;
  /** Total number of lanes. */
  totalLanes?: number;
  /** River width. */
  width?: number;
  /** Ribbon colour — defaults to a colour from the neon palette. */
  color?: string;
  /** Whether this lane is actively selected/focused. */
  active?: boolean;
  /** Label shown at the lane origin. */
  agentLabel?: string;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

const LANE_SEGMENTS = 80;

export function AgentLane({
  curve,
  laneIndex,
  totalLanes = RIVER_DEFAULTS.laneCount,
  width = RIVER_DEFAULTS.width,
  color,
  active = false,
  agentLabel,
}: AgentLaneProps) {
  const laneColor = color ?? AGENT_COLORS[laneIndex % AGENT_COLORS.length];

  const lateral = React.useMemo(
    () => computeLaneOffset(laneIndex, totalLanes, width),
    [laneIndex, totalLanes, width],
  );

  // Build THREE.Line objects imperatively to avoid SVG <line> type conflict
  const { mainLine, glowLine } = React.useMemo(() => {
    const positions = new Float32Array((LANE_SEGMENTS + 1) * 3);
    for (let i = 0; i <= LANE_SEGMENTS; i++) {
      const t = i / LANE_SEGMENTS;
      const pt = getPointOnRiver(curve, t, lateral);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y + 0.01; // sit just above river surface
      positions[i * 3 + 2] = pt.z;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mainMat = new THREE.LineBasicMaterial({
      color: laneColor,
      transparent: true,
      opacity: active ? 0.9 : 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const glowMat = new THREE.LineBasicMaterial({
      color: laneColor,
      transparent: true,
      opacity: active ? 0.2 : 0.05,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return {
      mainLine: new THREE.Line(geo, mainMat),
      glowLine: new THREE.Line(geo.clone(), glowMat),
    };
  }, [curve, lateral, laneColor, active]);

  // Label position: start of the lane
  const labelPos = React.useMemo(
    () => getPointOnRiver(curve, 0, lateral),
    [curve, lateral],
  );

  // Animate opacity / brightness based on active state
  useFrame(() => {
    const mainMat = mainLine.material as THREE.LineBasicMaterial;
    mainMat.opacity = active ? 0.9 : 0.35;
    const glowMat = glowLine.material as THREE.LineBasicMaterial;
    glowMat.opacity = active ? 0.2 : 0.05;
  });

  return (
    <group>
      <primitive object={mainLine} />
      <primitive object={glowLine} />

      {/* Agent name label */}
      {agentLabel && (
        <Html
          position={[labelPos.x - 0.4, labelPos.y + 0.15, labelPos.z]}
          center={false}
        >
          <div
            style={{
              background: "rgba(2,4,10,0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "3px",
              padding: "3px 8px",
              fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
              fontSize: "8px",
              fontWeight: active ? 700 : 500,
              color: active ? laneColor : "rgba(255,255,255,0.5)",
              whiteSpace: "nowrap",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              boxShadow: active
                ? `0 0 12px ${laneColor}40`
                : "none",
            }}
          >
            {agentLabel}
          </div>
        </Html>
      )}
    </group>
  );
}

AgentLane.displayName = "AgentLane";

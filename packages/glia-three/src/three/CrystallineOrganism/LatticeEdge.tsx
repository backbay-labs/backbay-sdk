/**
 * LatticeEdge
 *
 * Connection edge between organisms with type-based styling.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { LatticeEdgeProps } from "./types";
import { EDGE_STYLES, CRYSTALLINE_CONFIG } from "./constants";

// Edge colors for different connection types
const EDGE_COLORS = {
  hierarchy: "#00f0ff",     // Cyan - structural
  "data-flow": "#d4a84b",   // Gold - data flow
  dependency: "#ffaa00",    // Amber - dependency
  communication: "#00ff88", // Green - communication
  speculative: "#c4a0ff",   // Purple - speculative
};

export function LatticeEdge({
  edge,
  sourcePosition,
  targetPosition,
}: LatticeEdgeProps) {
  const lineRef = useRef<THREE.Line>(null);
  const style = EDGE_STYLES[edge.type];

  const points = useMemo(() => {
    return [
      new THREE.Vector3(...sourcePosition),
      new THREE.Vector3(...targetPosition),
    ];
  }, [sourcePosition, targetPosition]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  // Get color based on edge type
  const color = useMemo(() => {
    return EDGE_COLORS[edge.type] ?? "#666666";
  }, [edge.type]);

  // Animate pulse for communication edges
  useFrame(({ clock }) => {
    if (!lineRef.current) return;

    if (style.pulseGlow) {
      const t = clock.elapsedTime;
      const opacity = 0.3 + 0.2 * Math.sin(t * 3);
      (lineRef.current.material as THREE.LineBasicMaterial).opacity = opacity;
    }
  });

  return (
    <primitive object={new THREE.Line()} ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={0.4 * edge.strength}
        linewidth={style.lineWidth}
        blending={THREE.AdditiveBlending}
      />
    </primitive>
  );
}

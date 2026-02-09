"use client";

import * as React from "react";
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Line2 } from "three-stdlib";
import type { CausalLinkType, CausalThreadProps } from "./types";

// -----------------------------------------------------------------------------
// Constants — LatticeEdge-style color mapping
// -----------------------------------------------------------------------------

const LINK_TYPE_COLORS: Record<CausalLinkType, string> = {
  direct: "#00f0ff",   // Cyan — structural/direct causation
  indirect: "#d4a84b", // Gold — indirect/data-flow
  temporal: "#ffaa00",  // Amber — temporal dependency
};

const DEFAULT_LINK_TYPE: CausalLinkType = "direct";

// -----------------------------------------------------------------------------
// Single Thread Line — LatticeEdge-style glowing connection
// -----------------------------------------------------------------------------

interface ThreadLineProps {
  from: THREE.Vector3;
  to: THREE.Vector3;
  strength: number;
  linkType: CausalLinkType;
  active: boolean;
  dimmed: boolean;
}

function ThreadLine({ from, to, strength, linkType, active, dimmed }: ThreadLineProps) {
  const lineRef = React.useRef<Line2>(null);
  const color = LINK_TYPE_COLORS[linkType];

  const points = React.useMemo(() => {
    // Slight arc via midpoint lift for visual depth
    const mid = new THREE.Vector3().lerpVectors(from, to, 0.5);
    mid.y += 0.2;
    const curve = new THREE.CatmullRomCurve3([from, mid, to]);
    return curve.getPoints(16).map((p) => [p.x, p.y, p.z] as [number, number, number]);
  }, [from, to]);

  // Animate dash offset (marching-ants) + pulse for temporal links
  useFrame((state, delta) => {
    if (!lineRef.current?.material) return;
    const mat = lineRef.current.material;

    // Marching-ants dash animation
    const speed = linkType === "temporal" ? 1.2 : 0.8;
    mat.dashOffset += delta * speed;

    // Pulse opacity for temporal links
    if (linkType === "temporal" && !dimmed) {
      const baseOpacity = strength * 0.8;
      const pulse = 0.15 * Math.sin(state.clock.elapsedTime * 3);
      const target = active ? Math.min(1, baseOpacity + 0.3 + pulse) : baseOpacity + pulse;
      mat.opacity = Math.max(0.1, target);
    }
  });

  // Higher base opacity (0.4-0.6) with additive blending, like LatticeEdge
  const baseOpacity = 0.4 + strength * 0.2;
  const opacity = dimmed ? baseOpacity * 0.12 : active ? Math.min(1, baseOpacity + 0.3) : baseOpacity;
  const lineWidth = active ? 3.5 : 1.8 + strength * 1.2;

  return (
    <Line
      ref={lineRef}
      points={points}
      color={color}
      transparent
      opacity={opacity}
      lineWidth={lineWidth}
      dashed
      dashSize={0.12}
      gapSize={0.08}
      dashScale={1.5}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  );
}

// -----------------------------------------------------------------------------
// CausalThread
// -----------------------------------------------------------------------------

export function CausalThread({
  links,
  actionPositions,
  selectedActionId,
}: CausalThreadProps) {
  // Build a set of IDs connected to the selected action for highlighting
  const connectedIds = React.useMemo(() => {
    if (!selectedActionId) return null;
    const ids = new Set<string>();
    ids.add(selectedActionId);
    links.forEach((link) => {
      if (link.fromId === selectedActionId || link.toId === selectedActionId) {
        ids.add(link.fromId);
        ids.add(link.toId);
      }
    });
    return ids;
  }, [links, selectedActionId]);

  return (
    <group>
      {links.map((link) => {
        const fromPos = actionPositions.get(link.fromId);
        const toPos = actionPositions.get(link.toId);
        if (!fromPos || !toPos) return null;

        const isActiveLink =
          selectedActionId != null &&
          (link.fromId === selectedActionId || link.toId === selectedActionId);

        const isDimmed =
          selectedActionId != null &&
          connectedIds != null &&
          !connectedIds.has(link.fromId) &&
          !connectedIds.has(link.toId);

        return (
          <ThreadLine
            key={`${link.fromId}-${link.toId}`}
            from={fromPos}
            to={toPos}
            strength={link.strength}
            linkType={link.type ?? DEFAULT_LINK_TYPE}
            active={isActiveLink}
            dimmed={isDimmed}
          />
        );
      })}
    </group>
  );
}

CausalThread.displayName = "CausalThread";

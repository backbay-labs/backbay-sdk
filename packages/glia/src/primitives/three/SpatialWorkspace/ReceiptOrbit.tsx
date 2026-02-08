"use client";

/**
 * ReceiptOrbit - Status ring visualization for receipts
 *
 * Displays receipt status as colored arc segments in a ring around
 * the parent entity. Each segment's arc length is proportional to
 * the count of receipts in that status.
 *
 * Colors: passed=#00ff88, failed=#ff0055, pending=#00f0ff
 */

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Receipt, ReceiptStatus } from "@backbay/contract";
import { RECEIPT_VISUALS } from "./types";
import type { ReceiptOrbitProps, TopologySlice } from "./types";

// -----------------------------------------------------------------------------
// Status Counts Type
// -----------------------------------------------------------------------------

interface StatusCounts {
  passed: number;
  failed: number;
  pending: number;
}

// -----------------------------------------------------------------------------
// Arc Segment Component
// -----------------------------------------------------------------------------

interface ArcSegmentProps {
  innerRadius: number;
  outerRadius: number;
  thetaStart: number;
  thetaLength: number;
  color: string;
  opacity: number;
  emissiveIntensity: number;
  pulse?: boolean;
}

function ArcSegment({
  innerRadius,
  outerRadius,
  thetaStart,
  thetaLength,
  color,
  opacity,
  emissiveIntensity,
  pulse = false,
}: ArcSegmentProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const baseIntensity = emissiveIntensity;

  useFrame((state) => {
    if (!meshRef.current || !pulse) return;

    // Pulse the emissive intensity for failed segments
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    const pulseValue = Math.sin(state.clock.elapsedTime * 3) * 0.3 + 0.7;
    material.emissiveIntensity = baseIntensity * pulseValue;
  });

  const colorObj = new THREE.Color(color);

  // Don't render if arc length is effectively zero
  if (thetaLength < 0.01) return null;

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry
        args={[innerRadius, outerRadius, 32, 1, thetaStart, thetaLength]}
      />
      <meshStandardMaterial
        color={colorObj}
        transparent
        opacity={opacity}
        emissive={colorObj}
        emissiveIntensity={emissiveIntensity}
        side={THREE.DoubleSide}
        metalness={0.3}
        roughness={0.5}
      />
    </mesh>
  );
}

// -----------------------------------------------------------------------------
// Status Ring Component
// -----------------------------------------------------------------------------

interface StatusRingProps {
  counts: StatusCounts;
  total: number;
  radius: number;
  thickness?: number;
}

function StatusRing({
  counts,
  total,
  radius,
  thickness = 0.05,
}: StatusRingProps) {
  const innerRadius = radius - thickness;
  const outerRadius = radius + thickness;

  // Calculate arc angles for each status
  // Order: passed first (starts at 0), then pending, then failed
  const passedLength = total > 0 ? (counts.passed / total) * Math.PI * 2 : 0;
  const pendingLength = total > 0 ? (counts.pending / total) * Math.PI * 2 : 0;
  const failedLength = total > 0 ? (counts.failed / total) * Math.PI * 2 : 0;

  const passedStart = 0;
  const pendingStart = passedLength;
  const failedStart = passedLength + pendingLength;

  return (
    <group>
      {/* Passed segment */}
      {counts.passed > 0 && (
        <ArcSegment
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          thetaStart={passedStart}
          thetaLength={passedLength}
          color={RECEIPT_VISUALS.passed.color}
          opacity={0.7}
          emissiveIntensity={0.3}
        />
      )}

      {/* Pending segment */}
      {counts.pending > 0 && (
        <ArcSegment
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          thetaStart={pendingStart}
          thetaLength={pendingLength}
          color={RECEIPT_VISUALS.pending.color}
          opacity={0.5}
          emissiveIntensity={0.2}
        />
      )}

      {/* Failed segment - with pulse effect */}
      {counts.failed > 0 && (
        <ArcSegment
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          thetaStart={failedStart}
          thetaLength={failedLength}
          color={RECEIPT_VISUALS.failed.color}
          opacity={0.8}
          emissiveIntensity={0.5}
          pulse
        />
      )}

      {/* Subtle glow ring behind the segments */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[innerRadius - 0.02, outerRadius + 0.02, 64]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// -----------------------------------------------------------------------------
// Status Tooltip Component
// -----------------------------------------------------------------------------

interface StatusTooltipProps {
  counts: StatusCounts;
  total: number;
}

function StatusTooltip({ counts, total }: StatusTooltipProps) {
  return (
    <Html center style={{ pointerEvents: "none" }}>
      <div className="bg-[rgba(2,4,10,0.85)] backdrop-blur-xl text-white text-xs px-3 py-2 rounded font-mono whitespace-nowrap border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <div className="text-white/60 mb-1 text-center">
          {total} receipt{total !== 1 ? "s" : ""}
        </div>
        <div className="flex gap-3">
          {counts.passed > 0 && (
            <span style={{ color: RECEIPT_VISUALS.passed.color }}>
              {counts.passed} passed
            </span>
          )}
          {counts.failed > 0 && (
            <span style={{ color: RECEIPT_VISUALS.failed.color }}>
              {counts.failed} failed
            </span>
          )}
          {counts.pending > 0 && (
            <span style={{ color: RECEIPT_VISUALS.pending.color }}>
              {counts.pending} pending
            </span>
          )}
        </div>
      </div>
    </Html>
  );
}

// -----------------------------------------------------------------------------
// Receipt Orbit Container
// -----------------------------------------------------------------------------

export function ReceiptOrbit({
  receipts,
  parentPosition,
  orbitRadius = 0.6,
  selectedIds = [],
  hoveredId = null,
  onReceiptClick,
  onReceiptHover,
  onTopologyChange,
  origin = [0, 0, 0],
}: ReceiptOrbitProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  // Calculate status counts
  const statusCounts = React.useMemo<StatusCounts>(
    () => ({
      passed: receipts.filter((r) => r.status === "passed").length,
      failed: receipts.filter((r) => r.status === "failed").length,
      pending: receipts.filter((r) => r.status === "pending").length,
    }),
    [receipts]
  );

  // Report topology - simplified to single receipt-ring node
  const topologySlice = React.useMemo<TopologySlice>(() => {
    if (receipts.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Determine dominant status for ring color
    const dominantStatus: ReceiptStatus =
      statusCounts.failed > 0
        ? "failed"
        : statusCounts.passed === receipts.length
          ? "passed"
          : "pending";

    const ringPosition: [number, number, number] = [
      parentPosition[0] + origin[0],
      parentPosition[1] + origin[1],
      parentPosition[2] + origin[2],
    ];

    const nodes = [
      {
        id: `receipt-ring-${receipts[0]?.job_id ?? "unknown"}`,
        type: "receipt-ring",
        label: `${receipts.length} receipts`,
        position: ringPosition,
        radius: orbitRadius,
        color: RECEIPT_VISUALS[dominantStatus].color,
        meta: {
          counts: statusCounts,
          receiptIds: receipts.map((r) => r.id),
        },
      },
    ];

    // Edge from job to the receipt ring
    const edges = receipts[0]?.job_id
      ? [
          {
            id: `receipt-ring-${receipts[0].job_id}-edge`,
            from: receipts[0].job_id,
            to: `receipt-ring-${receipts[0].job_id}`,
            type: "receipt-ring-for-job",
            color: RECEIPT_VISUALS[dominantStatus].color,
          },
        ]
      : [];

    return { nodes, edges };
  }, [receipts, statusCounts, orbitRadius, parentPosition, origin]);

  React.useEffect(() => {
    if (!onTopologyChange) return;
    onTopologyChange(topologySlice);
  }, [onTopologyChange, topologySlice]);

  // Handle pointer out
  const handlePointerOut = React.useCallback(() => {
    setIsHovered(false);
    document.body.style.cursor = "auto";
    if (onReceiptHover) {
      onReceiptHover(null);
    }
  }, [onReceiptHover]);

  if (receipts.length === 0) return null;

  // Check if any receipt is selected
  const hasSelection = selectedIds.some((id) =>
    receipts.some((r) => r.id === id)
  );

  return (
    <group position={parentPosition}>
      {/* Invisible interaction mesh for hover/click */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          if (onReceiptClick && receipts.length > 0) {
            onReceiptClick(receipts[0]);
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
          document.body.style.cursor = "pointer";
          if (onReceiptHover && receipts.length > 0) {
            onReceiptHover(receipts[0]);
          }
        }}
        onPointerOut={handlePointerOut}
      >
        <ringGeometry args={[orbitRadius - 0.1, orbitRadius + 0.1, 64]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* Status ring with segments */}
      <StatusRing
        counts={statusCounts}
        total={receipts.length}
        radius={orbitRadius}
      />

      {/* Selection indicator */}
      {hasSelection && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[orbitRadius - 0.12, orbitRadius + 0.12, 64]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Hover tooltip */}
      {isHovered && (
        <group position={[0, 0.3, 0]}>
          <StatusTooltip counts={statusCounts} total={receipts.length} />
        </group>
      )}
    </group>
  );
}

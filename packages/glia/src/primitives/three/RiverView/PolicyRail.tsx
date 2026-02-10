"use client";

import * as React from "react";
import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PolicyRailProps, PolicySegment } from "./types";
import { POLICY_SEGMENT_COLORS } from "./types";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const WALL_HEIGHT = 0.6;
const CURVE_SAMPLES = 24;
const GAP_MARKER_SPACING = 0.08;
const ARC_INNER_OFFSET = 0.04;
const ARC_OUTER_OFFSET = 0.08;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function sampleCurveEdge(
  curve: THREE.CatmullRomCurve3,
  startT: number,
  endT: number,
  side: "left" | "right",
  riverWidth: number,
  samples: number,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const halfWidth = riverWidth / 2;
  const sign = side === "left" ? -1 : 1;

  for (let i = 0; i <= samples; i++) {
    const t = startT + (endT - startT) * (i / samples);
    const clamped = Math.max(0, Math.min(1, t));

    const pt = curve.getPointAt(clamped);
    const tangent = curve.getTangentAt(clamped);
    // Perpendicular on XZ plane
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    points.push(
      new THREE.Vector3(
        pt.x + normal.x * halfWidth * sign,
        pt.y,
        pt.z + normal.z * halfWidth * sign,
      ),
    );
  }

  return points;
}

// -----------------------------------------------------------------------------
// Edge Wireframe — CrystallineOrganism-style wireframe glow
// -----------------------------------------------------------------------------

interface EdgeWireframeProps {
  geometry: THREE.BufferGeometry;
  color: string;
}

function EdgeWireframe({ geometry, color }: EdgeWireframeProps) {
  const edgesGeo = React.useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  return (
    <lineSegments geometry={edgesGeo}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}

// -----------------------------------------------------------------------------
// Policy Arc Segment — ReceiptOrbit-style arc at wall base
// -----------------------------------------------------------------------------

interface PolicyArcProps {
  center: THREE.Vector3;
  thetaStart: number;
  thetaLength: number;
  color: string;
  pulse?: boolean;
}

function PolicyArc({ center, thetaStart, thetaLength, color, pulse = false }: PolicyArcProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current || !pulse) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.3 + 0.2 * Math.sin(state.clock.elapsedTime * 3);
  });

  if (thetaLength < 0.01) return null;

  return (
    <mesh
      ref={meshRef}
      position={[center.x, center.y + 0.01, center.z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[ARC_INNER_OFFSET, ARC_OUTER_OFFSET, 32, 1, thetaStart, thetaLength]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.6}
        emissive={color}
        emissiveIntensity={0.3}
        side={THREE.DoubleSide}
        metalness={0.3}
        roughness={0.5}
      />
    </mesh>
  );
}

// -----------------------------------------------------------------------------
// Single Segment — Glass wall with wireframe + arc
// -----------------------------------------------------------------------------

interface SegmentWallProps {
  segment: PolicySegment;
  curve: THREE.CatmullRomCurve3;
  riverWidth: number;
  side: "left" | "right";
}

function SegmentWall({ segment, curve, riverWidth, side }: SegmentWallProps) {
  const wallRef = React.useRef<THREE.Mesh>(null);
  const color = POLICY_SEGMENT_COLORS[segment.type];
  const isHardDeny = segment.type === "hard-deny";

  const needsWallGeometry = !segment.coverageGap && segment.type !== "record-only";

  const edgePoints = React.useMemo(
    () => sampleCurveEdge(curve, segment.startT, segment.endT, side, riverWidth, CURVE_SAMPLES),
    [curve, segment.startT, segment.endT, side, riverWidth],
  );

  // Emissive pulse for hard-deny segments (like ReceiptOrbit failed state)
  useFrame((state) => {
    if (!wallRef.current || !isHardDeny) return;
    const mat = wallRef.current.material as THREE.MeshPhysicalMaterial;
    mat.emissiveIntensity = 0.5 + 0.3 * Math.sin(state.clock.elapsedTime * 3);
  });

  const geometry = React.useMemo(() => {
    if (!needsWallGeometry) return null;

    const positions: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < edgePoints.length; i++) {
      const p = edgePoints[i];
      // Bottom vertex
      positions.push(p.x, p.y, p.z);
      // Top vertex
      positions.push(p.x, p.y + WALL_HEIGHT, p.z);
    }

    for (let i = 0; i < edgePoints.length - 1; i++) {
      const bl = i * 2;
      const tl = i * 2 + 1;
      const br = (i + 1) * 2;
      const tr = (i + 1) * 2 + 1;
      // Two triangles per quad
      indices.push(bl, br, tl);
      indices.push(tl, br, tr);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [edgePoints, needsWallGeometry]);

  // Coverage gap: render small warning markers instead of a wall
  if (segment.coverageGap) {
    const gapPoints = edgePoints.filter((_, i) => i % 3 === 0);
    return (
      <group>
        {gapPoints.map((pt, i) => (
          <mesh key={i} position={[pt.x, pt.y + 0.15, pt.z]}>
            <sphereGeometry args={[GAP_MARKER_SPACING, 8, 8]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.1}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    );
  }

  // Record-only: dim dashed line with additive blending
  if (segment.type === "record-only") {
    const linePoints = edgePoints.map(
      (p) => [p.x, p.y + WALL_HEIGHT * 0.5, p.z] as [number, number, number],
    );
    return (
      <Line
        points={linePoints}
        color={color}
        transparent
        opacity={0.4}
        lineWidth={1.2}
        dashed
        dashSize={0.15}
        gapSize={0.12}
        dashScale={1.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    );
  }

  // Hard-deny or soft: glass wall with meshPhysicalMaterial + wireframe + arc
  const wallOpacity = isHardDeny ? 0.6 : 0.25;

  // Label position at midpoint of segment
  const midIdx = Math.floor(edgePoints.length / 2);
  const midPt = edgePoints[midIdx];

  // Arc proportional to policy coverage (segment span)
  const arcLength = (segment.endT - segment.startT) * Math.PI * 2;
  const arcStart = segment.startT * Math.PI * 2;

  return (
    <group>
      {/* Glass wall — meshPhysicalMaterial with transmission */}
      <mesh ref={wallRef} geometry={geometry!}>
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHardDeny ? 0.5 : 0.2}
          roughness={0.2}
          metalness={0.2}
          transparent
          opacity={wallOpacity}
          side={THREE.DoubleSide}
          transmission={isHardDeny ? 0.3 : 0.5}
          ior={1.5}
        />
      </mesh>

      {/* CrystallineOrganism-style edge wireframe glow */}
      <EdgeWireframe geometry={geometry!} color={color} />

      {/* ReceiptOrbit-style arc at wall base */}
      {midPt && (
        <PolicyArc
          center={midPt}
          thetaStart={arcStart}
          thetaLength={arcLength}
          color={color}
          pulse={isHardDeny}
        />
      )}

      {/* Segment label */}
      {midPt && (
        <Html
          distanceFactor={12}
          position={[midPt.x, midPt.y + WALL_HEIGHT + 0.2, midPt.z]}
        >
          <div
            style={{
              background: "rgba(2, 4, 10, 0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "3px",
              padding: "2px 6px",
              fontFamily: "monospace",
              fontSize: "8px",
              color: color,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
              pointerEvents: "none" as const,
              whiteSpace: "nowrap",
            }}
          >
            {segment.label}
          </div>
        </Html>
      )}
    </group>
  );
}

// -----------------------------------------------------------------------------
// PolicyRail
// -----------------------------------------------------------------------------

export function PolicyRail({ segments, curve, riverWidth }: PolicyRailProps) {
  return (
    <group>
      {segments.map((segment) => {
        if (segment.side === "both") {
          return (
            <React.Fragment key={segment.id}>
              <SegmentWall segment={segment} curve={curve} riverWidth={riverWidth} side="left" />
              <SegmentWall segment={segment} curve={curve} riverWidth={riverWidth} side="right" />
            </React.Fragment>
          );
        }
        return (
          <SegmentWall
            key={segment.id}
            segment={segment}
            curve={curve}
            riverWidth={riverWidth}
            side={segment.side}
          />
        );
      })}
    </group>
  );
}

PolicyRail.displayName = "PolicyRail";

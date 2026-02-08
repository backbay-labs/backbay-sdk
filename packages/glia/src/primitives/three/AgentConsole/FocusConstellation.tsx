"use client";

/**
 * FocusConstellation - Ring of context/focus nodes
 *
 * 3D visualization of contextual items orbiting the agent avatar.
 * Each node represents a relevant entity, action, or context item.
 */

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { FocusConstellationProps, FocusNode, FocusNodeKind } from "./types";
import { FOCUS_NODE_COLORS, FOCUS_NODE_SHAPES } from "./types";

// -----------------------------------------------------------------------------
// Node Shape Components
// -----------------------------------------------------------------------------

interface NodeShapeProps {
  kind: FocusNodeKind;
  size: number;
}

function NodeShape({ kind, size }: NodeShapeProps) {
  const shape = FOCUS_NODE_SHAPES[kind];

  switch (shape) {
    case "box":
      return <boxGeometry args={[size, size, size]} />;
    case "octahedron":
      return <octahedronGeometry args={[size * 0.7, 0]} />;
    case "diamond":
      return <octahedronGeometry args={[size * 0.6, 0]} />;
    case "sphere":
    default:
      return <sphereGeometry args={[size * 0.5, 16, 16]} />;
  }
}

// -----------------------------------------------------------------------------
// Single Focus Node
// -----------------------------------------------------------------------------

interface FocusNodeMeshProps {
  node: FocusNode;
  position: THREE.Vector3;
  isFocused: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

function FocusNodeMesh({
  node,
  position,
  isFocused,
  isHovered,
  onClick,
  onHover,
}: FocusNodeMeshProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const unreadRef = React.useRef<THREE.Mesh>(null);

  const color = new THREE.Color(FOCUS_NODE_COLORS[node.kind]);
  const importance = node.importance ?? 0.5;
  const baseSize = 0.08 + importance * 0.06;

  // Animation
  useFrame((state) => {
    if (!meshRef.current) return;

    const t = state.clock.elapsedTime;

    // Gentle rotation
    meshRef.current.rotation.y = t * 0.5;
    meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;

    // Scale based on state
    const targetScale = isFocused ? 1.4 : isHovered ? 1.2 : 1;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );

    // Unread indicator pulse
    if (unreadRef.current && node.hasUnread) {
      const pulse = Math.sin(t * 4) * 0.3 + 0.7;
      unreadRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group position={position}>
      {/* Main node */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          onHover(false);
          document.body.style.cursor = "auto";
        }}
      >
        <NodeShape kind={node.kind} size={baseSize} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isFocused ? 0.5 : isHovered ? 0.3 : 0.15}
          metalness={0.6}
          roughness={0.4}
          transparent
          opacity={isFocused ? 1 : 0.8}
        />
      </mesh>

      {/* Unread indicator */}
      {node.hasUnread && (
        <mesh ref={unreadRef} position={[baseSize * 0.8, baseSize * 0.8, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      )}

      {/* Focus ring */}
      {isFocused && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseSize * 1.2, baseSize * 1.4, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Hover tooltip */}
      {isHovered && (
        <Html
          position={[0, baseSize + 0.15, 0]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div className="bg-[rgba(2,4,10,0.85)] backdrop-blur-xl border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] px-2 py-1 rounded text-xs font-mono whitespace-nowrap">
            <div style={{ color: FOCUS_NODE_COLORS[node.kind] }}>
              {node.label}
            </div>
            {node.description && (
              <div className="text-white/50 text-[10px] max-w-[150px] truncate">
                {node.description}
              </div>
            )}
            <div className="text-white/30 text-[10px] uppercase tracking-wider">{node.kind}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// -----------------------------------------------------------------------------
// Connection Lines
// -----------------------------------------------------------------------------

interface ConnectionLinesProps {
  nodes: FocusNode[];
  positions: Map<string, THREE.Vector3>;
  focusedId: string | null;
}

function ConnectionLines({ nodes, positions, focusedId }: ConnectionLinesProps) {
  // Create lines from center to each node
  return (
    <group>
      {nodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos) return null;

        const isFocused = node.id === focusedId;
        const color = FOCUS_NODE_COLORS[node.kind];

        const points = [new THREE.Vector3(0, 0, 0), pos];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <line key={`line-${node.id}`}>
            <primitive object={lineGeometry} attach="geometry" />
            <lineBasicMaterial
              color={color}
              transparent
              opacity={isFocused ? 0.4 : 0.1}
            />
          </line>
        );
      })}
    </group>
  );
}

// -----------------------------------------------------------------------------
// Focus Constellation Container
// -----------------------------------------------------------------------------

export function FocusConstellation({
  nodes,
  focusedId = null,
  onNodeClick,
  onNodeHover,
  radius = 1.2,
  position = [0, 0, 0],
}: FocusConstellationProps) {
  const groupRef = React.useRef<THREE.Group>(null);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  // Calculate node positions in a ring
  const nodePositions = React.useMemo(() => {
    const positions = new Map<string, THREE.Vector3>();

    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * Math.PI * 2 - Math.PI / 2;
      const importance = node.importance ?? 0.5;
      // More important nodes slightly closer
      const r = radius * (1 - importance * 0.1);

      positions.set(
        node.id,
        new THREE.Vector3(
          Math.cos(angle) * r,
          0,
          Math.sin(angle) * r
        )
      );
    });

    return positions;
  }, [nodes, radius]);

  // Slow rotation of the entire constellation
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  if (nodes.length === 0) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* Connection lines */}
      <ConnectionLines
        nodes={nodes}
        positions={nodePositions}
        focusedId={focusedId}
      />

      {/* Orbit ring indicator */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.02, radius + 0.02, 64]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Focus nodes */}
      {nodes.map((node) => {
        const pos = nodePositions.get(node.id);
        if (!pos) return null;

        return (
          <FocusNodeMesh
            key={node.id}
            node={node}
            position={pos}
            isFocused={focusedId === node.id}
            isHovered={hoveredId === node.id}
            onClick={() => onNodeClick?.(node.id)}
            onHover={(hovered) => {
              setHoveredId(hovered ? node.id : null);
              onNodeHover?.(hovered ? node.id : null);
            }}
          />
        );
      })}
    </group>
  );
}

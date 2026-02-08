"use client";

import * as React from "react";
import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { layoutForce, layoutRing } from "../Graph3D/utils";
import type { GraphEdge, GraphNode } from "../Graph3D/types";
import {
  NETWORK_EDGE_STATUS_COLORS,
  NETWORK_NODE_LABELS,
  NETWORK_NODE_STATUS_COLORS,
  NETWORK_PROTOCOL_COLORS,
  NETWORK_THEME_COLORS,
  type NetworkEdge,
  type NetworkNode,
  type NetworkNodeType,
  type NetworkTopologyProps,
} from "./types";

const NODE_SIZE_BY_TYPE: Record<NetworkNodeType, number> = {
  server: 0.45,
  workstation: 0.35,
  router: 0.4,
  firewall: 0.48,
  cloud: 0.5,
  iot: 0.28,
  mobile: 0.32,
};

function getNodeGeometry(type: NetworkNodeType) {
  switch (type) {
    case "server":
      return <boxGeometry args={[1.1, 1.4, 0.9]} />;
    case "workstation":
      return <boxGeometry args={[1.1, 0.7, 0.9]} />;
    case "router":
      return <cylinderGeometry args={[0.7, 0.7, 0.5, 12]} />;
    case "firewall":
      return <cylinderGeometry args={[0.8, 0.8, 0.35, 6]} />;
    case "cloud":
      return <sphereGeometry args={[0.7, 20, 20]} />;
    case "iot":
      return <icosahedronGeometry args={[0.5, 0]} />;
    case "mobile":
      return <boxGeometry args={[0.55, 1.2, 0.2]} />;
    default:
      return <sphereGeometry args={[0.5, 16, 16]} />;
  }
}

function layoutHierarchical(nodes: NetworkNode[]): Map<string, THREE.Vector3> {
  const layerMap: Record<NetworkNodeType, number> = {
    router: 2.4,
    firewall: 2.0,
    cloud: 1.6,
    server: 0.6,
    workstation: -0.6,
    mobile: -1.4,
    iot: -1.8,
  };

  const grouped = new Map<number, NetworkNode[]>();
  nodes.forEach((node) => {
    const layer = layerMap[node.type] ?? 0;
    const list = grouped.get(layer) ?? [];
    list.push(node);
    grouped.set(layer, list);
  });

  const positions = new Map<string, THREE.Vector3>();
  const spacing = 1.2;

  Array.from(grouped.entries()).forEach(([layer, layerNodes]) => {
    const columns = Math.max(1, Math.ceil(Math.sqrt(layerNodes.length)));
    const rows = Math.ceil(layerNodes.length / columns);

    layerNodes.forEach((node, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const x = (col - (columns - 1) / 2) * spacing;
      const z = (row - (rows - 1) / 2) * spacing;
      positions.set(node.id, new THREE.Vector3(x, layer, z));
    });
  });

  return positions;
}

function resolvePositions(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  layout: NetworkTopologyProps["layout"]
) {
  const layoutNodes: GraphNode[] = nodes.map((node) => ({
    id: node.id,
    label: node.hostname,
    category: node.type,
    positionHint: node.position,
  }));
  const layoutEdges: GraphEdge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
  }));

  let positions: Map<string, THREE.Vector3>;

  switch (layout) {
    case "hierarchical":
      positions = layoutHierarchical(nodes);
      break;
    case "radial":
      positions = layoutRing(layoutNodes, { radius: 4.2 });
      break;
    case "geographic":
      positions = layoutRing(layoutNodes, { radius: 4 });
      break;
    case "force":
    default:
      positions = layoutForce(layoutNodes, layoutEdges, {
        radius: 4,
        spacing: 1.4,
        iterations: 80,
        repelStrength: 7,
      });
      break;
  }

  nodes.forEach((node) => {
    if (node.position) {
      positions.set(node.id, new THREE.Vector3(...node.position));
    }
  });

  return positions;
}

interface NodeMeshProps {
  node: NetworkNode;
  position: THREE.Vector3;
  isSelected: boolean;
  isHighlighted: boolean;
  showLabels: boolean;
  theme: NonNullable<NetworkTopologyProps["theme"]>;
  onClick?: (node: NetworkNode) => void;
}

function NodeMesh({
  node,
  position,
  isSelected,
  isHighlighted,
  showLabels,
  theme,
  onClick,
}: NodeMeshProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const haloRef = React.useRef<THREE.Mesh>(null);

  const baseSize = NODE_SIZE_BY_TYPE[node.type] ?? 0.4;
  const statusColors = NETWORK_NODE_STATUS_COLORS[node.status];
  const themeColors = NETWORK_THEME_COLORS[theme];

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    let pulse = 1;
    if (node.status === "compromised") {
      pulse = 1 + Math.sin(t * 4) * 0.15;
    } else if (node.status === "warning") {
      pulse = 1 + Math.sin(t * 2.2) * 0.08;
    } else if (node.status === "healthy") {
      pulse = 1 + Math.sin(t * 0.8) * 0.02;
    }

    meshRef.current.scale.setScalar(baseSize * pulse);

    if (haloRef.current) {
      const haloPulse = 1 + Math.sin(t * 2.5) * 0.08;
      haloRef.current.scale.setScalar(haloPulse);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(node);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
        scale={[baseSize, baseSize, baseSize]}
      >
        {getNodeGeometry(node.type)}
        <meshStandardMaterial
          color={statusColors.base}
          emissive={statusColors.glow}
          emissiveIntensity={node.status === "offline" ? 0.1 : 0.6}
          roughness={0.3}
          metalness={0.6}
          transparent
          opacity={node.status === "offline" ? 0.35 : 0.9}
        />
      </mesh>

      {(isSelected || isHighlighted || node.status === "compromised") && (
        <mesh ref={haloRef}>
          <sphereGeometry args={[baseSize * 1.8, 24, 24]} />
          <meshBasicMaterial
            color={statusColors.glow}
            transparent
            opacity={isSelected ? 0.2 : 0.12}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {showLabels && (
        <Html distanceFactor={10} position={[0, baseSize * 1.4, 0]}>
          <div
            className="rounded-md border px-2 py-1 text-[10px] uppercase text-white/80 shadow-lg"
            style={{
              background: "rgba(2, 4, 10, 0.85)",
              backdropFilter: "blur(24px)",
              color: statusColors.text,
              borderColor: "rgba(255,255,255,0.06)",
              boxShadow: `0 0 12px ${themeColors.glow}22, inset 0 1px 0 rgba(255,255,255,0.02)`,
            }}
          >
            <div className="font-semibold">{node.hostname}</div>
            <div className="text-[9px] opacity-70">
              {NETWORK_NODE_LABELS[node.type]} • {node.ip}
            </div>
          </div>
        </Html>
      )}

      {node.vulnerabilities && node.vulnerabilities > 0 && (
        <Html distanceFactor={12} position={[0.5, baseSize * 1.2, 0]}>
          <div className="rounded-full bg-rose-500/60 backdrop-blur-xl border border-rose-500/20 px-2 py-0.5 text-[9px] font-semibold text-white shadow-[0_0_8px_rgba(244,63,94,0.3)]">
            {node.vulnerabilities}
          </div>
        </Html>
      )}

      {node.status === "compromised" && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseSize * 1.3, baseSize * 1.45, 32]} />
          <meshBasicMaterial
            color={statusColors.glow}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

    </group>
  );
}

interface TrafficStreamProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
  speed: number;
  count: number;
}

function TrafficStream({ start, end, color, speed, count }: TrafficStreamProps) {
  const meshRefs = React.useRef<(THREE.Mesh | null)[]>([]);
  const offsets = React.useMemo(
    () => new Array(count).fill(0).map(() => Math.random()),
    [count]
  );

  const lineData = React.useMemo(() => {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    if (length > 0) {
      direction.normalize();
    }
    return { direction, length };
  }, [start, end]);

  useFrame(({ clock }) => {
    if (lineData.length <= 0) return;
    const t = clock.elapsedTime * speed;

    offsets.forEach((offset, index) => {
      const mesh = meshRefs.current[index];
      if (!mesh) return;
      const progress = (t + offset) % 1;
      const pos = lineData.direction
        .clone()
        .multiplyScalar(lineData.length * progress)
        .add(start);
      mesh.position.copy(pos);
    });
  });

  return (
    <group>
      {offsets.map((offset, index) => (
        <mesh
          key={`${offset}-${index}`}
          ref={(mesh) => {
            meshRefs.current[index] = mesh;
          }}
        >
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.9}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

export function NetworkTopology({
  nodes,
  edges,
  layout = "force",
  highlightPath = [],
  selectedNode,
  onNodeClick,
  onEdgeClick,
  showTraffic = true,
  showLabels = true,
  theme = "cyber",
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: NetworkTopologyProps) {
  const positions = React.useMemo(
    () => resolvePositions(nodes, edges, layout),
    [nodes, edges, layout]
  );

  const highlightSet = React.useMemo(() => new Set(highlightPath), [highlightPath]);
  return (
    <group position={position} rotation={rotation}>
      {edges.map((edge) => {
        const start = positions.get(edge.source);
        const end = positions.get(edge.target);
        if (!start || !end) return null;

        const isHighlighted = highlightSet.has(edge.source) && highlightSet.has(edge.target);
        const statusColor = NETWORK_EDGE_STATUS_COLORS[edge.status];
        const protocolColor = NETWORK_PROTOCOL_COLORS[edge.protocol];
        const baseColor = edge.status === "active" ? protocolColor : statusColor;
        const lineColor = isHighlighted ? "#ff3344" : baseColor;
        const isBlocked = edge.status === "blocked";
        const isSuspicious = edge.status === "suspicious";
        const shouldDashed = !edge.encrypted || isBlocked || isSuspicious;

        return (
          <group key={edge.id}>
            <Line
              points={[start, end]}
              color={lineColor}
              transparent
              opacity={isHighlighted ? 0.9 : edge.status === "idle" ? 0.2 : 0.65}
              lineWidth={isHighlighted ? 2.5 : 1.5}
              dashed={shouldDashed}
              dashScale={isSuspicious ? 2.2 : 1.4}
              dashSize={0.2}
              gapSize={0.16}
              onClick={(event) => {
                event.stopPropagation();
                onEdgeClick?.(edge);
              }}
            />

            {showTraffic && edge.status !== "blocked" && (
              <TrafficStream
                start={start}
                end={end}
                color={lineColor}
                speed={edge.bandwidth ? Math.min(2.5, edge.bandwidth / 4000) : 0.8}
                count={edge.bandwidth ? Math.min(6, 2 + Math.floor(edge.bandwidth / 2000)) : 3}
              />
            )}
          </group>
        );
      })}

      {nodes.map((node) => {
        const positionVector = positions.get(node.id);
        if (!positionVector) return null;

        const isHighlighted = highlightSet.has(node.id);
        return (
          <NodeMesh
            key={node.id}
            node={node}
            position={positionVector}
            isSelected={selectedNode === node.id}
            isHighlighted={isHighlighted}
            showLabels={showLabels}
            theme={theme}
            onClick={onNodeClick}
          />
        );
      })}
    </group>
  );
}

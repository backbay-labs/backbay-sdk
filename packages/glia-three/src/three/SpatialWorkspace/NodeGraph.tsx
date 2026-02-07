"use client";

/**
 * NodeGraph - 3D visualization of network nodes
 *
 * Operator, fab, verifier, and relay nodes displayed as CrystallineOrganisms
 * with emotion-driven visuals based on node status and trust tier.
 */

import * as React from "react";
import * as THREE from "three";
import type { Node, NodeType } from "@backbay/contract";
import { NODE_VISUALS } from "./types";
import type { NodeGraphProps } from "./types";
import { CrystallineOrganism } from "../CrystallineOrganism";
import { nodeAdapter } from "./adapters";

// Deterministic hash function for stable positioning
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

// -----------------------------------------------------------------------------
// Single Network Node
// -----------------------------------------------------------------------------

interface NetworkNodeProps {
  node: Node;
  position: THREE.Vector3;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

function NetworkNode({ node, position, isSelected, isHovered, onClick, onHover }: NetworkNodeProps) {
  // Convert node to CrystallineOrganism props via adapter
  const organismProps = nodeAdapter.toOrganism(node);

  return (
    <CrystallineOrganism
      {...organismProps}
      position={[position.x, position.y, position.z]}
      selected={isSelected}
      hovered={isHovered}
      onSelect={() => onClick()}
      onHover={(id) => onHover(id !== null)}
    />
  );
}

// -----------------------------------------------------------------------------
// Node Graph Container
// -----------------------------------------------------------------------------

export function NodeGraph({
  nodes,
  selectedIds = [],
  hoveredId = null,
  onNodeClick,
  onNodeHover,
  showConnections = true,
  position = [0, 0, 0],
  onTopologyChange,
}: NodeGraphProps) {
  // Calculate node positions based on type clusters
  const nodePositions = React.useMemo(() => {
    const positions = new Map<string, THREE.Vector3>();

    // Group by type
    const byType: Record<NodeType, Node[]> = {
      operator: [],
      fab: [],
      verifier: [],
      relay: [],
    };

    nodes.forEach((node) => {
      if (byType[node.type]) {
        byType[node.type].push(node);
      }
    });

    // Position each type cluster
    const typeConfig: Record<NodeType, { angle: number; distance: number }> = {
      operator: { angle: 0, distance: 2 },
      fab: { angle: Math.PI / 2, distance: 2 },
      verifier: { angle: Math.PI, distance: 2 },
      relay: { angle: -Math.PI / 2, distance: 2 },
    };

    (Object.entries(byType) as [NodeType, Node[]][]).forEach(([type, typeNodes]) => {
      const config = typeConfig[type];
      const baseX = Math.cos(config.angle) * config.distance;
      const baseZ = Math.sin(config.angle) * config.distance;

      typeNodes.forEach((node, index) => {
        // Spread nodes within cluster
        const clusterAngle = (index / Math.max(typeNodes.length, 1)) * Math.PI * 2;
        const clusterRadius = typeNodes.length > 1 ? 0.8 : 0;
        const x = baseX + Math.cos(clusterAngle) * clusterRadius;
        const z = baseZ + Math.sin(clusterAngle) * clusterRadius;
        const y = ((hashCode(node.id) % 100) / 100 - 0.5) * 0.5;

        positions.set(node.id, new THREE.Vector3(x, y, z));
      });
    });

    return positions;
  }, [nodes]);

  // Generate connection lines between nodes that share capabilities
  const connections = React.useMemo(() => {
    if (!showConnections) return [];

    const lines: Array<{ from: string; to: string; color: string }> = [];

    // Create connections between operators and their associated nodes
    nodes.forEach((node) => {
      if (node.type === "operator") {
        // Connect to verifiers and fab nodes
        nodes.forEach((other) => {
          if (other.id !== node.id && (other.type === "verifier" || other.type === "fab")) {
            // Check if they share capabilities
            const sharedCaps = node.capabilities.filter((cap) =>
              other.capabilities.includes(cap)
            );
            if (sharedCaps.length > 0) {
              lines.push({
                from: node.id,
                to: other.id,
                color: NODE_VISUALS[other.type].color,
              });
            }
          }
        });
      }
    });

    return lines;
  }, [nodes, showConnections]);

  // Memoize connection geometries to avoid creating new BufferGeometry on every render
  const connectionGeometries = React.useMemo(() => {
    const geometries = new Map<string, THREE.BufferGeometry>();

    connections.forEach((conn, index) => {
      const fromPos = nodePositions.get(conn.from);
      const toPos = nodePositions.get(conn.to);
      if (!fromPos || !toPos) return;

      const points = [fromPos, toPos];
      geometries.set(`conn-${index}`, new THREE.BufferGeometry().setFromPoints(points));
    });

    return geometries;
  }, [connections, nodePositions]);

  const topologySlice = React.useMemo(() => {
    const base = new THREE.Vector3(position[0], position[1], position[2]);
    const topologyNodes = nodes.map((node) => {
      const pos = nodePositions.get(node.id) ?? new THREE.Vector3();
      const worldPos = base.clone().add(pos);
      const visual = NODE_VISUALS[node.type];

      return {
        id: node.id,
        type: "node",
        label: node.type,
        position: [worldPos.x, worldPos.y, worldPos.z] as [number, number, number],
        radius: visual.size ?? 0.3,
        color: visual.color,
        meta: {
          nodeType: node.type,
          status: node.status,
          trustTier: node.trust_tier,
        },
      };
    });

    const topologyEdges = connections.map((conn, index) => ({
      id: `node-conn-${index}`,
      from: conn.from,
      to: conn.to,
      type: "capability-link",
      color: conn.color,
    }));

    return { nodes: topologyNodes, edges: topologyEdges };
  }, [nodes, nodePositions, connections, position]);

  React.useEffect(() => {
    if (!onTopologyChange) return;
    onTopologyChange(topologySlice);
  }, [onTopologyChange, topologySlice]);

  return (
    <group position={position}>
      {/* Connection lines */}
      {connections.map((conn, index) => {
        const lineGeometry = connectionGeometries.get(`conn-${index}`);
        if (!lineGeometry) return null;

        return (
          <line key={`conn-${index}`}>
            <primitive object={lineGeometry} attach="geometry" />
            <lineBasicMaterial color={conn.color} transparent opacity={0.15} />
          </line>
        );
      })}

      {/* Network nodes */}
      {nodes.map((node) => {
        const pos = nodePositions.get(node.id);
        if (!pos) return null;

        return (
          <NetworkNode
            key={node.id}
            node={node}
            position={pos}
            isSelected={selectedIds.includes(node.id)}
            isHovered={hoveredId === node.id}
            onClick={() => onNodeClick?.(node)}
            onHover={(hovered) => onNodeHover?.(hovered ? node : null)}
          />
        );
      })}
    </group>
  );
}

"use client";

/**
 * SpatialWorkspace - 3D container for Backbay entity visualization
 *
 * Integrates JobCluster, NodeGraph, ReceiptOrbit, TrustRings, and
 * camera controls into a unified spatial workspace experience.
 */

import * as React from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Job, Node, Receipt, Dispute, TrustTier } from "@backbay/contract";
import { JobCluster } from "./JobCluster";
import { NodeGraph } from "./NodeGraph";
import { ReceiptOrbit } from "./ReceiptOrbit";
import { TrustRings } from "./TrustRings";
import type {
  SpatialWorkspaceProps,
  WorkspaceSelection,
  TopologySlice,
} from "./types";
import type { VisionTopology, VisionTopologyEdge, VisionTopologyNode } from "../../lib/vision-types";

// -----------------------------------------------------------------------------
// Workspace Scene (internal component inside Canvas)
// -----------------------------------------------------------------------------

interface WorkspaceSceneProps {
  jobs: Job[];
  nodes: Node[];
  receipts: Receipt[];
  disputes: Dispute[];
  currentTrustTier: TrustTier;
  selection: WorkspaceSelection[];
  hovered: WorkspaceSelection | null;
  onSelectionChange: (selection: WorkspaceSelection[]) => void;
  onHoverChange: (hovered: WorkspaceSelection | null) => void;
  filters: SpatialWorkspaceProps["filters"];
  autoRotate: boolean;
  enableZoom: boolean;
  enablePan: boolean;
  topologyId?: string;
  topologyUpdateMs?: number;
  onTopologyChange?: (topology: VisionTopology) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

function WorkspaceScene({
  jobs,
  nodes,
  receipts,
  disputes: _disputes, // Reserved for DisputeBeacon component (Phase 4 extension)
  currentTrustTier,
  selection,
  hovered,
  onSelectionChange,
  onHoverChange,
  filters,
  autoRotate,
  enableZoom,
  enablePan,
  topologyId,
  topologyUpdateMs,
  onTopologyChange,
  onCanvasReady,
}: WorkspaceSceneProps) {
  const { gl } = useThree();

  React.useEffect(() => {
    if (!onCanvasReady) return;
    onCanvasReady(gl.domElement);
  }, [gl, onCanvasReady]);
  const controlsRef = React.useRef<any>(null);

  // Extract selected IDs by type
  const selectedJobIds = selection.filter((s) => s.type === "job").map((s) => s.id);
  const selectedNodeIds = selection.filter((s) => s.type === "node").map((s) => s.id);
  const selectedReceiptIds = selection.filter((s) => s.type === "receipt").map((s) => s.id);

  // Hovered IDs
  const hoveredJobId = hovered?.type === "job" ? hovered.id : null;
  const hoveredNodeId = hovered?.type === "node" ? hovered.id : null;
  const hoveredReceiptId = hovered?.type === "receipt" ? hovered.id : null;

  // Filter jobs and nodes based on filters
  const filteredJobs = React.useMemo(() => {
    if (!filters?.showJobs) return [];
    let filtered = jobs;
    if (filters?.jobStatuses?.length) {
      filtered = filtered.filter((j) => filters.jobStatuses!.includes(j.status));
    }
    return filtered;
  }, [jobs, filters]);

  const filteredNodes = React.useMemo(() => {
    if (!filters?.showNodes) return [];
    let filtered = nodes;
    if (filters?.nodeTypes?.length) {
      filtered = filtered.filter((n) => filters.nodeTypes!.includes(n.type));
    }
    if (filters?.nodeStatuses?.length) {
      filtered = filtered.filter((n) => filters.nodeStatuses!.includes(n.status));
    }
    if (filters?.trustTiers?.length) {
      filtered = filtered.filter((n) => filters.trustTiers!.includes(n.trust_tier));
    }
    return filtered;
  }, [nodes, filters]);

  const filteredReceipts = React.useMemo(() => {
    if (!filters?.showReceipts) return [];
    let filtered = receipts;
    if (filters?.receiptStatuses?.length) {
      filtered = filtered.filter((r) => filters.receiptStatuses!.includes(r.status));
    }
    return filtered;
  }, [receipts, filters]);

  const topologySlicesRef = React.useRef<{
    jobs?: TopologySlice;
    nodes?: TopologySlice;
    receipts?: TopologySlice;
  }>({});

  const lastTopologyEmitRef = React.useRef(0);

  const emitTopology = React.useCallback(() => {
    if (!onTopologyChange) return;
    const now = Date.now();
    if (topologyUpdateMs && now - lastTopologyEmitRef.current < topologyUpdateMs) {
      return;
    }
    lastTopologyEmitRef.current = now;

    const slices = Object.values(topologySlicesRef.current).filter(Boolean) as TopologySlice[];
    const nodesMap = new Map<string, VisionTopologyNode>();
    const edges: VisionTopologyEdge[] = [];

    slices.forEach((slice) => {
      slice.nodes.forEach((node) => nodesMap.set(node.id, node));
      slice.edges?.forEach((edge) => edges.push(edge));
    });

    const topology: VisionTopology = {
      id: topologyId,
      source: "SpatialWorkspace",
      updatedAt: now,
      nodes: Array.from(nodesMap.values()),
      edges,
      meta: {
        currentTrustTier,
        filters,
      },
    };

    onTopologyChange(topology);
  }, [onTopologyChange, topologyId, topologyUpdateMs, currentTrustTier, filters]);

  const handleTopologyChange = React.useCallback(
    (key: "jobs" | "nodes" | "receipts", slice: TopologySlice) => {
      topologySlicesRef.current[key] = slice;
      emitTopology();
    },
    [emitTopology]
  );

  // Selection handlers
  const handleJobClick = (job: Job) => {
    const existing = selection.find((s) => s.type === "job" && s.id === job.id);
    if (existing) {
      onSelectionChange(selection.filter((s) => s !== existing));
    } else {
      onSelectionChange([...selection, { type: "job", id: job.id }]);
    }
  };

  const handleNodeClick = (node: Node) => {
    const existing = selection.find((s) => s.type === "node" && s.id === node.id);
    if (existing) {
      onSelectionChange(selection.filter((s) => s !== existing));
    } else {
      onSelectionChange([...selection, { type: "node", id: node.id }]);
    }
  };

  const handleReceiptClick = (receipt: Receipt) => {
    const existing = selection.find((s) => s.type === "receipt" && s.id === receipt.id);
    if (existing) {
      onSelectionChange(selection.filter((s) => s !== existing));
    } else {
      onSelectionChange([...selection, { type: "receipt", id: receipt.id }]);
    }
  };

  // Hover handlers
  const handleJobHover = (job: Job | null) => {
    onHoverChange(job ? { type: "job", id: job.id } : null);
  };

  const handleNodeHover = (node: Node | null) => {
    onHoverChange(node ? { type: "node", id: node.id } : null);
  };

  const handleReceiptHover = (receipt: Receipt | null) => {
    onHoverChange(receipt ? { type: "receipt", id: receipt.id } : null);
  };

  // Click on background to clear selection
  const handleBackgroundClick = () => {
    onSelectionChange([]);
  };

  return (
    <>
      {/* Camera controls */}
      <OrbitControls
        ref={controlsRef}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2 + 0.3}
        enableZoom={enableZoom}
        enablePan={enablePan}
      />

      {/* Ambient and directional lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      {/* Background click plane */}
      <mesh
        position={[0, -5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleBackgroundClick}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Trust Rings (background layer) */}
      {filters?.showTrustRings && (
        <TrustRings
          currentTier={currentTrustTier}
          position={[0, -2, 0]}
          showLabels={true}
          interactive={false}
        />
      )}

      {/* Job Clusters */}
      {filteredJobs.length > 0 && (
        <JobCluster
          jobs={filteredJobs}
          selectedIds={selectedJobIds}
          hoveredId={hoveredJobId}
          onJobClick={handleJobClick}
          onJobHover={handleJobHover}
          position={[-4, 0, 0]}
          onTopologyChange={(slice) => handleTopologyChange("jobs", slice)}
        />
      )}

      {/* Node Graph */}
      {filteredNodes.length > 0 && (
        <NodeGraph
          nodes={filteredNodes}
          selectedIds={selectedNodeIds}
          hoveredId={hoveredNodeId}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          showConnections={true}
          position={[4, 0, 0]}
          onTopologyChange={(slice) => handleTopologyChange("nodes", slice)}
        />
      )}

      {/* Receipt Orbits - group by job */}
      {filteredReceipts.length > 0 && filteredJobs.length > 0 && (
        <group position={[-4, 0, 0]}>
          {filteredJobs
            .filter((job) => job.status === "running" || job.status === "completed")
            .slice(0, 3) // Limit for performance
            .map((job, index) => {
              const jobReceipts = filteredReceipts.filter((r) => r.job_id === job.id);
              if (jobReceipts.length === 0) return null;

              // Position receipts near the center (running jobs area)
              const angle = (index / 3) * Math.PI * 2 - Math.PI / 2;
              const distance = 0.8;

              return (
                <ReceiptOrbit
                  key={job.id}
                  receipts={jobReceipts}
                  parentPosition={[
                    Math.cos(angle) * distance,
                    0,
                    Math.sin(angle) * distance,
                  ]}
                  orbitRadius={0.5}
                  selectedIds={selectedReceiptIds}
                  hoveredId={hoveredReceiptId}
                  onReceiptClick={handleReceiptClick}
                  onReceiptHover={handleReceiptHover}
                  origin={[-4, 0, 0]}
                  onTopologyChange={(slice) => handleTopologyChange("receipts", slice)}
                />
              );
            })}
        </group>
      )}

      {/* Grid helper for spatial reference */}
      <gridHelper args={[20, 20, "#1a1a2e", "#1a1a2e"]} position={[0, -3, 0]} />
    </>
  );
}

// -----------------------------------------------------------------------------
// Main SpatialWorkspace Component
// -----------------------------------------------------------------------------

export function SpatialWorkspace({
  jobs = [],
  nodes = [],
  receipts = [],
  disputes = [],
  currentTrustTier = "bronze",
  selection = [],
  onSelectionChange,
  hovered = null,
  onHoverChange,
  topologyId,
  topologyUpdateMs,
  onTopologyChange,
  onCanvasReady,
  filters = {
    showJobs: true,
    showNodes: true,
    showReceipts: true,
    showDisputes: true,
    showTrustRings: true,
  },
  autoRotate = true,
  enableZoom = true,
  enablePan = true,
  className,
  style,
}: SpatialWorkspaceProps) {
  // Internal state if no external handlers
  const [internalSelection, setInternalSelection] = React.useState<WorkspaceSelection[]>([]);
  const [internalHovered, setInternalHovered] = React.useState<WorkspaceSelection | null>(null);

  const effectiveSelection = onSelectionChange ? selection : internalSelection;
  const effectiveHovered = onHoverChange ? hovered : internalHovered;
  const handleSelectionChange = onSelectionChange || setInternalSelection;
  const handleHoverChange = onHoverChange || setInternalHovered;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "linear-gradient(to bottom, #050812, #0a0f1a)",
        ...style,
      }}
    >
      <Canvas
        camera={{
          position: [0, 8, 12],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        dpr={[1, 2]}
      >
        <WorkspaceScene
          jobs={jobs}
          nodes={nodes}
          receipts={receipts}
          disputes={disputes}
          currentTrustTier={currentTrustTier}
          selection={effectiveSelection}
          hovered={effectiveHovered}
          onSelectionChange={handleSelectionChange}
          onHoverChange={handleHoverChange}
          filters={filters}
          autoRotate={autoRotate}
          enableZoom={enableZoom}
          enablePan={enablePan}
          topologyId={topologyId}
          topologyUpdateMs={topologyUpdateMs}
          onTopologyChange={onTopologyChange}
          onCanvasReady={onCanvasReady}
        />
      </Canvas>

      {/* Selection info panel */}
      {effectiveSelection.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs font-mono p-3 rounded">
          <div className="text-white/60 mb-1">SELECTED ({effectiveSelection.length})</div>
          {effectiveSelection.slice(0, 5).map((s) => (
            <div key={`${s.type}-${s.id}`} className="text-cyan-400">
              {s.type.toUpperCase()}: {s.id.slice(0, 8)}
            </div>
          ))}
          {effectiveSelection.length > 5 && (
            <div className="text-white/40">+{effectiveSelection.length - 5} more</div>
          )}
        </div>
      )}

      {/* Stats overlay */}
      <div className="absolute top-4 right-4 bg-black/60 text-white/60 text-xs font-mono p-2 rounded">
        <div>Jobs: {jobs.length}</div>
        <div>Nodes: {nodes.length}</div>
        <div>Receipts: {receipts.length}</div>
      </div>
    </div>
  );
}

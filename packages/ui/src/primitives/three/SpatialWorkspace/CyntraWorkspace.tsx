"use client";

/**
 * CyntraWorkspace - 3D visualization of Cyntra kernel status
 *
 * Renders kernel, workcells, and active runs as CrystallineOrganisms
 * using the OrganismLattice layout system.
 */

import * as React from "react";
import { OrganismLattice, type CrystallineOrganismProps } from "../CrystallineOrganism";
import type { LatticeEdge } from "../CrystallineOrganism/types";
import { cyntraWorkcellAdapter, type CyntraKernelStatus } from "./adapters";

export interface CyntraWorkspaceProps {
  status: CyntraKernelStatus;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export function CyntraWorkspace({
  status,
  selectedIds = [],
  onSelectionChange,
}: CyntraWorkspaceProps) {
  // Build organism tree: kernel at root, workcells as children
  const { organisms, edges } = React.useMemo(() => {
    const workcellOrganisms = status.workcells.map((wc) =>
      cyntraWorkcellAdapter.toOrganism(wc)
    );

    // Kernel is the root organism with workcells as children
    const kernelOrganism: CrystallineOrganismProps = {
      id: "kernel",
      type: "kernel",
      label: `Kernel`,
      state: status.active_runs > 0 ? "busy" : "idle",
      power: status.active_runs > 2 ? "elevated" : "standard",
      children: workcellOrganisms,
    };

    // Create hierarchy edges from kernel to each workcell
    const hierarchyEdges: LatticeEdge[] = status.workcells.map((wc) => ({
      id: `kernel-${wc.id}`,
      source: "kernel",
      target: wc.id,
      type: "hierarchy" as const,
      strength: 0.5,
      bidirectional: false,
    }));

    // Create data-flow edges between active workcells
    const activeWorkcells = status.workcells.filter((wc) => wc.state === "running");
    const dataFlowEdges: LatticeEdge[] = [];
    for (let i = 0; i < activeWorkcells.length - 1; i++) {
      dataFlowEdges.push({
        id: `flow-${activeWorkcells[i].id}-${activeWorkcells[i + 1].id}`,
        source: activeWorkcells[i].id,
        target: activeWorkcells[i + 1].id,
        type: "data-flow" as const,
        strength: 0.3,
        bidirectional: true,
      });
    }

    return {
      organisms: [kernelOrganism],
      edges: [...hierarchyEdges, ...dataFlowEdges],
    };
  }, [status]);

  const [sprawlStack, setSprawlStack] = React.useState<string[]>([]);

  return (
    <OrganismLattice
      organisms={organisms}
      edges={edges}
      layout="hex-grid"
      sprawlStack={sprawlStack}
      onSprawlChange={setSprawlStack}
      onSelectionChange={onSelectionChange}
    />
  );
}

/**
 * OrganismLattice
 *
 * Container that manages layout, sprawl, and connections between organisms.
 */

import { useState, useCallback, useMemo } from "react";

import type { OrganismLatticeProps, CrystallineOrganismProps } from "./types";
import { CrystallineOrganism } from "./CrystallineOrganism";
import { LatticeEdge } from "./LatticeEdge";
import { hexGridLayout } from "./layouts/hexGrid";

export function OrganismLattice({
  organisms,
  edges,
  layout = "hex-grid",
  sprawlStack = [],
  onSprawlChange,
  onSelectionChange,
}: OrganismLatticeProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Get currently visible organisms based on sprawl stack
  const visibleOrganisms = useMemo(() => {
    if (sprawlStack.length === 0) {
      // Show top-level organisms (those not in any parent's children)
      const childIds = new Set<string>();
      organisms.forEach((org) => {
        org.children?.forEach((child) => childIds.add(child.id));
      });
      return organisms.filter((org) => !childIds.has(org.id));
    }

    // Find the sprawled organism and return its children
    const sprawledId = sprawlStack[sprawlStack.length - 1];

    // Helper to find organism by ID in nested structure
    const findOrganism = (
      orgs: CrystallineOrganismProps[],
      id: string
    ): CrystallineOrganismProps | undefined => {
      for (const org of orgs) {
        if (org.id === id) return org;
        if (org.children) {
          const found = findOrganism(org.children, id);
          if (found) return found;
        }
      }
      return undefined;
    };

    const sprawled = findOrganism(organisms, sprawledId);
    return sprawled?.children ?? [];
  }, [organisms, sprawlStack]);

  // Calculate positions based on layout
  const positions = useMemo(() => {
    const ids = visibleOrganisms.map((o) => o.id);

    switch (layout) {
      case "hex-grid":
        return hexGridLayout(ids);
      case "manual": {
        // Use positions from props
        const manual = new Map<string, [number, number, number]>();
        visibleOrganisms.forEach((o) => {
          if (o.position) manual.set(o.id, o.position);
        });
        return { positions: manual };
      }
      case "force-directed":
      case "radial":
        // Fallback to hex-grid for unimplemented layouts
        return hexGridLayout(ids);
      default:
        return hexGridLayout(ids);
    }
  }, [visibleOrganisms, layout]);

  // Filter edges to only show connections between visible organisms
  const visibleEdges = useMemo(() => {
    const visibleIds = new Set(visibleOrganisms.map((o) => o.id));
    return edges.filter(
      (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
    );
  }, [edges, visibleOrganisms]);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = prev.includes(id)
          ? prev.filter((i) => i !== id)
          : [...prev, id];
        onSelectionChange?.(next);
        return next;
      });
    },
    [onSelectionChange]
  );

  const handleSprawl = useCallback(
    (id: string) => {
      const next = [...sprawlStack, id];
      onSprawlChange?.(next);
    },
    [sprawlStack, onSprawlChange]
  );

  const handleCollapse = useCallback(
    (id: string) => {
      const index = sprawlStack.indexOf(id);
      if (index >= 0) {
        const next = sprawlStack.slice(0, index);
        onSprawlChange?.(next);
      }
    },
    [sprawlStack, onSprawlChange]
  );

  return (
    <group>
      {/* Render visible organisms */}
      {visibleOrganisms.map((org) => {
        const pos = positions.positions.get(org.id) ?? org.position ?? [0, 0, 0];
        return (
          <CrystallineOrganism
            key={org.id}
            {...org}
            position={pos}
            selected={selectedIds.includes(org.id)}
            hovered={hoveredId === org.id}
            onSelect={handleSelect}
            onSprawl={handleSprawl}
            onCollapse={handleCollapse}
            onHover={setHoveredId}
          />
        );
      })}

      {/* Render edges */}
      {visibleEdges.map((edge) => {
        const sourcePos = positions.positions.get(edge.source);
        const targetPos = positions.positions.get(edge.target);
        if (!sourcePos || !targetPos) return null;

        return (
          <LatticeEdge
            key={edge.id}
            edge={edge}
            sourcePosition={sourcePos}
            targetPosition={targetPos}
          />
        );
      })}
    </group>
  );
}

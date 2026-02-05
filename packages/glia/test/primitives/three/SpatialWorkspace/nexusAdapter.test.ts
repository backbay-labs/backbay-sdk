/**
 * Nexus Adapter Tests
 *
 * Tests for NexusItem → CrystallineOrganism mapping.
 */

import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
  nexusAdapter,
  nexusItemsToOrganisms,
  getNexusOrganismScale,
  canSprawlInto,
} from "../../../../src/primitives/three/SpatialWorkspace/nexusAdapter";
import type {
  NexusItem,
  NexusItemType,
  NexusItemStatus,
} from "../../../../src/primitives/three/SpatialWorkspace/nexusAdapter";
import type {
  OrganismType,
  OrganismState,
  OrganismPower,
} from "../../../../src/primitives/three/CrystallineOrganism";

// -----------------------------------------------------------------------------
// Test Fixtures
// -----------------------------------------------------------------------------

function createNexusItem(
  overrides: Partial<NexusItem> = {}
): NexusItem {
  return {
    id: "test-nexus-item",
    type: "agent-task",
    label: "Test Item",
    status: "idle",
    activityLevel: 0.5,
    position: new THREE.Vector3(0, 0, 0),
    ...overrides,
  };
}

// -----------------------------------------------------------------------------
// nexusAdapter.getType Tests
// -----------------------------------------------------------------------------

describe("nexusAdapter.getType", () => {
  const typeMapping: Array<{ nexusType: NexusItemType; expectedOrganism: OrganismType }> = [
    { nexusType: "terminal", expectedOrganism: "kernel" },
    { nexusType: "browser-tab", expectedOrganism: "relay" },
    { nexusType: "agent-task", expectedOrganism: "agent" },
    { nexusType: "industry", expectedOrganism: "workcell" },
    { nexusType: "workcell", expectedOrganism: "workcell" },
    { nexusType: "trade", expectedOrganism: "task" },
    { nexusType: "cluster", expectedOrganism: "kernel" },
    { nexusType: "index", expectedOrganism: "relay" },
    { nexusType: "app-window", expectedOrganism: "agent" },
  ];

  for (const { nexusType, expectedOrganism } of typeMapping) {
    it(`maps ${nexusType} to ${expectedOrganism}`, () => {
      const item = createNexusItem({ type: nexusType });
      expect(nexusAdapter.getType(item)).toBe(expectedOrganism);
    });
  }

  it("maps unknown type to agent as fallback", () => {
    const item = createNexusItem({ type: "unknown-type" as NexusItemType });
    expect(nexusAdapter.getType(item)).toBe("agent");
  });
});

// -----------------------------------------------------------------------------
// nexusAdapter.getState Tests
// -----------------------------------------------------------------------------

describe("nexusAdapter.getState", () => {
  const statusMapping: Array<{ nexusStatus: NexusItemStatus; expectedState: OrganismState }> = [
    { nexusStatus: "idle", expectedState: "idle" },
    { nexusStatus: "active", expectedState: "busy" },
    { nexusStatus: "running", expectedState: "busy" },
    { nexusStatus: "error", expectedState: "error" },
    { nexusStatus: "complete", expectedState: "success" },
    { nexusStatus: "pending", expectedState: "listening" },
  ];

  for (const { nexusStatus, expectedState } of statusMapping) {
    it(`maps ${nexusStatus} to ${expectedState}`, () => {
      const item = createNexusItem({ status: nexusStatus });
      expect(nexusAdapter.getState(item)).toBe(expectedState);
    });
  }

  it("maps unknown status to idle as fallback", () => {
    const item = createNexusItem({ status: "unknown" as NexusItemStatus });
    expect(nexusAdapter.getState(item)).toBe("idle");
  });
});

// -----------------------------------------------------------------------------
// nexusAdapter.getPower Tests
// -----------------------------------------------------------------------------

describe("nexusAdapter.getPower", () => {
  describe("activity level based power", () => {
    it("returns elevated for high activity (> 0.7)", () => {
      const item = createNexusItem({ activityLevel: 0.8 });
      expect(nexusAdapter.getPower(item)).toBe("elevated");
    });

    it("returns elevated for very high activity (1.0)", () => {
      const item = createNexusItem({ activityLevel: 1.0 });
      expect(nexusAdapter.getPower(item)).toBe("elevated");
    });

    it("returns standard for moderate activity (0.5)", () => {
      const item = createNexusItem({ activityLevel: 0.5 });
      expect(nexusAdapter.getPower(item)).toBe("standard");
    });

    it("returns standard for low activity (0.1)", () => {
      const item = createNexusItem({ activityLevel: 0.1 });
      expect(nexusAdapter.getPower(item)).toBe("standard");
    });
  });

  describe("status based power", () => {
    it("returns elevated for error status", () => {
      const item = createNexusItem({ status: "error", activityLevel: 0.1 });
      expect(nexusAdapter.getPower(item)).toBe("elevated");
    });

    it("returns elevated for running status", () => {
      const item = createNexusItem({ status: "running", activityLevel: 0.1 });
      expect(nexusAdapter.getPower(item)).toBe("elevated");
    });
  });

  describe("type based power", () => {
    it("returns elevated for cluster with moderate activity", () => {
      const item = createNexusItem({ type: "cluster", activityLevel: 0.5 });
      expect(nexusAdapter.getPower(item)).toBe("elevated");
    });

    it("returns standard for cluster with low activity", () => {
      const item = createNexusItem({ type: "cluster", activityLevel: 0.2 });
      expect(nexusAdapter.getPower(item)).toBe("standard");
    });

    it("returns elevated for terminal with moderate activity", () => {
      const item = createNexusItem({ type: "terminal", activityLevel: 0.5 });
      expect(nexusAdapter.getPower(item)).toBe("elevated");
    });

    it("returns standard for terminal with low activity", () => {
      const item = createNexusItem({ type: "terminal", activityLevel: 0.2 });
      expect(nexusAdapter.getPower(item)).toBe("standard");
    });
  });
});

// -----------------------------------------------------------------------------
// nexusAdapter.toOrganism Tests
// -----------------------------------------------------------------------------

describe("nexusAdapter.toOrganism", () => {
  it("converts NexusItem to CrystallineOrganismProps", () => {
    const item = createNexusItem({
      id: "nexus-123",
      type: "workcell",
      label: "My Workcell",
      status: "running",
      activityLevel: 0.8,
    });

    const organism = nexusAdapter.toOrganism(item);

    expect(organism).toEqual({
      id: "nexus-123",
      type: "workcell",
      label: "My Workcell",
      state: "busy",
      power: "elevated",
    });
  });

  it("preserves item id in organism", () => {
    const item = createNexusItem({ id: "unique-id-456" });
    const organism = nexusAdapter.toOrganism(item);
    expect(organism.id).toBe("unique-id-456");
  });

  it("preserves item label in organism", () => {
    const item = createNexusItem({ label: "Custom Label" });
    const organism = nexusAdapter.toOrganism(item);
    expect(organism.label).toBe("Custom Label");
  });
});

// -----------------------------------------------------------------------------
// nexusItemsToOrganisms Tests
// -----------------------------------------------------------------------------

describe("nexusItemsToOrganisms", () => {
  it("converts empty array", () => {
    expect(nexusItemsToOrganisms([])).toEqual([]);
  });

  it("converts single item", () => {
    const items = [createNexusItem({ id: "item-1" })];
    const organisms = nexusItemsToOrganisms(items);
    expect(organisms).toHaveLength(1);
    expect(organisms[0].id).toBe("item-1");
  });

  it("converts multiple items preserving order", () => {
    const items = [
      createNexusItem({ id: "item-1", type: "terminal" }),
      createNexusItem({ id: "item-2", type: "workcell" }),
      createNexusItem({ id: "item-3", type: "agent-task" }),
    ];
    const organisms = nexusItemsToOrganisms(items);
    expect(organisms).toHaveLength(3);
    expect(organisms[0].id).toBe("item-1");
    expect(organisms[0].type).toBe("kernel");
    expect(organisms[1].id).toBe("item-2");
    expect(organisms[1].type).toBe("workcell");
    expect(organisms[2].id).toBe("item-3");
    expect(organisms[2].type).toBe("agent");
  });
});

// -----------------------------------------------------------------------------
// getNexusOrganismScale Tests
// -----------------------------------------------------------------------------

describe("getNexusOrganismScale", () => {
  it("returns 0.8 for activity level 0", () => {
    const item = createNexusItem({ activityLevel: 0 });
    expect(getNexusOrganismScale(item)).toBe(0.8);
  });

  it("returns 1.0 for activity level 0.5", () => {
    const item = createNexusItem({ activityLevel: 0.5 });
    expect(getNexusOrganismScale(item)).toBe(1.0);
  });

  it("returns 1.2 for activity level 1.0", () => {
    const item = createNexusItem({ activityLevel: 1.0 });
    expect(getNexusOrganismScale(item)).toBeCloseTo(1.2, 10);
  });

  it("scales linearly with activity level", () => {
    const item1 = createNexusItem({ activityLevel: 0.25 });
    const item2 = createNexusItem({ activityLevel: 0.75 });

    expect(getNexusOrganismScale(item1)).toBe(0.9);
    expect(getNexusOrganismScale(item2)).toBe(1.1);
  });
});

// -----------------------------------------------------------------------------
// canSprawlInto Tests
// -----------------------------------------------------------------------------

describe("canSprawlInto", () => {
  const sprawlableTypes: NexusItemType[] = ["cluster", "workcell", "industry", "terminal"];
  const nonSprawlableTypes: NexusItemType[] = [
    "browser-tab",
    "agent-task",
    "trade",
    "index",
    "app-window",
  ];

  for (const type of sprawlableTypes) {
    it(`returns true for ${type}`, () => {
      const item = createNexusItem({ type });
      expect(canSprawlInto(item)).toBe(true);
    });
  }

  for (const type of nonSprawlableTypes) {
    it(`returns false for ${type}`, () => {
      const item = createNexusItem({ type });
      expect(canSprawlInto(item)).toBe(false);
    });
  }
});

// -----------------------------------------------------------------------------
// Integration Tests
// -----------------------------------------------------------------------------

describe("nexusAdapter integration", () => {
  it("handles full workflow: create items → convert → verify", () => {
    // Simulate a real nexus workspace
    const items: NexusItem[] = [
      createNexusItem({
        id: "terminal-main",
        type: "terminal",
        label: "Main Terminal",
        status: "active",
        activityLevel: 0.6,
      }),
      createNexusItem({
        id: "workcell-001",
        type: "workcell",
        label: "Workcell #1",
        status: "running",
        activityLevel: 0.9,
      }),
      createNexusItem({
        id: "trade-pending",
        type: "trade",
        label: "BTC/USD",
        status: "pending",
        activityLevel: 0.3,
      }),
    ];

    const organisms = nexusItemsToOrganisms(items);

    // Terminal → kernel, active → busy, elevated (moderate activity + terminal type)
    expect(organisms[0]).toEqual({
      id: "terminal-main",
      type: "kernel",
      label: "Main Terminal",
      state: "busy",
      power: "elevated",
    });

    // Workcell → workcell, running → busy, elevated (high activity)
    expect(organisms[1]).toEqual({
      id: "workcell-001",
      type: "workcell",
      label: "Workcell #1",
      state: "busy",
      power: "elevated",
    });

    // Trade → task, pending → listening, standard (low activity)
    expect(organisms[2]).toEqual({
      id: "trade-pending",
      type: "task",
      label: "BTC/USD",
      state: "listening",
      power: "standard",
    });
  });

  it("identifies sprawlable items correctly", () => {
    const items: NexusItem[] = [
      createNexusItem({ id: "terminal-1", type: "terminal" }),
      createNexusItem({ id: "browser-1", type: "browser-tab" }),
      createNexusItem({ id: "cluster-1", type: "cluster" }),
      createNexusItem({ id: "trade-1", type: "trade" }),
    ];

    const sprawlable = items.filter(canSprawlInto);
    expect(sprawlable.map((i) => i.id)).toEqual(["terminal-1", "cluster-1"]);
  });
});

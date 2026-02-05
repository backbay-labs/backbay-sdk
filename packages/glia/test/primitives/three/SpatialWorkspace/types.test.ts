/**
 * SpatialWorkspace Types Tests
 *
 * Tests for visual configs and helper functions in types.ts
 */

import { describe, it, expect } from "vitest";
import {
  getDisputeSeverity,
  JOB_VISUALS,
  NODE_VISUALS,
  NODE_STATUS_MODIFIERS,
  RECEIPT_VISUALS,
  TRUST_RING_CONFIG,
  DISPUTE_SEVERITY_VISUALS,
  DEFAULT_WORKSPACE_CONFIG,
} from "../../../../src/primitives/three/SpatialWorkspace/types";
import type {
  Dispute,
  JobStatus,
  NodeType,
  NodeStatus,
  ReceiptStatus,
  TrustTier,
  DisputeSeverity,
} from "../../../../src/primitives/three/SpatialWorkspace/types";

// -----------------------------------------------------------------------------
// getDisputeSeverity Tests
// -----------------------------------------------------------------------------

describe("getDisputeSeverity", () => {
  /**
   * Creates a dispute with opened_at set to hoursAgo before NOW
   */
  function createDispute(hoursAgo: number): Dispute {
    const now = Date.now();
    const openedAt = new Date(now - hoursAgo * 60 * 60 * 1000);
    return {
      id: "dispute-123",
      job_id: "job-456",
      receipt_id: "receipt-789",
      opened_at: openedAt.toISOString(),
      status: "pending",
      reason: "Test dispute",
    } as Dispute;
  }

  describe("low severity (< 24 hours)", () => {
    it("returns low for a dispute opened 0 hours ago", () => {
      const dispute = createDispute(0);
      expect(getDisputeSeverity(dispute)).toBe("low");
    });

    it("returns low for a dispute opened 12 hours ago", () => {
      const dispute = createDispute(12);
      expect(getDisputeSeverity(dispute)).toBe("low");
    });

    it("returns low for a dispute opened 23.9 hours ago", () => {
      const dispute = createDispute(23.9);
      expect(getDisputeSeverity(dispute)).toBe("low");
    });
  });

  describe("medium severity (24-72 hours)", () => {
    it("returns medium for a dispute opened exactly 24 hours ago", () => {
      const dispute = createDispute(24);
      expect(getDisputeSeverity(dispute)).toBe("medium");
    });

    it("returns medium for a dispute opened 48 hours ago", () => {
      const dispute = createDispute(48);
      expect(getDisputeSeverity(dispute)).toBe("medium");
    });

    it("returns medium for a dispute opened 71.9 hours ago", () => {
      const dispute = createDispute(71.9);
      expect(getDisputeSeverity(dispute)).toBe("medium");
    });
  });

  describe("high severity (>= 72 hours)", () => {
    it("returns high for a dispute opened exactly 72 hours ago", () => {
      const dispute = createDispute(72);
      expect(getDisputeSeverity(dispute)).toBe("high");
    });

    it("returns high for a dispute opened 1 week ago", () => {
      const dispute = createDispute(168); // 7 days
      expect(getDisputeSeverity(dispute)).toBe("high");
    });

    it("returns high for a very old dispute", () => {
      const dispute = createDispute(720); // 30 days
      expect(getDisputeSeverity(dispute)).toBe("high");
    });
  });

  describe("edge cases", () => {
    it("handles boundary at exactly 24 hours", () => {
      // Just under 24 hours should be low
      expect(getDisputeSeverity(createDispute(23.999))).toBe("low");
      // Exactly 24 hours should be medium
      expect(getDisputeSeverity(createDispute(24))).toBe("medium");
    });

    it("handles boundary at exactly 72 hours", () => {
      // Just under 72 hours should be medium
      expect(getDisputeSeverity(createDispute(71.999))).toBe("medium");
      // Exactly 72 hours should be high
      expect(getDisputeSeverity(createDispute(72))).toBe("high");
    });
  });
});

// -----------------------------------------------------------------------------
// Visual Config Tests
// -----------------------------------------------------------------------------

describe("JOB_VISUALS", () => {
  const jobStatuses: JobStatus[] = [
    "queued",
    "running",
    "completed",
    "blocked",
    "quarantine",
  ];

  it("has visual config for all job statuses", () => {
    for (const status of jobStatuses) {
      expect(JOB_VISUALS[status]).toBeDefined();
    }
  });

  it("all configs have required properties", () => {
    for (const status of jobStatuses) {
      const visual = JOB_VISUALS[status];
      expect(visual.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(visual.opacity).toBeGreaterThanOrEqual(0);
      expect(visual.opacity).toBeLessThanOrEqual(1);
      expect(typeof visual.pulse).toBe("boolean");
      expect(typeof visual.icon).toBe("string");
    }
  });

  it("running and blocked jobs pulse", () => {
    expect(JOB_VISUALS.running.pulse).toBe(true);
    expect(JOB_VISUALS.blocked.pulse).toBe(true);
    expect(JOB_VISUALS.quarantine.pulse).toBe(true);
  });

  it("completed and queued jobs do not pulse", () => {
    expect(JOB_VISUALS.queued.pulse).toBe(false);
    expect(JOB_VISUALS.completed.pulse).toBe(false);
  });

  it("uses appropriate colors for status semantics", () => {
    // Success: green-ish
    expect(JOB_VISUALS.completed.color).toBe("#00ff88");
    // Error: red-ish
    expect(JOB_VISUALS.quarantine.color).toBe("#ff0055");
    // Warning: orange-ish
    expect(JOB_VISUALS.blocked.color).toBe("#ffaa00");
  });
});

describe("NODE_VISUALS", () => {
  const nodeTypes: NodeType[] = ["operator", "fab", "verifier", "relay"];

  it("has visual config for all node types", () => {
    for (const type of nodeTypes) {
      expect(NODE_VISUALS[type]).toBeDefined();
    }
  });

  it("all configs have required properties", () => {
    for (const type of nodeTypes) {
      const visual = NODE_VISUALS[type];
      expect(visual.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(visual.opacity).toBe(1.0);
      expect(visual.pulse).toBe(false);
      expect(typeof visual.icon).toBe("string");
      expect(visual.shape).toBeDefined();
    }
  });

  it("uses distinct shapes for different node types", () => {
    expect(NODE_VISUALS.operator.shape).toBe("octahedron");
    expect(NODE_VISUALS.fab.shape).toBe("box");
    expect(NODE_VISUALS.verifier.shape).toBe("icosahedron");
    expect(NODE_VISUALS.relay.shape).toBe("torus");
  });

  it("uses distinct colors for different node types", () => {
    const colors = nodeTypes.map((t) => NODE_VISUALS[t].color);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(nodeTypes.length);
  });
});

describe("NODE_STATUS_MODIFIERS", () => {
  const nodeStatuses: NodeStatus[] = ["online", "degraded", "offline"];

  it("has modifier for all node statuses", () => {
    for (const status of nodeStatuses) {
      expect(NODE_STATUS_MODIFIERS[status]).toBeDefined();
    }
  });

  it("online nodes are fully opaque and don't pulse", () => {
    expect(NODE_STATUS_MODIFIERS.online.opacity).toBe(1.0);
    expect(NODE_STATUS_MODIFIERS.online.pulse).toBe(false);
  });

  it("degraded nodes pulse to indicate issues", () => {
    expect(NODE_STATUS_MODIFIERS.degraded.pulse).toBe(true);
    expect(NODE_STATUS_MODIFIERS.degraded.opacity).toBeLessThan(1.0);
  });

  it("offline nodes are dim and don't pulse", () => {
    expect(NODE_STATUS_MODIFIERS.offline.opacity).toBeLessThan(0.5);
    expect(NODE_STATUS_MODIFIERS.offline.pulse).toBe(false);
  });
});

describe("RECEIPT_VISUALS", () => {
  const receiptStatuses: ReceiptStatus[] = ["pending", "passed", "failed"];

  it("has visual config for all receipt statuses", () => {
    for (const status of receiptStatuses) {
      expect(RECEIPT_VISUALS[status]).toBeDefined();
    }
  });

  it("all configs use ring shape", () => {
    for (const status of receiptStatuses) {
      expect(RECEIPT_VISUALS[status].shape).toBe("ring");
    }
  });

  it("uses appropriate colors for status semantics", () => {
    expect(RECEIPT_VISUALS.passed.color).toBe("#00ff88"); // green
    expect(RECEIPT_VISUALS.failed.color).toBe("#ff0055"); // red
    expect(RECEIPT_VISUALS.pending.color).toBe("#00f0ff"); // cyan
  });

  it("failed receipts pulse to draw attention", () => {
    expect(RECEIPT_VISUALS.failed.pulse).toBe(true);
    expect(RECEIPT_VISUALS.passed.pulse).toBe(false);
    expect(RECEIPT_VISUALS.pending.pulse).toBe(false);
  });

  it("pending receipts have lower opacity", () => {
    expect(RECEIPT_VISUALS.pending.opacity).toBeLessThan(
      RECEIPT_VISUALS.passed.opacity
    );
    expect(RECEIPT_VISUALS.pending.opacity).toBeLessThan(
      RECEIPT_VISUALS.failed.opacity
    );
  });
});

describe("TRUST_RING_CONFIG", () => {
  const trustTiers: TrustTier[] = ["bronze", "silver", "gold"];

  it("has config for all trust tiers", () => {
    for (const tier of trustTiers) {
      expect(TRUST_RING_CONFIG[tier]).toBeDefined();
    }
  });

  it("uses progressively larger radii for higher tiers", () => {
    expect(TRUST_RING_CONFIG.bronze.radius).toBeLessThan(
      TRUST_RING_CONFIG.silver.radius
    );
    expect(TRUST_RING_CONFIG.silver.radius).toBeLessThan(
      TRUST_RING_CONFIG.gold.radius
    );
  });

  it("uses progressively higher metalness for higher tiers", () => {
    expect(TRUST_RING_CONFIG.bronze.metalness).toBeLessThan(
      TRUST_RING_CONFIG.silver.metalness
    );
    expect(TRUST_RING_CONFIG.silver.metalness).toBeLessThan(
      TRUST_RING_CONFIG.gold.metalness
    );
  });

  it("uses progressively lower roughness for higher tiers", () => {
    expect(TRUST_RING_CONFIG.bronze.roughness).toBeGreaterThan(
      TRUST_RING_CONFIG.silver.roughness
    );
    expect(TRUST_RING_CONFIG.silver.roughness).toBeGreaterThan(
      TRUST_RING_CONFIG.gold.roughness
    );
  });

  it("uses appropriate metallic colors", () => {
    // Bronze: brownish
    expect(TRUST_RING_CONFIG.bronze.color).toBe("#cd7f32");
    // Silver: gray
    expect(TRUST_RING_CONFIG.silver.color).toBe("#c0c0c0");
    // Gold: gold
    expect(TRUST_RING_CONFIG.gold.color).toBe("#ffd700");
  });
});

describe("DISPUTE_SEVERITY_VISUALS", () => {
  const severities: DisputeSeverity[] = ["low", "medium", "high"];

  it("has visual config for all severity levels", () => {
    for (const severity of severities) {
      expect(DISPUTE_SEVERITY_VISUALS[severity]).toBeDefined();
    }
  });

  it("uses progressively more alarming colors for higher severity", () => {
    // Low: yellow/warning
    expect(DISPUTE_SEVERITY_VISUALS.low.color).toBe("#ffaa00");
    // Medium: orange
    expect(DISPUTE_SEVERITY_VISUALS.medium.color).toBe("#ff5500");
    // High: red
    expect(DISPUTE_SEVERITY_VISUALS.high.color).toBe("#ff0055");
  });

  it("uses progressively faster pulse for higher severity", () => {
    expect(DISPUTE_SEVERITY_VISUALS.low.pulseSpeed).toBeLessThan(
      DISPUTE_SEVERITY_VISUALS.medium.pulseSpeed
    );
    expect(DISPUTE_SEVERITY_VISUALS.medium.pulseSpeed).toBeLessThan(
      DISPUTE_SEVERITY_VISUALS.high.pulseSpeed
    );
  });

  it("uses progressively larger size for higher severity", () => {
    expect(DISPUTE_SEVERITY_VISUALS.low.size).toBeLessThan(
      DISPUTE_SEVERITY_VISUALS.medium.size
    );
    expect(DISPUTE_SEVERITY_VISUALS.medium.size).toBeLessThan(
      DISPUTE_SEVERITY_VISUALS.high.size
    );
  });
});

describe("DEFAULT_WORKSPACE_CONFIG", () => {
  it("has sensible default layout", () => {
    expect(DEFAULT_WORKSPACE_CONFIG.layout).toBe("clustered");
  });

  it("enables all interactions by default", () => {
    expect(DEFAULT_WORKSPACE_CONFIG.autoRotate).toBe(true);
    expect(DEFAULT_WORKSPACE_CONFIG.enableZoom).toBe(true);
    expect(DEFAULT_WORKSPACE_CONFIG.enablePan).toBe(true);
  });

  it("shows all entity types by default", () => {
    const filters = DEFAULT_WORKSPACE_CONFIG.filters;
    expect(filters.showJobs).toBe(true);
    expect(filters.showNodes).toBe(true);
    expect(filters.showReceipts).toBe(true);
    expect(filters.showDisputes).toBe(true);
    expect(filters.showTrustRings).toBe(true);
  });

  it("has animation enabled with reasonable duration", () => {
    const opts = DEFAULT_WORKSPACE_CONFIG.layoutOptions;
    expect(opts.animate).toBe(true);
    expect(opts.animationDuration).toBeGreaterThan(0);
    expect(opts.animationDuration).toBeLessThanOrEqual(1000);
  });

  it("has reasonable force simulation parameters", () => {
    const opts = DEFAULT_WORKSPACE_CONFIG.layoutOptions;
    expect(opts.forceStrength).toBeGreaterThan(0);
    expect(opts.forceStrength).toBeLessThanOrEqual(1);
    expect(opts.repulsion).toBeGreaterThan(0);
    expect(opts.gravity).toBeGreaterThan(0);
    expect(opts.gravity).toBeLessThanOrEqual(1);
  });
});

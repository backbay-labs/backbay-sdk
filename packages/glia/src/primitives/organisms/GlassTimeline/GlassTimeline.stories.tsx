import type { Meta, StoryObj } from "@storybook/react";
import { GlassTimeline, type TimelineEvent } from "./GlassTimeline";
import * as React from "react";

const meta: Meta<typeof GlassTimeline> = {
  title: "Primitives/Organisms/GlassTimeline",
  component: GlassTimeline,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-2xl mx-auto p-8 bg-[var(--glia-color-bg-body,#0B1120)] min-h-[600px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlassTimeline>;

// ============================================================================
// SAMPLE DATA
// ============================================================================

const mixedEvents: TimelineEvent[] = [
  {
    id: "1",
    timestamp: "2026-02-08 14:32",
    title: "Deployment completed",
    description: "Version 2.4.1 deployed to production cluster.",
    type: "success",
    metadata: { version: "2.4.1", region: "us-east-1" },
  },
  {
    id: "2",
    timestamp: "2026-02-08 14:10",
    title: "Build pipeline started",
    description: "CI pipeline triggered by merge to main.",
    type: "info",
  },
  {
    id: "3",
    timestamp: "2026-02-08 13:55",
    title: "Memory threshold exceeded",
    description: "Node opus-worker-03 reached 92% memory utilization.",
    type: "warning",
    metadata: { node: "opus-worker-03", memory: "92%" },
  },
  {
    id: "4",
    timestamp: "2026-02-08 12:20",
    title: "Service health check failed",
    description: "API gateway returned 503 for 12 seconds before auto-recovery.",
    type: "error",
    metadata: { service: "api-gateway", downtime: "12s" },
  },
  {
    id: "5",
    timestamp: "2026-02-08 11:00",
    title: "Scheduled maintenance window",
    description: "Database vacuum and index rebuild completed successfully.",
    type: "system",
  },
  {
    id: "6",
    timestamp: "2026-02-08 09:15",
    title: "New cluster provisioned",
    description: "Alexandria cluster brought online with 3 worker nodes.",
    type: "success",
    metadata: { cluster: "alexandria", nodes: "3" },
  },
];

const securityEvents: TimelineEvent[] = [
  {
    id: "s1",
    timestamp: "2026-02-08 15:01",
    title: "Successful authentication",
    description: "User admin@backbay.io signed in via SSO.",
    type: "success",
    metadata: { method: "SSO", ip: "10.0.1.42" },
  },
  {
    id: "s2",
    timestamp: "2026-02-08 14:45",
    title: "Permission escalation detected",
    description: "Role change from viewer to admin for user ops-bot.",
    type: "warning",
    metadata: { user: "ops-bot", role: "admin" },
  },
  {
    id: "s3",
    timestamp: "2026-02-08 14:30",
    title: "Threat blocked",
    description: "Brute force attempt from 192.168.1.99 blocked after 5 failed attempts.",
    type: "error",
    metadata: { ip: "192.168.1.99", attempts: "5" },
  },
  {
    id: "s4",
    timestamp: "2026-02-08 13:00",
    title: "Certificate rotated",
    description: "TLS certificate for *.backbay.io renewed automatically.",
    type: "system",
    metadata: { domain: "*.backbay.io", expires: "2027-02-08" },
  },
  {
    id: "s5",
    timestamp: "2026-02-08 12:15",
    title: "New API key issued",
    description: "Service account key generated for CI pipeline.",
    type: "info",
    metadata: { scope: "ci-pipeline", ttl: "90d" },
  },
];

// ============================================================================
// DEFAULT
// ============================================================================

export const Default: Story = {
  args: {
    events: mixedEvents,
    layout: "left",
    showTimestamps: true,
    animate: true,
  },
};

// ============================================================================
// SECURITY AUDIT
// ============================================================================

export const SecurityAudit: Story = {
  args: {
    events: securityEvents,
    layout: "left",
    showTimestamps: true,
    animate: true,
  },
};

// ============================================================================
// ALTERNATING
// ============================================================================

export const Alternating: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-3xl mx-auto p-8 bg-[var(--glia-color-bg-body,#0B1120)] min-h-[600px]">
        <Story />
      </div>
    ),
  ],
  args: {
    events: mixedEvents,
    layout: "alternating",
    showTimestamps: true,
    animate: true,
  },
};

// ============================================================================
// LOADING
// ============================================================================

function LoadingDemo() {
  const [events, setEvents] = React.useState(mixedEvents.slice(0, 3));
  const [loading, setLoading] = React.useState(false);

  const handleLoadMore = React.useCallback(() => {
    if (loading || events.length >= mixedEvents.length) return;
    setLoading(true);
    setTimeout(() => {
      setEvents((prev) => mixedEvents.slice(0, prev.length + 2));
      setLoading(false);
    }, 1500);
  }, [loading, events.length]);

  return (
    <GlassTimeline
      events={events}
      layout="left"
      showTimestamps
      animate
      onLoadMore={handleLoadMore}
      loading={loading}
    />
  );
}

export const Loading: Story = {
  render: () => <LoadingDemo />,
};

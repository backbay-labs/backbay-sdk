"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  Network,
  Settings,
  Bell,
  User,
  Rocket,
  Plus,
  Download,
  Zap,
} from "lucide-react";
import * as React from "react";
import { cn, prefersReducedMotion } from "../../../lib/utils";
import { useGlassTokens } from "../../../theme";
import { GlassNavigation } from "../GlassNavigation/GlassNavigation";
import { GlassDataCard } from "../../molecules/GlassDataCard/GlassDataCard";
import { GlassTimeline, type TimelineEvent } from "../GlassTimeline/GlassTimeline";
import { GlassSteps, type GlassStep } from "../../molecules/GlassSteps/GlassSteps";
import { KPIStat } from "../../molecules/KPIStat/KPIStat";
import { GlassPanel } from "../Glass/GlassPanel";

// ============================================================================
// DATA
// ============================================================================

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: "clusters", label: "Clusters", icon: <Network className="h-3.5 w-3.5" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-3.5 w-3.5" /> },
];

const KPI_CARDS = [
  {
    label: "Revenue",
    value: "$127.4K",
    trend: 8.3,
    variant: "success" as const,
    sparklineData: [42, 45, 48, 51, 49, 53, 58, 62, 60, 65, 72, 78],
  },
  {
    label: "Users",
    value: "2,847",
    trend: 12.1,
    variant: "accent" as const,
    sparklineData: [120, 135, 142, 155, 168, 180, 195, 210, 225, 240, 262, 285],
  },
  {
    label: "Latency",
    value: "23ms",
    trend: -5.2,
    variant: "default" as const,
    sparklineData: [32, 30, 28, 27, 26, 25, 24, 23, 24, 23, 22, 23],
  },
  {
    label: "Uptime",
    value: "99.97%",
    trend: 0.01,
    variant: "success" as const,
    sparklineData: [99.9, 99.92, 99.93, 99.95, 99.94, 99.96, 99.95, 99.97, 99.96, 99.97, 99.97, 99.97],
  },
];

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: "evt-1",
    timestamp: "2 minutes ago",
    title: "Production deploy succeeded",
    description: "v2.4.1 rolled out to all regions with zero downtime.",
    type: "success",
    metadata: { version: "v2.4.1", regions: "us-east, eu-west" },
  },
  {
    id: "evt-2",
    timestamp: "18 minutes ago",
    title: "New user signup",
    description: "Enterprise account registered from acme-corp.io domain.",
    type: "info",
    metadata: { plan: "Enterprise", domain: "acme-corp.io" },
  },
  {
    id: "evt-3",
    timestamp: "47 minutes ago",
    title: "Security alert resolved",
    description: "Rate-limit threshold exceeded on /api/auth endpoint. Auto-mitigated.",
    type: "warning",
    metadata: { endpoint: "/api/auth", action: "rate-limited" },
  },
  {
    id: "evt-4",
    timestamp: "1 hour ago",
    title: "API schema updated",
    description: "GraphQL schema v3.2 published with 4 new query fields.",
    type: "info",
    metadata: { schema: "v3.2", fields: "+4" },
  },
  {
    id: "evt-5",
    timestamp: "2 hours ago",
    title: "System health check passed",
    description: "All 12 service nodes reporting nominal. Memory and CPU within thresholds.",
    type: "success",
    metadata: { nodes: "12/12", status: "nominal" },
  },
];

const DEPLOY_STEPS: GlassStep[] = [
  { label: "Build", description: "Compile & bundle" },
  { label: "Test", description: "Run test suite" },
  { label: "Stage", description: "Staging deploy" },
  { label: "Deploy", description: "Production push" },
];

// ============================================================================
// ACTION BUTTON
// ============================================================================

function ActionButton({
  icon,
  label,
  glassTokens,
  shouldAnimate,
  index,
}: {
  icon: React.ReactNode;
  label: string;
  glassTokens: ReturnType<typeof useGlassTokens>;
  shouldAnimate: boolean;
  index: number;
}) {
  return (
    <motion.button
      type="button"
      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-left transition-colors"
      style={{
        background: glassTokens.cardBg,
        border: `1px solid ${glassTokens.cardBorder}`,
      }}
      whileHover={{
        borderColor: glassTokens.activeBorder,
        boxShadow: `0 0 12px rgba(34,211,238,0.08)`,
      }}
      initial={shouldAnimate ? { opacity: 0, x: -12 } : {}}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
    >
      <span
        className="flex items-center justify-center w-7 h-7 rounded-md"
        style={{
          background: "rgba(34,211,238,0.06)",
          border: "1px solid rgba(34,211,238,0.12)",
        }}
      >
        {icon}
      </span>
      <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--glia-color-text-primary,#CBD5E1)]">
        {label}
      </span>
    </motion.button>
  );
}

// ============================================================================
// GLASS DASHBOARD
// ============================================================================

export interface GlassDashboardProps {
  className?: string;
}

export function GlassDashboard({ className }: GlassDashboardProps) {
  const glassTokens = useGlassTokens();
  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = !reducedMotion;

  const [activeNav, setActiveNav] = React.useState("dashboard");

  const actions = [
    { icon: <Plus className="h-3.5 w-3.5 text-cyan-400" />, label: "New Cluster" },
    { icon: <Rocket className="h-3.5 w-3.5 text-cyan-400" />, label: "Quick Deploy" },
    { icon: <Download className="h-3.5 w-3.5 text-cyan-400" />, label: "Export Data" },
    { icon: <Zap className="h-3.5 w-3.5 text-cyan-400" />, label: "Run Diagnostics" },
  ];

  return (
    <div
      className={cn("min-h-screen w-full flex flex-col", className)}
      style={{ background: "#02040a" }}
    >
      {/* Navigation */}
      <GlassNavigation
        brand={
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded flex items-center justify-center text-[9px] font-bold text-neutral-900"
              style={{
                background: "linear-gradient(135deg, #22D3EE, #E879F9)",
              }}
            >
              BB
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-[0.12em] text-[var(--glia-color-text-primary,#CBD5E1)]">
              BACKBAY
            </span>
          </div>
        }
        items={NAV_ITEMS}
        activeId={activeNav}
        onItemClick={setActiveNav}
        sticky
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative p-1.5 rounded-md text-[var(--glia-color-text-soft,#64748B)] hover:text-[var(--glia-color-text-primary,#CBD5E1)] transition-colors"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--glia-color-accent,#22D3EE)]" />
            </button>
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[var(--glia-color-accent,#22D3EE)] to-[var(--glia-color-accent-secondary,#E879F9)] flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-neutral-900" />
            </div>
          </div>
        }
      />

      {/* Body */}
      <div className="flex flex-1 gap-6 p-6">
        {/* Main column */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-4">
            {KPI_CARDS.map((card) => (
              <GlassDataCard
                key={card.label}
                label={card.label}
                value={card.value}
                trend={card.trend}
                variant={card.variant}
                sparklineData={card.sparklineData}
              />
            ))}
          </div>

          {/* Timeline */}
          <GlassPanel variant="default" elevation="soft" className="p-5">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.12em] text-[var(--glia-color-text-soft,#64748B)] mb-4">
              Recent Activity
            </h3>
            <GlassTimeline events={TIMELINE_EVENTS} layout="left" showTimestamps />
          </GlassPanel>
        </div>

        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-6">
          {/* Quick Actions */}
          <GlassPanel variant="default" elevation="soft" className="p-4">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.12em] text-[var(--glia-color-text-soft,#64748B)] mb-3">
              Quick Actions
            </h3>
            <div className="flex flex-col gap-2">
              {actions.map((action, i) => (
                <ActionButton
                  key={action.label}
                  icon={action.icon}
                  label={action.label}
                  glassTokens={glassTokens}
                  shouldAnimate={shouldAnimate}
                  index={i}
                />
              ))}
            </div>
          </GlassPanel>

          {/* Deploy Steps */}
          <GlassPanel variant="default" elevation="soft" className="p-4">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.12em] text-[var(--glia-color-text-soft,#64748B)] mb-4">
              Deployment Pipeline
            </h3>
            <GlassSteps
              steps={DEPLOY_STEPS}
              activeStep={2}
              layout="vertical"
            />
          </GlassPanel>

          {/* System Health KPI */}
          <KPIStat
            title="System Health"
            value={99.2}
            suffix="%"
            delta={0.3}
            deltaType="percentage"
            variant="success"
            size="compact"
            sparklineData={[98.5, 98.8, 99.0, 98.9, 99.1, 99.0, 99.2, 99.1, 99.2, 99.2]}
          />
        </div>
      </div>
    </div>
  );
}

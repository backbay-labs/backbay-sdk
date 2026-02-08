import type { Meta, StoryObj } from "@storybook/react";
import { GlassNavigation } from "./GlassNavigation";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  Network,
  Bell,
  User,
} from "lucide-react";
import * as React from "react";

const meta: Meta<typeof GlassNavigation> = {
  title: "Primitives/Organisms/GlassNavigation",
  component: GlassNavigation,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="min-h-[400px] bg-[var(--glia-color-bg-body,#0B1120)]">
        <Story />
        <div className="p-8 flex items-center justify-center h-[300px]">
          <p className="text-[var(--glia-color-text-soft,#64748B)] text-sm">
            Page content area
          </p>
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlassNavigation>;

// ============================================================================
// DEFAULT
// ============================================================================

export const Default: Story = {
  args: {
    brand: (
      <span className="text-xs font-mono font-bold uppercase tracking-[0.12em] text-[var(--glia-color-text-primary,#E2E8F0)]">
        BACKBAY
      </span>
    ),
    items: [
      { id: "dashboard", label: "Dashboard" },
      { id: "analytics", label: "Analytics" },
      { id: "settings", label: "Settings" },
      { id: "clusters", label: "Clusters" },
    ],
    activeId: "dashboard",
  },
};

// ============================================================================
// WITH ACTIONS
// ============================================================================

export const WithActions: Story = {
  args: {
    brand: (
      <span className="text-xs font-mono font-bold uppercase tracking-[0.12em] text-[var(--glia-color-text-primary,#E2E8F0)]">
        BACKBAY
      </span>
    ),
    items: [
      { id: "dashboard", label: "Dashboard" },
      { id: "analytics", label: "Analytics" },
      { id: "clusters", label: "Clusters" },
    ],
    activeId: "dashboard",
    actions: (
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative p-1.5 rounded-md text-[var(--glia-color-text-soft,#64748B)] hover:text-[var(--glia-color-text-primary,#E2E8F0)] transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--glia-color-accent,#22D3EE)]" />
        </button>
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[var(--glia-color-accent,#22D3EE)] to-[var(--glia-color-accent-secondary,#E879F9)] flex items-center justify-center">
          <User className="h-3.5 w-3.5 text-black" />
        </div>
      </div>
    ),
  },
};

// ============================================================================
// WITH ICONS
// ============================================================================

export const WithIcons: Story = {
  args: {
    brand: (
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded bg-gradient-to-br from-[var(--glia-color-accent,#22D3EE)] to-[var(--glia-color-accent-secondary,#E879F9)] flex items-center justify-center text-[9px] font-bold text-black">
          BB
        </div>
        <span className="text-xs font-mono font-bold uppercase tracking-[0.12em] text-[var(--glia-color-text-primary,#E2E8F0)]">
          BACKBAY
        </span>
      </div>
    ),
    items: [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
      { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-3.5 w-3.5" /> },
      { id: "clusters", label: "Clusters", icon: <Network className="h-3.5 w-3.5" /> },
      { id: "settings", label: "Settings", icon: <Settings className="h-3.5 w-3.5" /> },
    ],
    activeId: "analytics",
  },
};

// ============================================================================
// STICKY
// ============================================================================

function StickyDemo() {
  const [activeId, setActiveId] = React.useState("dashboard");
  return (
    <div className="h-[600px] overflow-y-auto bg-[var(--glia-color-bg-body,#0B1120)]">
      <GlassNavigation
        brand={
          <span className="text-xs font-mono font-bold uppercase tracking-[0.12em] text-[var(--glia-color-text-primary,#E2E8F0)]">
            BACKBAY
          </span>
        }
        items={[
          { id: "dashboard", label: "Dashboard" },
          { id: "analytics", label: "Analytics" },
          { id: "clusters", label: "Clusters" },
          { id: "settings", label: "Settings" },
        ]}
        activeId={activeId}
        onItemClick={setActiveId}
        sticky
      />
      <div className="p-8 space-y-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border p-6"
            style={{
              borderColor: "rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <p className="text-sm text-[var(--glia-color-text-soft,#64748B)]">
              Content block {i + 1} — scroll to see sticky navigation
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Sticky: Story = {
  decorators: [
    (Story) => (
      <div className="h-[600px] bg-[var(--glia-color-bg-body,#0B1120)]">
        <Story />
      </div>
    ),
  ],
  render: () => <StickyDemo />,
};

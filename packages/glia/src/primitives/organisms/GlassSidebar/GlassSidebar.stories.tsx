import type { Meta, StoryObj } from "@storybook/react";
import {
  GlassSidebar,
  GlassSidebarHeader,
  GlassSidebarSection,
  GlassSidebarItem,
  GlassSidebarFooter,
} from "./GlassSidebar";
import {
  Home,
  Settings,
  User,
  Bell,
  Search,
  BarChart3,
  BookOpen,
  MessageSquare,
  LogOut,
  ChevronDown,
  Shield,
  Zap,
} from "lucide-react";
import * as React from "react";

const meta: Meta<typeof GlassSidebar> = {
  title: "Primitives/Organisms/GlassSidebar",
  component: GlassSidebar,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    collapsed: { control: "boolean" },
    side: { control: "select", options: ["left", "right"] },
    elevation: { control: "select", options: ["none", "soft", "hud"] },
    showToggle: { control: "boolean" },
    showBorder: { control: "boolean" },
    collapsedWidth: { control: "number" },
    expandedWidth: { control: "number" },
  },
  decorators: [
    (Story) => (
      <div className="flex h-[600px] bg-[var(--theme-bg-body,#0B1120)]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlassSidebar>;

// ============================================================================
// DEFAULT
// ============================================================================

export const Default: Story = {
  args: {
    children: (
      <>
        <GlassSidebarHeader>
          <span className="text-sm font-semibold truncate">Backbay</span>
        </GlassSidebarHeader>
        <GlassSidebarSection title="Main">
          <GlassSidebarItem icon={<Home className="h-4 w-4" />} isActive tooltip="Dashboard">
            Dashboard
          </GlassSidebarItem>
          <GlassSidebarItem icon={<BarChart3 className="h-4 w-4" />} tooltip="Analytics">
            Analytics
          </GlassSidebarItem>
          <GlassSidebarItem icon={<BookOpen className="h-4 w-4" />} tooltip="Library">
            Library
          </GlassSidebarItem>
        </GlassSidebarSection>
        <GlassSidebarSection title="Communication">
          <GlassSidebarItem icon={<MessageSquare className="h-4 w-4" />} tooltip="Messages">
            Messages
          </GlassSidebarItem>
          <GlassSidebarItem icon={<Bell className="h-4 w-4" />} tooltip="Notifications">
            Notifications
          </GlassSidebarItem>
        </GlassSidebarSection>
        <GlassSidebarFooter>
          <GlassSidebarItem icon={<Settings className="h-4 w-4" />} tooltip="Settings">
            Settings
          </GlassSidebarItem>
        </GlassSidebarFooter>
      </>
    ),
  },
};

// ============================================================================
// COLLAPSED
// ============================================================================

export const Collapsed: Story = {
  args: {
    collapsed: true,
    children: (
      <>
        <GlassSidebarHeader>
          <span className="text-sm font-semibold truncate">B</span>
        </GlassSidebarHeader>
        <GlassSidebarSection>
          <GlassSidebarItem icon={<Home className="h-4 w-4" />} isActive tooltip="Dashboard">
            Dashboard
          </GlassSidebarItem>
          <GlassSidebarItem icon={<BarChart3 className="h-4 w-4" />} tooltip="Analytics">
            Analytics
          </GlassSidebarItem>
          <GlassSidebarItem icon={<BookOpen className="h-4 w-4" />} tooltip="Library">
            Library
          </GlassSidebarItem>
          <GlassSidebarItem icon={<MessageSquare className="h-4 w-4" />} tooltip="Messages">
            Messages
          </GlassSidebarItem>
        </GlassSidebarSection>
        <GlassSidebarFooter>
          <GlassSidebarItem icon={<Settings className="h-4 w-4" />} tooltip="Settings">
            Settings
          </GlassSidebarItem>
        </GlassSidebarFooter>
      </>
    ),
  },
};

// ============================================================================
// INTERACTIVE (TOGGLE)
// ============================================================================

function InteractiveSidebar() {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <GlassSidebar collapsed={collapsed} onCollapsedChange={setCollapsed}>
      <GlassSidebarHeader>
        {!collapsed && <span className="text-sm font-semibold">Backbay</span>}
        {collapsed && <span className="text-sm font-semibold">B</span>}
      </GlassSidebarHeader>
      <GlassSidebarSection title="Navigation">
        <GlassSidebarItem icon={<Home className="h-4 w-4" />} isActive tooltip="Dashboard">
          Dashboard
        </GlassSidebarItem>
        <GlassSidebarItem icon={<Search className="h-4 w-4" />} tooltip="Search">
          Search
        </GlassSidebarItem>
        <GlassSidebarItem icon={<BarChart3 className="h-4 w-4" />} tooltip="Analytics">
          Analytics
        </GlassSidebarItem>
        <GlassSidebarItem icon={<BookOpen className="h-4 w-4" />} tooltip="Library">
          Library
        </GlassSidebarItem>
      </GlassSidebarSection>
      <GlassSidebarSection title="Social">
        <GlassSidebarItem icon={<MessageSquare className="h-4 w-4" />} tooltip="Messages">
          Messages
        </GlassSidebarItem>
        <GlassSidebarItem icon={<Bell className="h-4 w-4" />} tooltip="Notifications">
          Notifications
        </GlassSidebarItem>
      </GlassSidebarSection>
      <GlassSidebarFooter>
        <GlassSidebarItem icon={<Settings className="h-4 w-4" />} tooltip="Settings">
          Settings
        </GlassSidebarItem>
      </GlassSidebarFooter>
    </GlassSidebar>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveSidebar />,
};

// ============================================================================
// RIGHT SIDE
// ============================================================================

export const RightSide: Story = {
  decorators: [
    (Story) => (
      <div className="flex h-[600px] bg-[var(--theme-bg-body,#0B1120)] justify-end w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    side: "right",
    children: (
      <>
        <GlassSidebarHeader>
          <span className="text-sm font-semibold truncate">Inspector</span>
        </GlassSidebarHeader>
        <GlassSidebarSection title="Properties">
          <GlassSidebarItem icon={<Settings className="h-4 w-4" />} tooltip="Settings">
            Settings
          </GlassSidebarItem>
          <GlassSidebarItem icon={<Shield className="h-4 w-4" />} tooltip="Security">
            Security
          </GlassSidebarItem>
          <GlassSidebarItem icon={<Zap className="h-4 w-4" />} tooltip="Performance">
            Performance
          </GlassSidebarItem>
        </GlassSidebarSection>
      </>
    ),
  },
};

// ============================================================================
// WITH BADGES
// ============================================================================

export const WithBadges: Story = {
  args: {
    children: (
      <>
        <GlassSidebarHeader>
          <span className="text-sm font-semibold truncate">Backbay</span>
        </GlassSidebarHeader>
        <GlassSidebarSection title="Main">
          <GlassSidebarItem icon={<Home className="h-4 w-4" />} isActive tooltip="Dashboard">
            Dashboard
          </GlassSidebarItem>
          <GlassSidebarItem
            icon={<MessageSquare className="h-4 w-4" />}
            tooltip="Messages"
            badge={
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--theme-accent-primary,#22D3EE)] px-1.5 text-[10px] font-bold text-black">
                3
              </span>
            }
          >
            Messages
          </GlassSidebarItem>
          <GlassSidebarItem
            icon={<Bell className="h-4 w-4" />}
            tooltip="Notifications"
            badge={
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--theme-accent-destructive,#F43F5E)] px-1.5 text-[10px] font-bold text-white">
                12
              </span>
            }
          >
            Notifications
          </GlassSidebarItem>
          <GlassSidebarItem
            icon={<BarChart3 className="h-4 w-4" />}
            tooltip="Analytics"
            badge={
              <span className="text-[10px] text-[var(--theme-text-soft,#64748B)]">New</span>
            }
          >
            Analytics
          </GlassSidebarItem>
        </GlassSidebarSection>
      </>
    ),
  },
};

// ============================================================================
// WITH HEADER & FOOTER
// ============================================================================

export const WithHeaderFooter: Story = {
  args: {
    children: (
      <>
        <GlassSidebarHeader>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[var(--theme-accent-primary,#22D3EE)] to-[var(--theme-accent-secondary,#E879F9)] flex items-center justify-center text-[10px] font-bold text-black">
              BB
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold leading-none">Backbay</span>
              <span className="text-[10px] text-[var(--theme-text-soft,#64748B)] leading-none mt-0.5">
                Industries
              </span>
            </div>
          </div>
        </GlassSidebarHeader>
        <GlassSidebarSection title="Workspace">
          <GlassSidebarItem icon={<Home className="h-4 w-4" />} isActive tooltip="Dashboard">
            Dashboard
          </GlassSidebarItem>
          <GlassSidebarItem icon={<BarChart3 className="h-4 w-4" />} tooltip="Analytics">
            Analytics
          </GlassSidebarItem>
          <GlassSidebarItem icon={<BookOpen className="h-4 w-4" />} tooltip="Library">
            Library
          </GlassSidebarItem>
        </GlassSidebarSection>
        <GlassSidebarFooter>
          <div className="flex items-center gap-2 w-full">
            <div className="h-7 w-7 rounded-full bg-[var(--theme-glass-card-bg,rgba(255,255,255,0.06))] flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-[var(--theme-text-soft,#64748B)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">Jane Doe</div>
              <div className="text-[10px] text-[var(--theme-text-soft,#64748B)] truncate">
                jane@backbay.io
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[var(--theme-text-soft,#64748B)] flex-shrink-0" />
          </div>
        </GlassSidebarFooter>
      </>
    ),
  },
};

// ============================================================================
// ACTIVE ITEM
// ============================================================================

export const ActiveItem: Story = {
  args: {
    children: (
      <>
        <GlassSidebarHeader>
          <span className="text-sm font-semibold truncate">Backbay</span>
        </GlassSidebarHeader>
        <GlassSidebarSection>
          <GlassSidebarItem icon={<Home className="h-4 w-4" />} tooltip="Dashboard">
            Dashboard
          </GlassSidebarItem>
          <GlassSidebarItem icon={<BarChart3 className="h-4 w-4" />} isActive tooltip="Analytics">
            Analytics
          </GlassSidebarItem>
          <GlassSidebarItem icon={<BookOpen className="h-4 w-4" />} tooltip="Library">
            Library
          </GlassSidebarItem>
          <GlassSidebarItem icon={<MessageSquare className="h-4 w-4" />} tooltip="Messages">
            Messages
          </GlassSidebarItem>
        </GlassSidebarSection>
      </>
    ),
  },
};

// ============================================================================
// WITH TOOLTIPS (collapsed)
// ============================================================================

export const WithTooltips: Story = {
  args: {
    collapsed: true,
    children: (
      <>
        <GlassSidebarHeader>
          <span className="text-sm font-semibold">B</span>
        </GlassSidebarHeader>
        <GlassSidebarSection>
          <GlassSidebarItem icon={<Home className="h-4 w-4" />} isActive tooltip="Dashboard">
            Dashboard
          </GlassSidebarItem>
          <GlassSidebarItem icon={<Search className="h-4 w-4" />} tooltip="Search">
            Search
          </GlassSidebarItem>
          <GlassSidebarItem icon={<BarChart3 className="h-4 w-4" />} tooltip="Analytics">
            Analytics
          </GlassSidebarItem>
          <GlassSidebarItem icon={<BookOpen className="h-4 w-4" />} tooltip="Library">
            Library
          </GlassSidebarItem>
          <GlassSidebarItem icon={<MessageSquare className="h-4 w-4" />} tooltip="Messages">
            Messages
          </GlassSidebarItem>
        </GlassSidebarSection>
        <GlassSidebarFooter>
          <GlassSidebarItem icon={<Settings className="h-4 w-4" />} tooltip="Settings">
            Settings
          </GlassSidebarItem>
        </GlassSidebarFooter>
      </>
    ),
  },
};

// ============================================================================
// DESKTOP LAYOUT
// ============================================================================

function DesktopLayoutExample() {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="flex h-[600px] w-full bg-[var(--theme-bg-body,#0B1120)]">
      <GlassSidebar collapsed={collapsed} onCollapsedChange={setCollapsed}>
        <GlassSidebarHeader>
          {!collapsed && <span className="text-sm font-semibold">Backbay OS</span>}
          {collapsed && <span className="text-sm font-semibold">B</span>}
        </GlassSidebarHeader>
        <GlassSidebarSection title="Navigation">
          <GlassSidebarItem icon={<Home className="h-4 w-4" />} isActive tooltip="Dashboard">
            Dashboard
          </GlassSidebarItem>
          <GlassSidebarItem icon={<BarChart3 className="h-4 w-4" />} tooltip="Analytics">
            Analytics
          </GlassSidebarItem>
          <GlassSidebarItem icon={<BookOpen className="h-4 w-4" />} tooltip="Library">
            Library
          </GlassSidebarItem>
        </GlassSidebarSection>
        <GlassSidebarSection title="Social">
          <GlassSidebarItem icon={<MessageSquare className="h-4 w-4" />} tooltip="Messages">
            Messages
          </GlassSidebarItem>
          <GlassSidebarItem icon={<Bell className="h-4 w-4" />} tooltip="Notifications">
            Notifications
          </GlassSidebarItem>
        </GlassSidebarSection>
        <GlassSidebarFooter>
          <div className="flex items-center gap-2 w-full">
            <div className="h-7 w-7 rounded-full bg-[var(--theme-glass-card-bg,rgba(255,255,255,0.06))] flex items-center justify-center flex-shrink-0">
              <User className="h-3.5 w-3.5 text-[var(--theme-text-soft,#64748B)]" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">Jane Doe</div>
              </div>
            )}
          </div>
        </GlassSidebarFooter>
      </GlassSidebar>
      <main className="flex-1 p-8">
        <div className="rounded-xl border border-[var(--theme-border,rgba(255,255,255,0.08))] p-6 h-full flex items-center justify-center">
          <p className="text-[var(--theme-text-soft,#64748B)] text-sm">
            Main content area. Click the toggle button to collapse the sidebar.
          </p>
        </div>
      </main>
    </div>
  );
}

export const DesktopLayout: Story = {
  decorators: [
    (Story) => (
      <div className="h-[600px] w-full bg-[var(--theme-bg-body,#0B1120)]">
        <Story />
      </div>
    ),
  ],
  render: () => <DesktopLayoutExample />,
};

// ============================================================================
// HUD ELEVATION
// ============================================================================

export const HUDElevation: Story = {
  args: {
    elevation: "hud",
    children: (
      <>
        <GlassSidebarHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--theme-accent-primary,#22D3EE)]" />
            <span className="text-sm font-semibold truncate">HUD Panel</span>
          </div>
        </GlassSidebarHeader>
        <GlassSidebarSection title="Systems">
          <GlassSidebarItem icon={<Zap className="h-4 w-4" />} isActive tooltip="Power">
            Power Grid
          </GlassSidebarItem>
          <GlassSidebarItem icon={<Shield className="h-4 w-4" />} tooltip="Security">
            Security
          </GlassSidebarItem>
          <GlassSidebarItem icon={<BarChart3 className="h-4 w-4" />} tooltip="Telemetry">
            Telemetry
          </GlassSidebarItem>
        </GlassSidebarSection>
        <GlassSidebarFooter>
          <GlassSidebarItem icon={<LogOut className="h-4 w-4" />} tooltip="Disconnect">
            Disconnect
          </GlassSidebarItem>
        </GlassSidebarFooter>
      </>
    ),
  },
};

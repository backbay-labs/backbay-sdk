import type { Meta, StoryObj } from "@storybook/react";
import { GlassPanel, GlassHeader, GlassCard, GlassSection } from "./GlassPanel";
import { Settings, Bell, User, ChevronRight, Zap, Shield, Sparkles } from "lucide-react";
import { GlowButton } from "../../atoms/GlowButton/GlowButton";

const meta: Meta<typeof GlassPanel> = {
  title: "Primitives/Organisms/GlassPanel",
  component: GlassPanel,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "prominent", "card", "flush"],
    },
    elevation: {
      control: "select",
      options: ["none", "soft", "hud", "modal"],
    },
    interactive: {
      control: "boolean",
    },
    showHoverGlow: {
      control: "boolean",
    },
    isActive: {
      control: "boolean",
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 min-h-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlassPanel>;

export const Default: Story = {
  args: {
    children: (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2">Glass Panel</h3>
        <p className="text-muted-foreground text-sm">
          A beautiful glassmorphism panel with backdrop blur and subtle borders.
        </p>
      </div>
    ),
    className: "w-80",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 w-[600px]">
      <GlassPanel variant="default" className="p-4">
        <h4 className="font-medium">Default</h4>
        <p className="text-sm text-muted-foreground">Standard rounded corners</p>
      </GlassPanel>
      <GlassPanel variant="prominent" className="p-4">
        <h4 className="font-medium">Prominent</h4>
        <p className="text-sm text-muted-foreground">Larger border radius</p>
      </GlassPanel>
      <GlassPanel variant="card" className="p-4">
        <h4 className="font-medium">Card</h4>
        <p className="text-sm text-muted-foreground">Subtle card style</p>
      </GlassPanel>
      <GlassPanel variant="flush" className="p-4">
        <h4 className="font-medium">Flush</h4>
        <p className="text-sm text-muted-foreground">No border radius</p>
      </GlassPanel>
    </div>
  ),
};

export const Elevations: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <GlassPanel elevation="none" className="p-4">
        <h4 className="font-medium">None</h4>
        <p className="text-sm text-muted-foreground">No shadow</p>
      </GlassPanel>
      <GlassPanel elevation="soft" className="p-4">
        <h4 className="font-medium">Soft</h4>
        <p className="text-sm text-muted-foreground">Subtle drop shadow</p>
      </GlassPanel>
      <GlassPanel elevation="hud" className="p-4">
        <h4 className="font-medium">HUD</h4>
        <p className="text-sm text-muted-foreground">HUD panel shadow</p>
      </GlassPanel>
      <GlassPanel elevation="modal" className="p-4">
        <h4 className="font-medium">Modal</h4>
        <p className="text-sm text-muted-foreground">Modal/overlay shadow</p>
      </GlassPanel>
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    interactive: true,
    showHoverGlow: true,
    children: (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2">Interactive Panel</h3>
        <p className="text-muted-foreground text-sm">
          Hover over this panel to see the glow effect and border highlight.
        </p>
      </div>
    ),
    className: "w-80",
  },
};

export const ActiveState: Story = {
  render: () => (
    <div className="flex gap-4">
      <GlassPanel className="p-4 w-40">
        <h4 className="font-medium">Normal</h4>
      </GlassPanel>
      <GlassPanel isActive className="p-4 w-40">
        <h4 className="font-medium">Active</h4>
      </GlassPanel>
    </div>
  ),
};

export const WithHeader: Story = {
  render: () => (
    <GlassPanel className="w-80">
      <GlassHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Settings</span>
        </div>
        <button className="text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-4 w-4" />
        </button>
      </GlassHeader>
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Panel content goes here with a stylish header above.
        </p>
      </div>
    </GlassPanel>
  ),
};

export const WithSections: Story = {
  render: () => (
    <GlassPanel className="w-80">
      <GlassHeader>
        <span className="font-medium">User Profile</span>
      </GlassHeader>
      <GlassSection title="Personal Info">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Name</span>
            <span>John Doe</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>john@example.com</span>
          </div>
        </div>
      </GlassSection>
      <GlassSection title="Preferences">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Theme</span>
            <span>Dark</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Language</span>
            <span>English</span>
          </div>
        </div>
      </GlassSection>
    </GlassPanel>
  ),
};

export const GlassCardExamples: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <GlassCard>
        <h4 className="font-medium mb-1">Basic Card</h4>
        <p className="text-sm text-muted-foreground">Simple glass card content</p>
      </GlassCard>
      <GlassCard interactive>
        <h4 className="font-medium mb-1">Interactive Card</h4>
        <p className="text-sm text-muted-foreground">Hover for glow effect</p>
      </GlassCard>
      <GlassCard isActive>
        <h4 className="font-medium mb-1">Active Card</h4>
        <p className="text-sm text-muted-foreground">Currently selected state</p>
      </GlassCard>
    </div>
  ),
};

export const NotificationPanel: Story = {
  render: () => (
    <GlassPanel className="w-96">
      <GlassHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-cyan-neon" />
          <span className="font-medium">Notifications</span>
        </div>
        <span className="text-xs text-muted-foreground">3 new</span>
      </GlassHeader>
      <div className="p-2 space-y-2">
        <GlassCard interactive className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-cyan-neon/20 flex items-center justify-center">
            <Zap className="h-4 w-4 text-cyan-neon" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">New achievement unlocked!</p>
            <p className="text-xs text-muted-foreground">Speed Demon - 5 min ago</p>
          </div>
        </GlassCard>
        <GlassCard interactive className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-neon/20 flex items-center justify-center">
            <Shield className="h-4 w-4 text-emerald-neon" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Weekly goal completed</p>
            <p className="text-xs text-muted-foreground">Practice - 1 hour ago</p>
          </div>
        </GlassCard>
        <GlassCard interactive className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-magenta-neon/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-magenta-neon" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">New content available</p>
            <p className="text-xs text-muted-foreground">Library - 2 hours ago</p>
          </div>
        </GlassCard>
      </div>
    </GlassPanel>
  ),
};

export const UserCard: Story = {
  render: () => (
    <GlassPanel variant="prominent" className="w-80" showHoverGlow>
      <div className="p-6 text-center">
        <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-cyan-neon to-magenta-neon p-1 mb-4">
          <div className="h-full w-full rounded-full bg-card flex items-center justify-center">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-semibold">Jane Developer</h3>
        <p className="text-sm text-muted-foreground mb-4">Senior Engineer</p>
        <div className="flex justify-center gap-6 text-center mb-4">
          <div>
            <div className="text-lg font-bold text-cyan-neon">142</div>
            <div className="text-xs text-muted-foreground">Projects</div>
          </div>
          <div>
            <div className="text-lg font-bold text-magenta-neon">2.4k</div>
            <div className="text-xs text-muted-foreground">Followers</div>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-neon">98%</div>
            <div className="text-xs text-muted-foreground">Success</div>
          </div>
        </div>
        <GlowButton className="w-full">View Profile</GlowButton>
      </div>
    </GlassPanel>
  ),
};

export const SettingsPanel: Story = {
  render: () => (
    <GlassPanel className="w-96">
      <GlassHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="font-medium">Quick Settings</span>
        </div>
      </GlassHeader>
      <GlassSection title="Display">
        <div className="space-y-3">
          <GlassCard interactive className="flex items-center justify-between">
            <span className="text-sm">Dark Mode</span>
            <div className="h-5 w-9 rounded-full bg-cyan-neon/30 relative">
              <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-cyan-neon" />
            </div>
          </GlassCard>
          <GlassCard interactive className="flex items-center justify-between">
            <span className="text-sm">Reduce Motion</span>
            <div className="h-5 w-9 rounded-full bg-muted relative">
              <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-muted-foreground" />
            </div>
          </GlassCard>
        </div>
      </GlassSection>
      <GlassSection title="Sound">
        <GlassCard interactive className="flex items-center justify-between">
          <span className="text-sm">Sound Effects</span>
          <div className="h-5 w-9 rounded-full bg-cyan-neon/30 relative">
            <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-cyan-neon" />
          </div>
        </GlassCard>
      </GlassSection>
    </GlassPanel>
  ),
};

export const CompactSection: Story = {
  render: () => (
    <GlassPanel className="w-64">
      <GlassSection title="Stats" compact>
        <div className="grid grid-cols-2 gap-2">
          <GlassCard className="text-center p-2">
            <div className="text-lg font-bold text-cyan-neon">47</div>
            <div className="text-[10px] text-muted-foreground">Completed</div>
          </GlassCard>
          <GlassCard className="text-center p-2">
            <div className="text-lg font-bold text-magenta-neon">12</div>
            <div className="text-[10px] text-muted-foreground">Pending</div>
          </GlassCard>
        </div>
      </GlassSection>
    </GlassPanel>
  ),
};

export const AsNavigation: Story = {
  args: {
    as: "nav",
    className: "w-64",
    children: (
      <div className="p-2 space-y-1">
        <GlassCard interactive isActive className="flex items-center gap-3">
          <Settings className="h-4 w-4" />
          <span className="text-sm">Dashboard</span>
        </GlassCard>
        <GlassCard interactive className="flex items-center gap-3">
          <User className="h-4 w-4" />
          <span className="text-sm">Profile</span>
        </GlassCard>
        <GlassCard interactive className="flex items-center gap-3">
          <Bell className="h-4 w-4" />
          <span className="text-sm">Notifications</span>
        </GlassCard>
      </div>
    ),
  },
};

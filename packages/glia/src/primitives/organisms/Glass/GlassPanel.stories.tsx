import type { Meta, StoryObj } from "@storybook/react";
import { GlassPanel, GlassHeader, GlassCard, GlassSection } from "./GlassPanel";
import { Settings, Bell, User, ChevronRight, Zap, Shield, Sparkles, TrendingUp, Activity, Cpu, Wifi } from "lucide-react";
import { GlowButton } from "../../atoms/GlowButton/GlowButton";
import { UiThemeProvider } from "../../../theme";
import { GLASS_MATERIALS, type GlassMaterialId } from "../../../theme/materials";

const WithTheme = ({ children }: { children: React.ReactNode }) => (
  <UiThemeProvider>
    <div style={{ background: "#02040a", padding: 40, minHeight: 400 }}>
      {children}
    </div>
  </UiThemeProvider>
);

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
    material: {
      control: "select",
      options: [undefined, "frosted", "thin", "thick", "clear", "holographic"],
    },
    showNoise: {
      control: "boolean",
    },
    noiseOpacity: {
      control: { type: "range", min: 0, max: 0.2, step: 0.01 },
    },
    forceReducedTransparency: {
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

// ============================================================================
// DEFAULT — Dashboard status card with rich content
// ============================================================================

export const Default: Story = {
  render: () => (
    <WithTheme>
      <GlassPanel
        material="frosted"
        showNoise
        showHoverGlow
        className="w-80"
      >
        <div style={{ padding: 24 }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#64748B",
              marginBottom: 12,
            }}
          >
            System Status
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: "#E5E7EB", lineHeight: 1 }}>
              98.7%
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#10B981",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <TrendingUp style={{ width: 14, height: 14 }} />
              +2.3%
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.5, margin: 0 }}>
            All systems nominal. Uptime has increased over the last 24-hour window
            with zero critical incidents reported.
          </p>
        </div>
      </GlassPanel>
    </WithTheme>
  ),
};

// ============================================================================
// ALL MATERIALS — Side-by-side comparison
// ============================================================================

export const AllMaterials: Story = {
  render: () => (
    <WithTheme>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, maxWidth: 900 }}>
        {(Object.keys(GLASS_MATERIALS) as GlassMaterialId[]).map((id) => {
          const mat = GLASS_MATERIALS[id];
          return (
            <GlassPanel key={id} material={id} className="p-5" style={{ minHeight: 140 }}>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#64748B",
                  marginBottom: 8,
                }}
              >
                {id}
              </div>
              <h4 style={{ fontWeight: 600, marginBottom: 4, color: "#E5E7EB", fontSize: 15 }}>{mat.name}</h4>
              <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
                {mat.backdropFilter} / saturate {mat.saturate}% / brightness {mat.brightness}%
              </p>
              <p style={{ fontSize: 11, color: "#64748B", marginTop: 8 }}>
                noise: {mat.showNoise ? `${mat.noisePreset} @ ${mat.noiseOpacity}` : "off"}
              </p>
            </GlassPanel>
          );
        })}
      </div>
    </WithTheme>
  ),
};

// ============================================================================
// INTERACTIVE — Grid of GlassCards with hover effects
// ============================================================================

const interactiveCards = [
  { icon: <Activity style={{ width: 20, height: 20, color: "#22D3EE" }} />, label: "Network", value: "1.2 Gbps", accent: "#22D3EE" },
  { icon: <Cpu style={{ width: 20, height: 20, color: "#F43F5E" }} />, label: "Compute", value: "68%", accent: "#F43F5E" },
  { icon: <Shield style={{ width: 20, height: 20, color: "#10B981" }} />, label: "Security", value: "Nominal", accent: "#10B981" },
  { icon: <Wifi style={{ width: 20, height: 20, color: "#8B5CF6" }} />, label: "Uplink", value: "Active", accent: "#8B5CF6" },
];

export const Interactive: Story = {
  render: () => (
    <WithTheme>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, maxWidth: 480 }}>
        {interactiveCards.map((card) => (
          <GlassCard key={card.label} interactive>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 4 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `${card.accent}15`,
                }}
              >
                {card.icon}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#64748B",
                  }}
                >
                  {card.label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#E5E7EB" }}>
                  {card.value}
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </WithTheme>
  ),
};

// ============================================================================
// NESTED GLASS — Glass-in-glass layering
// ============================================================================

export const NestedGlass: Story = {
  render: () => (
    <WithTheme>
      <GlassPanel material="frosted" showNoise className="p-6" style={{ width: 480 }}>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#64748B",
            marginBottom: 16,
          }}
        >
          Cluster Overview
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          <GlassCard interactive>
            <div style={{ textAlign: "center", padding: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#22D3EE" }}>47</div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#64748B",
                  marginTop: 4,
                }}
              >
                Active Nodes
              </div>
            </div>
          </GlassCard>
          <GlassCard interactive>
            <div style={{ textAlign: "center", padding: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#F43F5E" }}>12</div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#64748B",
                  marginTop: 4,
                }}
              >
                Pending Jobs
              </div>
            </div>
          </GlassCard>
          <GlassCard interactive>
            <div style={{ textAlign: "center", padding: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#10B981" }}>99.2%</div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#64748B",
                  marginTop: 4,
                }}
              >
                SLA Uptime
              </div>
            </div>
          </GlassCard>
          <GlassCard interactive>
            <div style={{ textAlign: "center", padding: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#8B5CF6" }}>3.2s</div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#64748B",
                  marginTop: 4,
                }}
              >
                Avg Latency
              </div>
            </div>
          </GlassCard>
        </div>
      </GlassPanel>
    </WithTheme>
  ),
};

// ============================================================================
// EXISTING STORIES (kept)
// ============================================================================

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

// ============================================================================
// MATERIAL STORIES
// ============================================================================

export const MaterialComparison: Story = {
  render: () => (
    <WithTheme>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, maxWidth: 900 }}>
        {(Object.keys(GLASS_MATERIALS) as GlassMaterialId[]).map((id) => {
          const mat = GLASS_MATERIALS[id];
          return (
            <GlassPanel key={id} material={id} className="p-5" style={{ minHeight: 140 }}>
              <h4 style={{ fontWeight: 600, marginBottom: 4, color: "#E5E7EB" }}>{mat.name}</h4>
              <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>
                {mat.backdropFilter} / saturate {mat.saturate}% / brightness {mat.brightness}%
              </p>
              <p style={{ fontSize: 11, color: "#64748B", marginTop: 8 }}>
                noise: {mat.showNoise ? `${mat.noisePreset} @ ${mat.noiseOpacity}` : "off"}
              </p>
            </GlassPanel>
          );
        })}
      </div>
    </WithTheme>
  ),
};

export const MaterialFrosted: Story = {
  render: () => (
    <WithTheme>
      <GlassPanel material="frosted" className="p-6" style={{ width: 320 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8, color: "#E5E7EB" }}>Frosted Glass</h3>
        <p style={{ fontSize: 13, color: "#94A3B8" }}>
          The default material with medium blur, noise grain, and enhanced saturation.
        </p>
      </GlassPanel>
    </WithTheme>
  ),
};

export const MaterialThin: Story = {
  render: () => (
    <WithTheme>
      <GlassPanel material="thin" className="p-6" style={{ width: 320 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8, color: "#E5E7EB" }}>Thin Glass</h3>
        <p style={{ fontSize: 13, color: "#94A3B8" }}>
          Minimal blur and low opacity for subtle layering.
        </p>
      </GlassPanel>
    </WithTheme>
  ),
};

export const MaterialThick: Story = {
  render: () => (
    <WithTheme>
      <GlassPanel material="thick" elevation="modal" className="p-6" style={{ width: 320 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8, color: "#E5E7EB" }}>Thick Glass</h3>
        <p style={{ fontSize: 13, color: "#94A3B8" }}>
          Heavy blur and opaque background for modals and dialogs.
        </p>
      </GlassPanel>
    </WithTheme>
  ),
};

export const MaterialHolographic: Story = {
  render: () => (
    <WithTheme>
      <GlassPanel material="holographic" className="p-6" style={{ width: 320 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8, color: "#E5E7EB" }}>Holographic Glass</h3>
        <p style={{ fontSize: 13, color: "#94A3B8" }}>
          Vibrant saturation with heavy noise for a sci-fi aesthetic.
        </p>
      </GlassPanel>
    </WithTheme>
  ),
};

export const WithNoiseOverlay: Story = {
  render: () => (
    <WithTheme>
      <div style={{ display: "flex", gap: 24 }}>
        <GlassPanel showNoise noiseOpacity={0.02} className="p-5" style={{ width: 200 }}>
          <h4 style={{ fontWeight: 600, color: "#E5E7EB", marginBottom: 4 }}>Subtle</h4>
          <p style={{ fontSize: 12, color: "#94A3B8" }}>opacity: 0.02</p>
        </GlassPanel>
        <GlassPanel showNoise noiseOpacity={0.06} className="p-5" style={{ width: 200 }}>
          <h4 style={{ fontWeight: 600, color: "#E5E7EB", marginBottom: 4 }}>Medium</h4>
          <p style={{ fontSize: 12, color: "#94A3B8" }}>opacity: 0.06</p>
        </GlassPanel>
        <GlassPanel showNoise noiseOpacity={0.12} className="p-5" style={{ width: 200 }}>
          <h4 style={{ fontWeight: 600, color: "#E5E7EB", marginBottom: 4 }}>Heavy</h4>
          <p style={{ fontSize: 12, color: "#94A3B8" }}>opacity: 0.12</p>
        </GlassPanel>
      </div>
    </WithTheme>
  ),
};

export const ReducedTransparency: Story = {
  render: () => (
    <WithTheme>
      <div style={{ display: "flex", gap: 24 }}>
        <GlassPanel material="frosted" className="p-5" style={{ width: 240 }}>
          <h4 style={{ fontWeight: 600, color: "#E5E7EB", marginBottom: 4 }}>Normal</h4>
          <p style={{ fontSize: 12, color: "#94A3B8" }}>
            Full glassmorphism with blur, noise, and transparency.
          </p>
        </GlassPanel>
        <GlassPanel material="frosted" forceReducedTransparency className="p-5" style={{ width: 240 }}>
          <h4 style={{ fontWeight: 600, color: "#E5E7EB", marginBottom: 4 }}>Reduced Transparency</h4>
          <p style={{ fontSize: 12, color: "#94A3B8" }}>
            Solid background, no blur, no noise. Accessible fallback.
          </p>
        </GlassPanel>
      </div>
    </WithTheme>
  ),
};

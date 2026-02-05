import type { Meta, StoryObj } from "@storybook/react";
import { IconPulse } from "./IconPulse";
import {
  Activity,
  AlertCircle,
  Bell,
  CheckCircle,
  Heart,
  Settings,
  Sparkles,
  Zap,
  Radio,
  Cpu,
  Wifi,
  Database,
} from "lucide-react";

const meta: Meta<typeof IconPulse> = {
  title: "Primitives/Atoms/IconPulse",
  component: IconPulse,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "muted", "accent", "success", "warning", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg", "xl"],
    },
    intensity: {
      control: "select",
      options: ["none", "low", "medium", "high"],
    },
    interactive: {
      control: "select",
      options: ["none", "hover", "button"],
    },
    pulse: {
      control: "boolean",
    },
    continuousPulse: {
      control: "boolean",
    },
    disableAnimations: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof IconPulse>;

export const Default: Story = {
  args: {
    icon: <Activity className="w-full h-full" />,
    variant: "default",
    size: "default",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8 items-center">
      <IconPulse icon={<Activity className="w-full h-full" />} variant="default" />
      <IconPulse icon={<Activity className="w-full h-full" />} variant="muted" />
      <IconPulse icon={<Zap className="w-full h-full" />} variant="accent" />
      <IconPulse icon={<CheckCircle className="w-full h-full" />} variant="success" />
      <IconPulse icon={<AlertCircle className="w-full h-full" />} variant="warning" />
      <IconPulse icon={<AlertCircle className="w-full h-full" />} variant="danger" />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8 items-end">
      <div className="flex flex-col items-center gap-2">
        <IconPulse icon={<Sparkles className="w-full h-full" />} size="sm" variant="accent" />
        <span className="text-xs text-muted-foreground">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconPulse icon={<Sparkles className="w-full h-full" />} size="default" variant="accent" />
        <span className="text-xs text-muted-foreground">default</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconPulse icon={<Sparkles className="w-full h-full" />} size="lg" variant="accent" />
        <span className="text-xs text-muted-foreground">lg</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconPulse icon={<Sparkles className="w-full h-full" />} size="xl" variant="accent" />
        <span className="text-xs text-muted-foreground">xl</span>
      </div>
    </div>
  ),
};

export const GlowIntensities: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8 items-center">
      <div className="flex flex-col items-center gap-2">
        <IconPulse icon={<Zap className="w-full h-full" />} size="lg" variant="accent" intensity="none" />
        <span className="text-xs text-muted-foreground">none</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconPulse icon={<Zap className="w-full h-full" />} size="lg" variant="accent" intensity="low" />
        <span className="text-xs text-muted-foreground">low</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconPulse icon={<Zap className="w-full h-full" />} size="lg" variant="accent" intensity="medium" />
        <span className="text-xs text-muted-foreground">medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconPulse icon={<Zap className="w-full h-full" />} size="lg" variant="accent" intensity="high" />
        <span className="text-xs text-muted-foreground">high</span>
      </div>
    </div>
  ),
};

export const ContinuousPulse: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8 items-center">
      <IconPulse
        icon={<Radio className="w-full h-full" />}
        size="lg"
        variant="accent"
        intensity="medium"
        continuousPulse
      />
      <IconPulse
        icon={<Heart className="w-full h-full" />}
        size="lg"
        variant="danger"
        intensity="medium"
        continuousPulse
      />
      <IconPulse
        icon={<Wifi className="w-full h-full" />}
        size="lg"
        variant="success"
        intensity="medium"
        continuousPulse
      />
    </div>
  ),
};

export const Interactive: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8 items-center">
      <div className="flex flex-col items-center gap-2">
        <IconPulse
          icon={<Bell className="w-full h-full" />}
          size="lg"
          variant="accent"
          onClick={() => alert("Bell clicked!")}
          aria-label="Notifications"
        />
        <span className="text-xs text-muted-foreground">Clickable</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconPulse
          icon={<Settings className="w-full h-full" />}
          size="lg"
          variant="default"
          interactive="hover"
        />
        <span className="text-xs text-muted-foreground">Hover only</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <IconPulse
          icon={<Settings className="w-full h-full" />}
          size="lg"
          variant="default"
          pulse
        />
        <span className="text-xs text-muted-foreground">Pulse on hover</span>
      </div>
    </div>
  ),
};

export const StatusIndicators: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6 items-center p-6 rounded-lg bg-card/50 border border-border/50">
      <div className="flex items-center gap-2">
        <IconPulse
          icon={<Cpu className="w-full h-full" />}
          size="default"
          variant="success"
          intensity="low"
          continuousPulse
        />
        <span className="text-sm text-foreground">CPU Active</span>
      </div>
      <div className="flex items-center gap-2">
        <IconPulse
          icon={<Database className="w-full h-full" />}
          size="default"
          variant="warning"
          intensity="medium"
          continuousPulse
        />
        <span className="text-sm text-foreground">Database Syncing</span>
      </div>
      <div className="flex items-center gap-2">
        <IconPulse
          icon={<Wifi className="w-full h-full" />}
          size="default"
          variant="danger"
          intensity="high"
          continuousPulse
        />
        <span className="text-sm text-foreground">Connection Lost</span>
      </div>
    </div>
  ),
};

export const HighIntensityGlow: Story = {
  args: {
    icon: <Sparkles className="w-full h-full" />,
    variant: "accent",
    size: "xl",
    intensity: "high",
    continuousPulse: true,
  },
};

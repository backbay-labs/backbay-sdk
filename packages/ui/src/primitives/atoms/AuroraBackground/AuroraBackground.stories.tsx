import type { Meta, StoryObj } from "@storybook/react";
import { AuroraBackground } from "./AuroraBackground";

const meta: Meta<typeof AuroraBackground> = {
  title: "Primitives/Atoms/AuroraBackground",
  component: AuroraBackground,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    showRadialGradient: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof AuroraBackground>;

export const Default: Story = {
  args: {
    showRadialGradient: true,
    children: (
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Aurora Background</h1>
        <p className="text-lg text-muted-foreground max-w-md">
          A mesmerizing aurora borealis effect for hero sections and landing pages.
        </p>
      </div>
    ),
  },
};

export const WithoutRadialGradient: Story = {
  args: {
    showRadialGradient: false,
    children: (
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Full Aurora</h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Without the radial gradient mask, the aurora effect covers the entire background.
        </p>
      </div>
    ),
  },
};

export const HeroSection: Story = {
  args: {
    showRadialGradient: true,
    children: (
      <div className="text-center space-y-8 max-w-2xl px-4">
        <div className="space-y-4">
          <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-cyan-neon/10 text-cyan-neon border border-cyan-neon/20">
            Agent-Native UI
          </span>
          <h1 className="text-5xl font-bold text-foreground leading-tight">
            Build the Future of{" "}
            <span className="text-gradient-cyan">AI Interfaces</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            A comprehensive component library designed for agent-driven applications.
            Beautiful, accessible, and performant.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 rounded-lg bg-cyan-neon text-background font-medium hover:bg-cyan-neon/90 transition-colors">
            Get Started
          </button>
          <button className="px-6 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-accent transition-colors">
            Documentation
          </button>
        </div>
      </div>
    ),
  },
};

export const LoginPage: Story = {
  args: {
    showRadialGradient: true,
    children: (
      <div className="w-full max-w-sm p-8 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              placeholder="agent@example.com"
              className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
            Sign In
          </button>
        </div>
      </div>
    ),
  },
};

export const MinimalContent: Story = {
  args: {
    showRadialGradient: true,
    children: (
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-cyan-neon/20 border border-cyan-neon/40 flex items-center justify-center">
          <span className="text-2xl">✨</span>
        </div>
        <div>
          <p className="text-lg font-medium text-foreground">bb-ui</p>
          <p className="text-sm text-muted-foreground">Agent-native components</p>
        </div>
      </div>
    ),
  },
};

export const DarkVoid: Story = {
  args: {
    showRadialGradient: true,
    className: "bg-[#020205]",
    children: (
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Deep Void</h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Extra dark background for maximum contrast with the aurora effect.
        </p>
      </div>
    ),
  },
};

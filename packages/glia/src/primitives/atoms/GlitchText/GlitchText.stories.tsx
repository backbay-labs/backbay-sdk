import type { Meta, StoryObj } from "@storybook/react";
import { GlitchText } from "./GlitchText";

const meta: Meta<typeof GlitchText> = {
  title: "Primitives/Atoms/GlitchText",
  component: GlitchText,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs", "!static-grade"],
  argTypes: {
    interval: {
      control: { type: "range", min: 1000, max: 10000, step: 500 },
    },
    steps: {
      control: { type: "number" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof GlitchText>;

export const Default: Story = {
  args: {
    variants: ["LOADING", "SYNCING", "READY"],
    interval: 2000,
    className: "text-4xl font-bold font-mono",
  },
};

export const StatusMessages: Story = {
  args: {
    variants: ["INITIALIZING...", "CONNECTING...", "AUTHENTICATED", "ONLINE"],
    interval: 1500,
    className: "text-2xl font-mono text-cyan-neon",
  },
};

export const SlowTransition: Story = {
  args: {
    variants: ["SYSTEM BOOT", "LOADING MODULES", "READY"],
    interval: 4000,
    className: "text-3xl font-bold font-mono",
  },
};

export const FastGlitch: Story = {
  args: {
    variants: ["ERROR", "RETRY", "SUCCESS"],
    interval: 1000,
    className: "text-xl font-mono text-emerald-neon",
  },
};

export const LimitedSteps: Story = {
  args: {
    variants: ["STEP 1", "STEP 2", "STEP 3", "COMPLETE"],
    interval: 1500,
    steps: 3,
    className: "text-2xl font-bold font-mono",
  },
};

export const CyberpunkStyle: Story = {
  render: () => (
    <div className="p-8 bg-black/80 border border-cyan-neon/30 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="w-2 h-2 bg-cyan-neon rounded-full animate-pulse" />
        <GlitchText
          variants={["NEURAL_LINK", "SYNAPSE_01", "CORTEX_ONLINE"]}
          interval={2500}
          className="text-3xl font-mono tracking-wider text-cyan-neon"
        />
      </div>
    </div>
  ),
};

export const CountdownStyle: Story = {
  args: {
    variants: ["3", "2", "1", "GO!"],
    interval: 1000,
    steps: 3,
    className: "text-6xl font-black font-mono",
  },
};

export const MultipleInstances: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-start">
      <GlitchText
        variants={["SYSTEM", "STATUS", "CHECK"]}
        interval={2000}
        className="text-lg font-mono text-cyan-neon"
      />
      <GlitchText
        variants={["CPU: OK", "MEM: OK", "NET: OK"]}
        interval={2500}
        className="text-lg font-mono text-emerald-neon"
      />
      <GlitchText
        variants={["UPTIME: 99.9%", "LOAD: 0.42", "TEMP: 45C"]}
        interval={3000}
        className="text-lg font-mono text-magenta-neon"
      />
    </div>
  ),
};

export const HeroTitle: Story = {
  render: () => (
    <div className="text-center space-y-2">
      <h1 className="text-5xl font-black">
        <GlitchText
          variants={["WELCOME", "BIENVENUE", "WILLKOMMEN", "BIENVENIDO"]}
          interval={3000}
          className="bg-gradient-to-r from-cyan-neon via-magenta-neon to-emerald-neon bg-clip-text text-transparent"
        />
      </h1>
      <p className="text-muted-foreground">to the future</p>
    </div>
  ),
};

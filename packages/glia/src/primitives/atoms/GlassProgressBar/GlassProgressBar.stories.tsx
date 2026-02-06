import type { Meta, StoryObj } from "@storybook/react";
import { GlassProgressBar } from "./GlassProgressBar";
import { useState } from "react";

const meta: Meta<typeof GlassProgressBar> = {
  title: "Primitives/Atoms/GlassProgressBar",
  component: GlassProgressBar,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 1, step: 0.01 },
    },
    theme: {
      control: "select",
      options: ["cyan", "magenta", "emerald", "rainbow"],
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
    },
    labelPosition: {
      control: "select",
      options: ["top", "inline"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlassProgressBar>;

export const Default: Story = {
  args: {
    value: 0.65,
  },
};

export const AllThemes: Story = {
  decorators: [
    (Story) => (
      <div className="w-80 space-y-4">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <GlassProgressBar value={0.6} theme="cyan" label="Cyan" showValue />
      <GlassProgressBar value={0.7} theme="magenta" label="Magenta" showValue />
      <GlassProgressBar value={0.8} theme="emerald" label="Emerald" showValue />
      <GlassProgressBar value={0.9} theme="rainbow" label="Rainbow" showValue />
    </>
  ),
};

export const AllSizes: Story = {
  decorators: [
    (Story) => (
      <div className="w-80 space-y-6">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <GlassProgressBar value={0.5} size="sm" label="Small" showValue />
      <GlassProgressBar value={0.5} size="default" label="Default" showValue />
      <GlassProgressBar value={0.5} size="lg" label="Large" showValue />
    </>
  ),
};

export const WithLabel: Story = {
  args: {
    value: 0.72,
    label: "Upload Progress",
    showValue: true,
    theme: "cyan",
  },
};

export const InlineLabel: Story = {
  args: {
    value: 0.45,
    label: "CPU",
    labelPosition: "inline",
    showValue: true,
    theme: "emerald",
  },
};

export const WithGlow: Story = {
  decorators: [
    (Story) => (
      <div className="w-80 space-y-6">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <GlassProgressBar value={0.7} glow theme="cyan" label="Cyan Glow" size="lg" />
      <GlassProgressBar value={0.8} glow theme="magenta" label="Magenta Glow" size="lg" />
      <GlassProgressBar value={0.9} glow theme="emerald" label="Emerald Glow" size="lg" />
      <GlassProgressBar value={0.6} glow theme="rainbow" label="Rainbow Glow" size="lg" />
    </>
  ),
};

export const Striped: Story = {
  decorators: [
    (Story) => (
      <div className="w-80 space-y-6">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <GlassProgressBar value={0.6} striped theme="cyan" label="Striped Cyan" size="lg" showValue />
      <GlassProgressBar value={0.75} striped theme="magenta" label="Striped Magenta" size="lg" showValue />
      <GlassProgressBar value={0.85} striped glow theme="rainbow" label="Striped + Glow" size="lg" showValue />
    </>
  ),
};

export const Indeterminate: Story = {
  decorators: [
    (Story) => (
      <div className="w-80 space-y-6">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <GlassProgressBar label="Loading..." theme="cyan" size="default" />
      <GlassProgressBar label="Processing..." theme="rainbow" size="lg" glow />
    </>
  ),
};

export const Animated: Story = {
  render: function AnimatedBar() {
    const [value, setValue] = useState(0.5);
    return (
      <div className="w-80 space-y-4">
        <GlassProgressBar
          value={value}
          theme="rainbow"
          label="Adjustable"
          showValue
          glow
          size="lg"
        />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          onChange={(e) => setValue(parseFloat(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground text-center">
          Drag the slider to see animated transitions
        </p>
      </div>
    );
  },
};

import type { Meta, StoryObj } from "@storybook/react";
import { HUDProgressRing } from "./HUDProgressRing";
import { useEffect, useState } from "react";

const meta: Meta<typeof HUDProgressRing> = {
  title: "Primitives/Atoms/HUDProgressRing",
  component: HUDProgressRing,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 1, step: 0.01 },
    },
    size: {
      control: { type: "range", min: 60, max: 200, step: 10 },
    },
    strokeWidth: {
      control: { type: "range", min: 2, max: 16, step: 1 },
    },
    theme: {
      control: "select",
      options: ["cyan", "magenta", "emerald", "rainbow"],
    },
    showValue: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof HUDProgressRing>;

export const Default: Story = {
  args: {
    value: 0.75,
    label: "Progress",
  },
};

export const AllThemes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8 items-center">
      <HUDProgressRing value={0.65} theme="cyan" label="Cyan" />
      <HUDProgressRing value={0.75} theme="magenta" label="Magenta" />
      <HUDProgressRing value={0.85} theme="emerald" label="Emerald" />
      <HUDProgressRing value={0.95} theme="rainbow" label="Rainbow" />
    </div>
  ),
};

export const DifferentSizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8 items-end">
      <HUDProgressRing value={0.7} size={60} strokeWidth={4} label="Small" />
      <HUDProgressRing value={0.7} size={100} strokeWidth={6} label="Medium" />
      <HUDProgressRing value={0.7} size={140} strokeWidth={8} label="Large" />
      <HUDProgressRing value={0.7} size={180} strokeWidth={10} label="XL" />
    </div>
  ),
};

export const CustomSuffix: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8 items-center">
      <HUDProgressRing value={0.5} suffix="%" label="Percentage" />
      <HUDProgressRing value={0.75} displayValue={750} suffix=" XP" label="Experience" />
      <HUDProgressRing value={0.33} displayValue={3} suffix="/9" label="Level" />
    </div>
  ),
};

export const NoValue: Story = {
  args: {
    value: 0.6,
    showValue: false,
    label: "Hidden Value",
  },
};

export const Animated: Story = {
  render: function AnimatedRing() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 1) return 0;
          return prev + 0.1;
        });
      }, 1500);
      return () => clearInterval(timer);
    }, []);

    return (
      <div className="flex flex-col items-center gap-4">
        <HUDProgressRing value={progress} theme="rainbow" label="Loading..." />
        <p className="text-sm text-muted-foreground">
          Progress resets after reaching 100%
        </p>
      </div>
    );
  },
};

export const StrokeWidths: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8 items-center">
      <HUDProgressRing value={0.7} strokeWidth={2} label="Thin" />
      <HUDProgressRing value={0.7} strokeWidth={6} label="Medium" />
      <HUDProgressRing value={0.7} strokeWidth={12} label="Thick" />
    </div>
  ),
};

export const Dashboard: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8 p-6 bg-card/50 rounded-xl border border-border/50">
      <HUDProgressRing
        value={0.87}
        theme="cyan"
        label="CPU Usage"
        size={100}
        strokeWidth={6}
      />
      <HUDProgressRing
        value={0.65}
        theme="magenta"
        label="Memory"
        size={100}
        strokeWidth={6}
      />
      <HUDProgressRing
        value={0.42}
        theme="emerald"
        label="Network"
        size={100}
        strokeWidth={6}
      />
      <HUDProgressRing
        value={0.93}
        theme="rainbow"
        label="Tasks"
        displayValue={93}
        suffix="/100"
        size={100}
        strokeWidth={6}
      />
    </div>
  ),
};

export const ProgressStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8 items-center">
      <HUDProgressRing value={0} theme="cyan" label="Empty" />
      <HUDProgressRing value={0.25} theme="cyan" label="Quarter" />
      <HUDProgressRing value={0.5} theme="cyan" label="Half" />
      <HUDProgressRing value={0.75} theme="cyan" label="Three Quarters" />
      <HUDProgressRing value={1} theme="emerald" label="Complete" />
    </div>
  ),
};

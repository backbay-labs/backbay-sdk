import type { Meta, StoryObj } from "@storybook/react";
import { PixelCanvas } from "./PixelCanvas";

const meta: Meta<typeof PixelCanvas> = {
  title: "Primitives/Atoms/PixelCanvas",
  component: PixelCanvas,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    gap: {
      control: { type: "range", min: 4, max: 20, step: 1 },
    },
    speed: {
      control: { type: "range", min: 0, max: 100, step: 5 },
    },
    variant: {
      control: "select",
      options: ["default", "icon"],
    },
    noFocus: {
      control: "boolean",
    },
  },
  decorators: [
    (Story, context) => (
      <div
        className="relative w-64 h-32 rounded-lg border border-border/50 bg-card/30 overflow-hidden cursor-pointer"
        style={{ position: "relative" }}
      >
        <Story {...context.args} />
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <span className="text-sm text-muted-foreground">Hover me</span>
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PixelCanvas>;

export const Default: Story = {
  args: {
    gap: 5,
    speed: 35,
    variant: "default",
  },
};

export const CyanNeon: Story = {
  args: {
    gap: 5,
    speed: 35,
    colors: ["#22D3EE", "#06B6D4", "#0891B2"],
    variant: "default",
  },
  decorators: [
    (Story) => (
      <div
        className="relative w-64 h-32 rounded-lg border border-cyan-neon/30 bg-card/30 overflow-hidden cursor-pointer"
        style={{ position: "relative" }}
      >
        <Story />
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <span className="text-sm text-cyan-neon">Hover me</span>
        </div>
      </div>
    ),
  ],
};

export const MagentaNeon: Story = {
  args: {
    gap: 5,
    speed: 35,
    colors: ["#F43F5E", "#E11D48", "#BE123C"],
    variant: "default",
  },
  decorators: [
    (Story) => (
      <div
        className="relative w-64 h-32 rounded-lg border border-magenta-neon/30 bg-card/30 overflow-hidden cursor-pointer"
        style={{ position: "relative" }}
      >
        <Story />
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <span className="text-sm text-magenta-neon">Hover me</span>
        </div>
      </div>
    ),
  ],
};

export const EmeraldNeon: Story = {
  args: {
    gap: 5,
    speed: 35,
    colors: ["#10B981", "#059669", "#047857"],
    variant: "default",
  },
  decorators: [
    (Story) => (
      <div
        className="relative w-64 h-32 rounded-lg border border-emerald-neon/30 bg-card/30 overflow-hidden cursor-pointer"
        style={{ position: "relative" }}
      >
        <Story />
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <span className="text-sm text-emerald-neon">Hover me</span>
        </div>
      </div>
    ),
  ],
};

export const IconVariant: Story = {
  args: {
    gap: 4,
    speed: 40,
    colors: ["#22D3EE", "#F43F5E", "#10B981"],
    variant: "icon",
  },
  decorators: [
    (Story) => (
      <div
        className="relative w-24 h-24 rounded-full border border-border/50 bg-card/30 overflow-hidden cursor-pointer"
        style={{ position: "relative" }}
      >
        <Story />
      </div>
    ),
  ],
};

export const SlowAnimation: Story = {
  args: {
    gap: 8,
    speed: 15,
    colors: ["#8B5CF6", "#7C3AED", "#6D28D9"],
    variant: "default",
  },
  decorators: [
    (Story) => (
      <div
        className="relative w-64 h-32 rounded-lg border border-violet-neon/30 bg-card/30 overflow-hidden cursor-pointer"
        style={{ position: "relative" }}
      >
        <Story />
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <span className="text-sm text-violet-neon">Slow shimmer</span>
        </div>
      </div>
    ),
  ],
};

export const DensePixels: Story = {
  args: {
    gap: 4,
    speed: 50,
    colors: ["#22D3EE", "#F43F5E", "#10B981", "#8B5CF6"],
    variant: "default",
  },
  decorators: [
    (Story) => (
      <div
        className="relative w-64 h-32 rounded-lg border border-border/50 bg-card/30 overflow-hidden cursor-pointer"
        style={{ position: "relative" }}
      >
        <Story />
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <span className="text-sm text-foreground">Dense & fast</span>
        </div>
      </div>
    ),
  ],
};

export const SparsePixels: Story = {
  args: {
    gap: 12,
    speed: 25,
    colors: ["#f8fafc", "#e2e8f0"],
    variant: "default",
  },
  decorators: [
    (Story) => (
      <div
        className="relative w-64 h-32 rounded-lg border border-border/50 bg-card/30 overflow-hidden cursor-pointer"
        style={{ position: "relative" }}
      >
        <Story />
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <span className="text-sm text-muted-foreground">Sparse & subtle</span>
        </div>
      </div>
    ),
  ],
};

export const CardWithPixels: Story = {
  render: () => (
    <div className="relative w-80 p-6 rounded-xl border border-border/50 bg-card/50 overflow-hidden cursor-pointer group">
      <PixelCanvas
        gap={6}
        speed={30}
        colors={["#22D3EE", "#06B6D4", "#0891B2"]}
      />
      <div className="relative z-10">
        <h3 className="text-lg font-semibold text-foreground mb-2">Interactive Card</h3>
        <p className="text-sm text-muted-foreground">
          Hover over this card to see the pixel animation effect reveal.
        </p>
      </div>
    </div>
  ),
};

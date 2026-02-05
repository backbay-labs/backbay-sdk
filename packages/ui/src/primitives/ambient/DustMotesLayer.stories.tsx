import type { Meta, StoryObj } from "@storybook/react";
import { DustMotesLayer } from "./DustMotesLayer";
import { UiThemeProvider } from "../../theme";

const meta: Meta<typeof DustMotesLayer> = {
  title: "Primitives/Ambient/DustMotesLayer",
  component: DustMotesLayer,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "cathedral" },
  },
  tags: ["autodocs"],
  argTypes: {
    density: {
      control: { type: "range", min: 0.1, max: 1, step: 0.1 },
    },
    speed: {
      control: { type: "range", min: 0.05, max: 0.5, step: 0.05 },
    },
    disabled: {
      control: "boolean",
    },
  },
  decorators: [
    (Story) => (
      <UiThemeProvider defaultThemeId="solarpunk">
        <div className="relative w-full h-screen bg-[#0a0f14]">
          <Story />
        </div>
      </UiThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DustMotesLayer>;

export const Default: Story = {
  args: {
    density: 0.35,
    speed: 0.15,
  },
};

export const GoldenSunlight: Story = {
  args: {
    colors: [
      "rgba(245, 166, 35, 0.7)",
      "rgba(255, 248, 220, 0.6)",
      "rgba(255, 215, 0, 0.5)",
    ],
    density: 0.4,
    speed: 0.12,
    sizeRange: [2, 7],
  },
};

export const ForestGreen: Story = {
  args: {
    colors: [
      "rgba(74, 222, 128, 0.5)",
      "rgba(34, 197, 94, 0.4)",
      "rgba(22, 163, 74, 0.3)",
      "rgba(255, 255, 255, 0.3)",
    ],
    density: 0.3,
    speed: 0.1,
    sizeRange: [2, 5],
  },
};

export const WarmCream: Story = {
  args: {
    colors: [
      "rgba(255, 248, 220, 0.6)",
      "rgba(255, 239, 186, 0.5)",
      "rgba(255, 255, 255, 0.4)",
    ],
    density: 0.25,
    speed: 0.08,
    sizeRange: [3, 8],
  },
};

export const FastMotes: Story = {
  args: {
    colors: [
      "rgba(245, 166, 35, 0.6)",
      "rgba(255, 248, 220, 0.5)",
    ],
    density: 0.5,
    speed: 0.4,
    sizeRange: [1, 4],
  },
};

export const SlowDrift: Story = {
  args: {
    colors: [
      "rgba(245, 166, 35, 0.5)",
      "rgba(255, 255, 255, 0.3)",
    ],
    density: 0.2,
    speed: 0.05,
    sizeRange: [4, 10],
  },
};

export const HighDensity: Story = {
  args: {
    colors: [
      "rgba(245, 166, 35, 0.6)",
      "rgba(74, 222, 128, 0.4)",
      "rgba(255, 248, 220, 0.5)",
      "rgba(255, 255, 255, 0.3)",
    ],
    density: 1.0,
    speed: 0.15,
    sizeRange: [2, 6],
  },
};

export const WithContent: Story = {
  render: (args) => (
    <UiThemeProvider defaultThemeId="solarpunk">
      <div className="relative w-full h-screen bg-[#0a0f14]">
        <DustMotesLayer {...args} />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-4 p-8 rounded-2xl bg-black/30 backdrop-blur-sm border border-emerald-neon/20">
            <h1 className="text-4xl font-bold text-foreground">Solarpunk Observatory</h1>
            <p className="text-muted-foreground max-w-md">
              Floating dust motes in warm sunlight, evoking botanical space stations and organic calm.
            </p>
          </div>
        </div>
      </div>
    </UiThemeProvider>
  ),
  args: {
    density: 0.35,
    speed: 0.15,
  },
};

export const TinyMotes: Story = {
  args: {
    colors: [
      "rgba(255, 255, 255, 0.5)",
      "rgba(245, 166, 35, 0.4)",
    ],
    density: 0.6,
    speed: 0.2,
    sizeRange: [1, 3],
  },
};

export const LargeMotes: Story = {
  args: {
    colors: [
      "rgba(245, 166, 35, 0.4)",
      "rgba(255, 248, 220, 0.3)",
    ],
    density: 0.15,
    speed: 0.08,
    sizeRange: [6, 12],
  },
};

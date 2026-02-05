import type { Meta, StoryObj } from "@storybook/react";
import { NebulaStarsLayer } from "./NebulaStarsLayer";
import { UiThemeProvider } from "../../theme";

const meta: Meta<typeof NebulaStarsLayer> = {
  title: "Primitives/Ambient/NebulaStarsLayer",
  component: NebulaStarsLayer,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "void" },
  },
  tags: ["autodocs"],
  argTypes: {
    density: {
      control: { type: "range", min: 0.1, max: 1, step: 0.1 },
    },
    disabled: {
      control: "boolean",
    },
  },
  decorators: [
    (Story) => (
      <UiThemeProvider defaultThemeId="nebula">
        <div className="relative w-full h-screen bg-[#02040a]">
          <Story />
        </div>
      </UiThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NebulaStarsLayer>;

export const Default: Story = {
  args: {
    density: 0.6,
  },
};

export const CyanMagenta: Story = {
  args: {
    colors: ["#22D3EE", "#F43F5E", "#8B5CF6"],
    density: 0.7,
  },
};

export const CyanOnly: Story = {
  args: {
    colors: ["#22D3EE", "#06B6D4", "#0891B2"],
    density: 0.6,
  },
};

export const MagentaOnly: Story = {
  args: {
    colors: ["#F43F5E", "#E11D48", "#BE123C"],
    density: 0.6,
  },
};

export const EmeraldViolet: Story = {
  args: {
    colors: ["#10B981", "#8B5CF6", "#059669", "#7C3AED"],
    density: 0.7,
  },
};

export const HighDensity: Story = {
  args: {
    colors: ["#22D3EE", "#F43F5E", "#10B981", "#8B5CF6"],
    density: 1.0,
  },
};

export const LowDensity: Story = {
  args: {
    colors: ["#22D3EE", "#F43F5E"],
    density: 0.2,
  },
};

export const WithContent: Story = {
  render: (args) => (
    <UiThemeProvider defaultThemeId="nebula">
      <div className="relative w-full h-screen bg-[#02040a]">
        <NebulaStarsLayer {...args} />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-4 p-8 rounded-2xl bg-black/30 backdrop-blur-sm border border-cyan-neon/20">
            <h1 className="text-4xl font-bold text-foreground">Nebula Stars</h1>
            <p className="text-muted-foreground max-w-md">
              Twinkling starfield with nebula glow effects, perfect for dark cyberpunk interfaces.
            </p>
          </div>
        </div>
      </div>
    </UiThemeProvider>
  ),
  args: {
    density: 0.6,
  },
};

export const GoldenStars: Story = {
  args: {
    colors: ["#F5A623", "#FFD700", "#FFA500", "#FFE4B5"],
    density: 0.5,
  },
  decorators: [
    (Story) => (
      <UiThemeProvider defaultThemeId="nebula">
        <div className="relative w-full h-screen bg-[#0a0f14]">
          <Story />
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="text-lg text-yellow-warning/80">Golden constellation</span>
          </div>
        </div>
      </UiThemeProvider>
    ),
  ],
};

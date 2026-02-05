import type { Meta, StoryObj } from "@storybook/react";
import { FogLayer } from "./FogLayer";

const meta: Meta<typeof FogLayer> = {
  title: "Primitives/Environment/FogLayer",
  component: FogLayer,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["depth", "ground", "volumetric", "mist"],
    },
    density: {
      control: { type: "range", min: 0, max: 1, step: 0.1 },
    },
    height: {
      control: { type: "range", min: 0, max: 1, step: 0.1 },
    },
    animated: {
      control: "boolean",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "500px", position: "relative", background: "#0a0a0f" }}>
        <Story />
        <div style={{ position: "absolute", bottom: "20%", left: "50%", transform: "translateX(-50%)", color: "#fff", opacity: 0.5, fontSize: 12 }}>
          Content behind fog
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FogLayer>;

export const DepthFog: Story = {
  args: { type: "depth", density: 0.6 },
};

export const GroundFog: Story = {
  args: { type: "ground", density: 0.7, height: 0.4 },
};

export const VolumetricFog: Story = {
  args: { type: "volumetric", density: 0.5, animated: true },
};

export const Mist: Story = {
  args: { type: "mist", density: 0.4, animated: true },
};

export const ThickGroundFog: Story = {
  args: { type: "ground", density: 0.9, height: 0.6 },
};

export const SubtleMist: Story = {
  args: { type: "mist", density: 0.2, animated: true },
};

export const ColoredFog: Story = {
  args: { type: "volumetric", density: 0.5, color: "#ff6b6b", animated: true },
};

export const AllFogTypes: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", height: "100%", gap: 1 }}>
      {(["depth", "ground", "volumetric", "mist"] as const).map((type) => (
        <div key={type} style={{ position: "relative", background: "#0a0a0f", minHeight: "250px" }}>
          <FogLayer type={type} density={0.6} animated={true} />
          <div style={{ position: "absolute", bottom: 8, left: 8, color: "#fff", fontSize: 11, fontFamily: "monospace", opacity: 0.7 }}>
            {type}
          </div>
        </div>
      ))}
    </div>
  ),
};

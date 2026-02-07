import type { Meta, StoryObj } from "@storybook/react";
import { VolumetricLight } from "./VolumetricLight";
import type { LightType } from "./types";

const meta: Meta<typeof VolumetricLight> = {
  title: "Primitives/Environment/VolumetricLight",
  component: VolumetricLight,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["godrays", "shaft", "bloom", "flare", "caustics", "scanner", "neon", "spotlight", "rim", "laser"],
    },
    intensity: { control: { type: "range", min: 0, max: 1, step: 0.1 } },
    angle: { control: { type: "range", min: 0, max: 360, step: 15 } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "500px", position: "relative", background: "#0a0a0f" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof VolumetricLight>;

export const GodRays: Story = { args: { type: "godrays", source: { x: 0.8, y: 0.1 }, intensity: 0.7 } };
export const Shaft: Story = { args: { type: "shaft", angle: 45, width: 0.2, intensity: 0.6 } };
export const Bloom: Story = { args: { type: "bloom", source: { x: 0.5, y: 0.5 }, intensity: 0.8 } };
export const LensFlare: Story = { args: { type: "flare", source: { x: 0.7, y: 0.2 }, intensity: 0.7 } };
export const Caustics: Story = { args: { type: "caustics", intensity: 0.6 } };
export const Scanner: Story = { args: { type: "scanner", source: { x: 0.5, y: 0.5 }, intensity: 0.7 } };
export const Neon: Story = { args: { type: "neon", angle: 0, color: "#ff00ff", intensity: 0.8 } };
export const Spotlight: Story = { args: { type: "spotlight", source: { x: 0.5, y: 0 }, width: 0.4, intensity: 0.7 } };
export const RimLight: Story = { args: { type: "rim", color: "#00f0ff", intensity: 0.6 } };
export const Laser: Story = { args: { type: "laser", angle: 45, color: "#ff0000", intensity: 0.9 } };

export const AllLightTypes: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", height: "100%", gap: 1 }}>
      {(["godrays", "shaft", "bloom", "flare", "caustics", "scanner", "neon", "spotlight", "rim", "laser"] as LightType[]).map((type) => (
        <div key={type} style={{ position: "relative", background: "#0a0a0f", minHeight: "200px" }}>
          <VolumetricLight type={type} intensity={0.7} />
          <div style={{ position: "absolute", bottom: 8, left: 8, color: "#fff", fontSize: 10, fontFamily: "monospace", opacity: 0.7 }}>{type}</div>
        </div>
      ))}
    </div>
  ),
};

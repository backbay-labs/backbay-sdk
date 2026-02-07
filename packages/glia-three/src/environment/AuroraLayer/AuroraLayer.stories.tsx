import type { Meta, StoryObj } from "@storybook/react";
import { AuroraLayer } from "./AuroraLayer";
import type { AuroraType } from "./types";

const meta: Meta<typeof AuroraLayer> = {
  title: "Primitives/Environment/AuroraLayer",
  component: AuroraLayer,
  parameters: { layout: "fullscreen", backgrounds: { default: "dark" } },
  tags: ["autodocs"],
  argTypes: {
    type: { control: "select", options: ["aurora", "nebula", "gradient", "stars", "clouds", "sunset", "storm", "cosmic", "heat", "underwater"] },
    intensity: { control: { type: "range", min: 0, max: 1, step: 0.1 } },
    speed: { control: { type: "range", min: 0, max: 2, step: 0.1 } },
  },
  decorators: [(Story) => (<div style={{ width: "100%", height: "500px", position: "relative", background: "#0a0a0f" }}><Story /></div>)],
};

export default meta;
type Story = StoryObj<typeof AuroraLayer>;

export const Aurora: Story = { args: { type: "aurora", intensity: 0.8 } };
export const Nebula: Story = { args: { type: "nebula", intensity: 0.7 } };
export const Gradient: Story = { args: { type: "gradient", intensity: 1 } };
export const Stars: Story = { args: { type: "stars", intensity: 0.9, complexity: 5 } };
export const Clouds: Story = { args: { type: "clouds", intensity: 0.6 } };
export const Sunset: Story = { args: { type: "sunset", intensity: 0.9 } };
export const Storm: Story = { args: { type: "storm", intensity: 0.8 } };
export const Cosmic: Story = { args: { type: "cosmic", intensity: 0.7 } };
export const Heat: Story = { args: { type: "heat", intensity: 0.6 } };
export const Underwater: Story = { args: { type: "underwater", intensity: 0.8 } };

export const AllAuroraTypes: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", height: "100%", gap: 1 }}>
      {(["aurora", "nebula", "gradient", "stars", "clouds", "sunset", "storm", "cosmic", "heat", "underwater"] as AuroraType[]).map((type) => (
        <div key={type} style={{ position: "relative", background: "#0a0a0f", minHeight: "200px" }}>
          <AuroraLayer type={type} intensity={0.7} />
          <div style={{ position: "absolute", bottom: 8, left: 8, color: "#fff", fontSize: 10, fontFamily: "monospace", opacity: 0.7 }}>{type}</div>
        </div>
      ))}
    </div>
  ),
};

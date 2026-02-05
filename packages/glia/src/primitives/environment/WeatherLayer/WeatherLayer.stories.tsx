import type { Meta, StoryObj } from "@storybook/react";
import { WeatherLayer } from "./WeatherLayer";
import type { WeatherType } from "./types";
import { AUTUMN_LEAF_COLOR_PRESETS, type AutumnLeafColorPreset } from "./leafPresets";

const meta: Meta<typeof WeatherLayer> = {
  title: "Primitives/Environment/WeatherLayer",
  component: WeatherLayer,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: [
        "rain",
        "snow",
        "dust",
        "leaves",
        "embers",
        "fireflies",
        "ash",
        "sakura",
        "sparks",
        "spores",
      ],
    },
    intensity: {
      control: { type: "range", min: 0, max: 1, step: 0.1 },
    },
    opacity: {
      control: { type: "range", min: 0, max: 1, step: 0.1 },
    },
    blur: {
      control: "boolean",
    },
    stylePreset: {
      control: "select",
      options: ["ui", "cinematic"],
    },
    leafColorPreset: {
      control: "select",
      options: Object.keys(AUTUMN_LEAF_COLOR_PRESETS),
    },
    colors: {
      control: "object",
    },
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
type Story = StoryObj<typeof WeatherLayer>;

export const Rain: Story = {
  args: {
    type: "rain",
    intensity: 0.3,
    wind: { x: -0.3, y: 0 },
    speed: 1,
  },
};

export const Snow: Story = {
  args: {
    type: "snow",
    intensity: 0.6,
    wind: { x: 0.1, y: 0 },
  },
};

export const SnowCinematic: Story = {
  name: "Snow (Cinematic)",
  args: {
    type: "snow",
    stylePreset: "cinematic",
    intensity: 0.7,
    wind: { x: 0.08, y: 0 },
    blur: true,
  },
};

export const Dust: Story = {
  args: {
    type: "dust",
    intensity: 0.5,
  },
};

export const FallingLeaves: Story = {
  args: {
    type: "leaves",
    intensity: 0.5,
    wind: { x: 0.5, y: 0 },
  },
};

export const FallingLeavesCinematic: Story = {
  name: "Falling Leaves (Cinematic)",
  args: {
    type: "leaves",
    stylePreset: "cinematic",
    intensity: 0.7,
    wind: { x: 0.25, y: 0 },
    blur: true,
  },
};

export const FallingLeavesAutumnPresets: Story = {
  name: "Falling Leaves (Autumn Presets)",
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, height: "100%" }}>
      {(Object.keys(AUTUMN_LEAF_COLOR_PRESETS) as AutumnLeafColorPreset[]).map((preset) => (
        <div key={preset} style={{ position: "relative", background: "#0a0a0f", minHeight: 250 }}>
          <WeatherLayer
            type="leaves"
            stylePreset="cinematic"
            intensity={0.7}
            wind={{ x: 0.25, y: 0 }}
            blur
            leafColorPreset={preset}
          />
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              color: "#fff",
              fontSize: 11,
              fontFamily: "monospace",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              opacity: 0.7,
            }}
          >
            {preset}
          </div>
        </div>
      ))}
    </div>
  ),
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "700px" }}>
        <Story />
      </div>
    ),
  ],
};

export const Embers: Story = {
  args: {
    type: "embers",
    intensity: 0.6,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "100%",
          height: "500px",
          position: "relative",
          background: "linear-gradient(to top, #1a0a00, #0a0a0f)",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export const Fireflies: Story = {
  args: {
    type: "fireflies",
    intensity: 0.5,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "100%",
          height: "500px",
          position: "relative",
          background: "linear-gradient(to bottom, #0a1a0a, #050a05)",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export const VolcanicAsh: Story = {
  args: {
    type: "ash",
    intensity: 0.6,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "100%",
          height: "500px",
          position: "relative",
          background: "linear-gradient(to top, #2a1a1a, #0a0a0f)",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export const CherryBlossoms: Story = {
  args: {
    type: "sakura",
    intensity: 0.5,
    wind: { x: 0.3, y: 0 },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "100%",
          height: "500px",
          position: "relative",
          background: "linear-gradient(to bottom, #1a1520, #0a0a0f)",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export const ElectricSparks: Story = {
  args: {
    type: "sparks",
    intensity: 0.4,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "500px", position: "relative", background: "#050508" }}>
        <Story />
      </div>
    ),
  ],
};

export const MagicalSpores: Story = {
  args: {
    type: "spores",
    intensity: 0.5,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "100%",
          height: "500px",
          position: "relative",
          background: "linear-gradient(to top, #150a20, #0a0a0f)",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export const HeavyRain: Story = {
  args: {
    type: "rain",
    intensity: 1.0,
    wind: { x: -0.5, y: 0 },
    blur: true,
  },
};

export const LightSnowfall: Story = {
  args: {
    type: "snow",
    intensity: 0.3,
  },
};

export const CustomColor: Story = {
  args: {
    type: "rain",
    intensity: 0.6,
    color: "#00f0ff",
  },
};

export const AllWeatherTypes: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", height: "100%", gap: 1 }}>
      {(
        [
          "rain",
          "snow",
          "dust",
          "leaves",
          "embers",
          "fireflies",
          "ash",
          "sakura",
          "sparks",
          "spores",
        ] as WeatherType[]
      ).map((type) => (
        <div key={type} style={{ position: "relative", background: "#0a0a0f", minHeight: "250px" }}>
          <WeatherLayer type={type} intensity={0.6} />
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              color: "#fff",
              fontSize: 11,
              fontFamily: "monospace",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              opacity: 0.7,
            }}
          >
            {type}
          </div>
        </div>
      ))}
    </div>
  ),
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "500px" }}>
        <Story />
      </div>
    ),
  ],
};

import type { Meta, StoryObj } from "@storybook/react";
import { EnvironmentLayer } from "./EnvironmentLayer";
import { ENVIRONMENT_PRESETS, type EnvironmentPreset } from "./presets";

const PRESET_BACKGROUNDS: Record<EnvironmentPreset, string> = {
  "enchanted-forest": "linear-gradient(to bottom, #0a1f0a, #051005)",
  "cyberpunk-city": "linear-gradient(to bottom, #0a001a, #1a0033)",
  "deep-space": "#000005",
  underwater: "linear-gradient(to bottom, #001a20, #002030)",
  apocalypse: "linear-gradient(to bottom, #1a1008, #0a0804)",
  "cozy-night": "linear-gradient(to bottom, #0a0a15, #050510)",
  haunted: "linear-gradient(to bottom, #0a0a0f, #05050a)",
  synthwave: "linear-gradient(to bottom, #0a001a, #1a0033)",
  "zen-garden": "linear-gradient(to bottom, #1a1510, #0f0a08)",
  volcanic: "linear-gradient(to bottom, #1a0a00, #0a0500)",
  arctic: "linear-gradient(to bottom, #0a1520, #051015)",
  noir: "#0a0a0a",
  ethereal: "linear-gradient(to bottom, #1a0030, #0a0015)",
  matrix: "#000a00",
  rave: "#050005",
  "alien-world": "linear-gradient(to bottom, #0a0020, #050010)",
};

const meta: Meta<typeof EnvironmentLayer> = {
  title: "Primitives/Environment/EnvironmentLayer",
  component: EnvironmentLayer,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    preset: {
      control: "select",
      options: Object.keys(ENVIRONMENT_PRESETS),
    },
    intensity: {
      control: { type: "range", min: 0, max: 1, step: 0.1 },
    },
    stylePreset: {
      control: "select",
      options: ["ui", "cinematic"],
    },
    enabled: {
      control: "boolean",
    },
  },
  decorators: [
    (Story, context) => {
      const preset = (context.args.preset as EnvironmentPreset) || "enchanted-forest";
      return (
        <div
          style={{
            width: "100%",
            height: "500px",
            position: "relative",
            background: PRESET_BACKGROUNDS[preset],
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof EnvironmentLayer>;

// Individual preset stories
export const EnchantedForest: Story = {
  args: {
    preset: "enchanted-forest",
    intensity: 1,
  },
};

export const CyberpunkCity: Story = {
  args: {
    preset: "cyberpunk-city",
    intensity: 1,
  },
};

export const DeepSpace: Story = {
  args: {
    preset: "deep-space",
    intensity: 1,
  },
};

export const Underwater: Story = {
  args: {
    preset: "underwater",
    intensity: 1,
  },
};

export const Apocalypse: Story = {
  args: {
    preset: "apocalypse",
    intensity: 1,
  },
};

export const CozyNight: Story = {
  args: {
    preset: "cozy-night",
    intensity: 1,
  },
};

export const Haunted: Story = {
  args: {
    preset: "haunted",
    intensity: 1,
  },
};

export const Synthwave: Story = {
  args: {
    preset: "synthwave",
    intensity: 1,
  },
};

export const ZenGarden: Story = {
  args: {
    preset: "zen-garden",
    intensity: 1,
  },
};

export const Volcanic: Story = {
  args: {
    preset: "volcanic",
    intensity: 1,
  },
};

export const Arctic: Story = {
  args: {
    preset: "arctic",
    intensity: 1,
  },
};

export const Noir: Story = {
  args: {
    preset: "noir",
    intensity: 1,
  },
};

export const Ethereal: Story = {
  args: {
    preset: "ethereal",
    intensity: 1,
  },
};

export const Matrix: Story = {
  args: {
    preset: "matrix",
    intensity: 1,
  },
};

export const Rave: Story = {
  args: {
    preset: "rave",
    intensity: 1,
  },
};

export const AlienWorld: Story = {
  args: {
    preset: "alien-world",
    intensity: 1,
  },
};

// Intensity variants
export const LowIntensity: Story = {
  args: {
    preset: "enchanted-forest",
    intensity: 0.3,
  },
};

export const MediumIntensity: Story = {
  args: {
    preset: "cyberpunk-city",
    intensity: 0.6,
  },
};

// Override examples
export const WithWeatherOverride: Story = {
  args: {
    preset: "enchanted-forest",
    intensity: 1,
    weatherOverride: {
      type: "spores",
      color: "#ff00ff",
    },
  },
};

export const WithLightOverride: Story = {
  args: {
    preset: "cyberpunk-city",
    intensity: 1,
    lightOverride: {
      color: "#00ffff",
      type: "laser",
    },
  },
};

// Gallery view of all presets
export const AllPresets: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", height: "100%", gap: 1 }}>
      {(Object.keys(ENVIRONMENT_PRESETS) as EnvironmentPreset[]).map((preset) => (
        <div
          key={preset}
          style={{
            position: "relative",
            background: PRESET_BACKGROUNDS[preset],
            minHeight: "200px",
          }}
        >
          <EnvironmentLayer preset={preset} intensity={0.8} />
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              color: "#fff",
              fontSize: 10,
              fontFamily: "monospace",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              opacity: 0.8,
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
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
      <div style={{ width: "100%", height: "800px" }}>
        <Story />
      </div>
    ),
  ],
};

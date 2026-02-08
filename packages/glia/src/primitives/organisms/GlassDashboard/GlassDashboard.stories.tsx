import type { Meta, StoryObj } from "@storybook/react";
import { GlassDashboard } from "./GlassDashboard";
import { NebulaStarsLayer } from "../../ambient/NebulaStarsLayer";

const meta: Meta<typeof GlassDashboard> = {
  title: "Primitives/Organisms/GlassDashboard",
  component: GlassDashboard,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof GlassDashboard>;

// ============================================================================
// DEFAULT
// ============================================================================

export const Default: Story = {};

// ============================================================================
// WITH AMBIENT
// ============================================================================

export const WithAmbient: Story = {
  render: () => (
    <div className="relative min-h-screen" style={{ background: "#02040a" }}>
      <NebulaStarsLayer density={0.4} />
      <div className="relative z-10">
        <GlassDashboard />
      </div>
    </div>
  ),
};

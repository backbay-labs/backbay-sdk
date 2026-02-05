import type { Meta, StoryObj } from "@storybook/react";
import { ClusterHero } from "./ClusterHero.js";
import { CLUSTER_CONFIGS } from "./config.js";
import type { ClusterId } from "./types.js";

/**
 * ClusterHero is the main hero component for cluster landing pages.
 * It displays a fullscreen video background with atmospheric effects,
 * gradient overlays, cluster branding, and action buttons.
 *
 * Each cluster has a unique visual identity:
 * - **Alexandria**: Golden tones with godrays and dust motes - "Where knowledge compounds"
 * - **Alpha**: Clean white with volumetric fog - "The origin of everything"
 * - **Opus**: Copper/bronze with bloom and dust - "Craft that endures"
 * - **Baia**: Gold with godrays from above - "Where ambition rests"
 */
const meta: Meta<typeof ClusterHero> = {
  title: "Components/ClusterHero/ClusterHero",
  component: ClusterHero,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    cluster: {
      control: "select",
      options: Object.keys(CLUSTER_CONFIGS) as ClusterId[],
      description: "The cluster to display",
      table: {
        type: { summary: "ClusterId" },
        defaultValue: { summary: "alexandria" },
      },
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          position: "relative",
          background: "#000",
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ClusterHero>;

/**
 * Default story showing the Alexandria cluster.
 * Alexandria features golden dust motes and godrays emanating from the upper right.
 */
export const Default: Story = {
  args: {
    cluster: "alexandria",
  },
};

/**
 * Alexandria - "Where knowledge compounds"
 *
 * Visual identity:
 * - Accent color: #C9A227 (antique gold)
 * - Atmosphere: Golden dust motes with godrays from upper right
 * - Evokes: Ancient libraries, accumulated wisdom, warm amber light
 */
export const Alexandria: Story = {
  args: {
    cluster: "alexandria",
  },
};

/**
 * Alpha - "The origin of everything"
 *
 * Visual identity:
 * - Accent color: #E8E8E8 (pure white)
 * - Atmosphere: Volumetric fog, clean and primordial
 * - Evokes: Genesis, blank canvas, infinite potential
 */
export const Alpha: Story = {
  args: {
    cluster: "alpha",
  },
};

/**
 * Opus - "Craft that endures"
 *
 * Visual identity:
 * - Accent color: #B87333 (copper)
 * - Atmosphere: Dense dust motes with bloom lighting
 * - Evokes: Artisan workshops, forged metal, timeless craftsmanship
 */
export const Opus: Story = {
  args: {
    cluster: "opus",
  },
};

/**
 * Baia - "Where ambition rests"
 *
 * Visual identity:
 * - Accent color: #D4AF37 (metallic gold)
 * - Atmosphere: Godrays from directly above
 * - Evokes: Mediterranean retreats, golden hour, earned tranquility
 */
export const Baia: Story = {
  args: {
    cluster: "baia",
  },
};

/**
 * Gallery view showing all four clusters side by side.
 * Useful for comparing the visual identities at a glance.
 */
export const AllClusters: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        width: "100%",
        minHeight: "100vh",
      }}
    >
      {(Object.keys(CLUSTER_CONFIGS) as ClusterId[]).map((clusterId) => (
        <div
          key={clusterId}
          style={{
            position: "relative",
            minHeight: "50vh",
            overflow: "hidden",
          }}
        >
          <ClusterHero cluster={clusterId} />
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              color: "#fff",
              fontSize: 12,
              fontFamily: "monospace",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              opacity: 0.6,
              textShadow: "0 2px 4px rgba(0,0,0,0.8)",
              zIndex: 50,
            }}
          >
            {clusterId}
          </div>
        </div>
      ))}
    </div>
  ),
  decorators: [
    (Story) => (
      <div style={{ width: "100%", minHeight: "100vh", background: "#000" }}>
        <Story />
      </div>
    ),
  ],
};

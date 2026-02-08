import type { Meta, StoryObj } from "@storybook/react";
import { HUDLoader } from "./HUDLoader";
import { GlassPanel } from "../../organisms/Glass";

const meta: Meta<typeof HUDLoader> = {
  title: "Primitives/Atoms/HUDLoader",
  component: HUDLoader,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
    },
    variant: {
      control: "select",
      options: ["default", "minimal", "elaborate"],
    },
    progress: {
      control: { type: "range", min: 0, max: 1, step: 0.01 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof HUDLoader>;

// ============================================================================
// DEFAULT
// ============================================================================

export const Default: Story = {
  args: {
    size: "md",
  },
};

// ============================================================================
// ALL SIZES
// ============================================================================

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-8 p-8 rounded-xl" style={{ background: "rgba(2,4,10,0.85)" }}>
      <HUDLoader size="sm" label="SM" />
      <HUDLoader size="md" label="MD" />
      <HUDLoader size="lg" label="LG" />
      <HUDLoader size="xl" label="XL" />
    </div>
  ),
};

// ============================================================================
// WITH PROGRESS
// ============================================================================

export const WithProgress: Story = {
  args: {
    size: "lg",
    progress: 0.75,
  },
};

// ============================================================================
// WITH LABEL
// ============================================================================

export const WithLabel: Story = {
  args: {
    size: "lg",
    label: "PROCESSING",
  },
};

// ============================================================================
// VARIANTS
// ============================================================================

export const Variants: Story = {
  render: () => (
    <div className="flex items-end gap-8 p-8 rounded-xl" style={{ background: "rgba(2,4,10,0.85)" }}>
      <HUDLoader size="lg" variant="minimal" label="Minimal" />
      <HUDLoader size="lg" variant="default" label="Default" />
      <HUDLoader size="lg" variant="elaborate" label="Elaborate" />
    </div>
  ),
};

// ============================================================================
// ELABORATE
// ============================================================================

export const Elaborate: Story = {
  args: {
    size: "xl",
    variant: "elaborate",
    label: "INITIALIZING",
    progress: 0.42,
  },
};

// ============================================================================
// IN CONTEXT — Inside a GlassPanel
// ============================================================================

export const InContext: Story = {
  render: () => (
    <GlassPanel variant="prominent" elevation="hud" className="p-8">
      <div className="flex flex-col items-center gap-4">
        <HUDLoader size="lg" variant="default" label="LOADING CLUSTER" />
        <p className="text-xs text-white/40 font-mono uppercase tracking-[0.12em]">
          Establishing secure connection...
        </p>
      </div>
    </GlassPanel>
  ),
};

// ============================================================================
// PROGRESS STATES
// ============================================================================

export const ProgressStates: Story = {
  render: () => (
    <div className="flex items-end gap-6 p-8 rounded-xl" style={{ background: "rgba(2,4,10,0.85)" }}>
      <HUDLoader size="md" progress={0} label="0%" />
      <HUDLoader size="md" progress={0.25} label="25%" />
      <HUDLoader size="md" progress={0.5} label="50%" />
      <HUDLoader size="md" progress={0.75} label="75%" />
      <HUDLoader size="md" progress={1} label="100%" />
    </div>
  ),
};

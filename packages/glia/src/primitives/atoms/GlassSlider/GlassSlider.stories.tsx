import type { Meta, StoryObj } from "@storybook/react";
import { GlassSlider } from "./GlassSlider";

const meta: Meta<typeof GlassSlider> = {
  title: "Primitives/Atoms/GlassSlider",
  component: GlassSlider,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "accent", "success"],
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
    },
    showTooltip: { control: "boolean" },
    showRange: { control: "boolean" },
    showValue: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, padding: 32 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlassSlider>;

export const Default: Story = {
  args: {
    defaultValue: [50],
  },
};

export const WithLabel: Story = {
  args: {
    defaultValue: [75],
    label: "Volume",
    showValue: true,
  },
};

export const WithTooltip: Story = {
  args: {
    defaultValue: [30],
    showTooltip: true,
    label: "Drag to see tooltip",
  },
};

export const Range: Story = {
  args: {
    defaultValue: [25, 75],
    showValue: true,
    showRange: true,
    label: "Price Range",
    formatValue: (v: number) => `$${v}`,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <GlassSlider size="sm" defaultValue={[40]} label="Small" showValue />
      <GlassSlider size="default" defaultValue={[60]} label="Default" showValue />
      <GlassSlider size="lg" defaultValue={[80]} label="Large" showValue />
    </div>
  ),
};

export const CustomFormat: Story = {
  args: {
    defaultValue: [72],
    showValue: true,
    showRange: true,
    label: "Temperature",
    formatValue: (v: number) => `${v}\u00B0F`,
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: [50],
    disabled: true,
    label: "Disabled",
    showValue: true,
  },
};

export const Steps: Story = {
  args: {
    defaultValue: [50],
    step: 10,
    showValue: true,
    showRange: true,
    label: "Step: 10",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <GlassSlider variant="default" defaultValue={[60]} label="Default (Cyan)" showValue showRange />
      <GlassSlider variant="accent" defaultValue={[45]} label="Accent (Violet)" showValue showRange />
      <GlassSlider variant="success" defaultValue={[80]} label="Success (Emerald)" showValue showRange />
    </div>
  ),
};

export const GlowDemo: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-neutral-500">Hover/drag thumbs to see neon glow rings</p>
      <GlassSlider variant="default" defaultValue={[50]} label="Hover for cyan glow" showValue size="lg" />
      <GlassSlider variant="accent" defaultValue={[50]} label="Hover for violet glow" showValue size="lg" />
      <GlassSlider variant="success" defaultValue={[50]} label="Hover for emerald glow" showValue size="lg" />
    </div>
  ),
};

export const RangeWithVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <GlassSlider
        variant="default"
        defaultValue={[20, 80]}
        label="Default Range"
        showValue
        showRange
        formatValue={(v: number) => `${v}%`}
      />
      <GlassSlider
        variant="accent"
        defaultValue={[30, 70]}
        label="Accent Range"
        showValue
        showRange
        formatValue={(v: number) => `${v}%`}
      />
    </div>
  ),
};

export const WithTooltipAllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-10">
      <GlassSlider size="sm" defaultValue={[30]} label="Small + Tooltip" showTooltip />
      <GlassSlider size="default" defaultValue={[50]} label="Default + Tooltip" showTooltip />
      <GlassSlider size="lg" defaultValue={[70]} label="Large + Tooltip" showTooltip />
    </div>
  ),
};

import type { Meta, StoryObj } from "@storybook/react";
import { GlassDataCard } from "./GlassDataCard";

const meta: Meta<typeof GlassDataCard> = {
  title: "Primitives/Molecules/GlassDataCard",
  component: GlassDataCard,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "warning", "danger", "accent"],
    },
    size: {
      control: "select",
      options: ["compact", "default", "expanded"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlassDataCard>;

export const Default: Story = {
  args: {
    label: "Revenue",
    value: "$45.2K",
    numericValue: 45200,
    prefix: "$",
    trend: 12.5,
    sparklineData: [30000, 32000, 35000, 38000, 40000, 42000, 45200],
  },
};

export const Grid: Story = {
  decorators: [
    (Story) => (
      <div className="grid grid-cols-2 gap-4 w-[540px]">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <GlassDataCard
        label="Revenue"
        value="$45.2K"
        numericValue={45200}
        prefix="$"
        trend={12.5}
        variant="success"
        sparklineData={[30000, 32000, 35000, 38000, 40000, 42000, 45200]}
      />
      <GlassDataCard
        label="Users"
        value="12.8K"
        numericValue={12847}
        trend={8.3}
        variant="accent"
        sparklineData={[10000, 10500, 11000, 11500, 12000, 12500, 12847]}
      />
      <GlassDataCard
        label="Latency"
        value="142ms"
        numericValue={142}
        suffix="ms"
        trend={-9.0}
        variant="warning"
        sparklineData={[200, 180, 175, 160, 156, 150, 142]}
      />
      <GlassDataCard
        label="Uptime"
        value="99.97%"
        numericValue={9997}
        suffix="%"
        trend={0}
        variant="default"
        sparklineData={[99.9, 99.92, 99.95, 99.96, 99.97, 99.97, 99.97]}
      />
    </>
  ),
};

export const Loading: Story = {
  args: {
    label: "Revenue",
    value: "$0",
    loading: true,
  },
};

export const Compact: Story = {
  args: {
    label: "Active Users",
    value: "2.8K",
    numericValue: 2847,
    trend: 5.2,
    size: "compact",
    variant: "accent",
  },
};

export const AllVariants: Story = {
  decorators: [
    (Story) => (
      <div className="grid grid-cols-2 gap-4 w-[540px]">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <GlassDataCard
        label="Default"
        value="1,234"
        numericValue={1234}
        trend={5.0}
        variant="default"
      />
      <GlassDataCard
        label="Success"
        value="98.5%"
        numericValue={985}
        suffix="%"
        trend={3.3}
        variant="success"
      />
      <GlassDataCard
        label="Warning"
        value="45"
        numericValue={45}
        trend={-12.0}
        variant="warning"
      />
      <GlassDataCard
        label="Danger"
        value="12"
        numericValue={12}
        trend={-25.0}
        variant="danger"
      />
      <GlassDataCard
        label="Accent"
        value="8.5K"
        numericValue={8472}
        trend={13.0}
        variant="accent"
        sparklineData={[6000, 6500, 7000, 7500, 8000, 8200, 8472]}
      />
    </>
  ),
};

import type { Meta, StoryObj } from "@storybook/react";
import { KPIStat } from "./KPIStat";

const meta: Meta<typeof KPIStat> = {
  title: "Primitives/Molecules/KPIStat",
  component: KPIStat,
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
    deltaType: {
      control: "select",
      options: ["percentage", "absolute", "none"],
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
type Story = StoryObj<typeof KPIStat>;

export const Default: Story = {
  args: {
    title: "Total Revenue",
    value: 45231.89,
    prefix: "$",
    previousValue: 37645.23,
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
      <KPIStat title="Default" value={1234} variant="default" previousValue={1100} />
      <KPIStat title="Success" value={98.5} suffix="%" variant="success" previousValue={95.2} />
      <KPIStat title="Warning" value={45} variant="warning" previousValue={60} />
      <KPIStat title="Danger" value={12} variant="danger" previousValue={25} />
      <KPIStat title="Accent" value={8472} variant="accent" previousValue={7500} />
    </>
  ),
};

export const WithSparkline: Story = {
  args: {
    title: "Weekly Users",
    value: 12453,
    previousValue: 10234,
    sparklineData: [4000, 5200, 4800, 6100, 5800, 7200, 8400, 9100, 10234, 12453],
  },
};

export const Sizes: Story = {
  decorators: [
    (Story) => (
      <div className="space-y-4 w-64">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <KPIStat title="Compact" value={1234} size="compact" />
      <KPIStat title="Default" value={1234} size="default" />
      <KPIStat title="Expanded" value={1234} size="expanded" />
    </>
  ),
};

export const DeltaTypes: Story = {
  decorators: [
    (Story) => (
      <div className="space-y-4 w-64">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <KPIStat
        title="Percentage Delta"
        value={150}
        previousValue={100}
        deltaType="percentage"
      />
      <KPIStat
        title="Absolute Delta"
        value={150}
        previousValue={100}
        deltaType="absolute"
      />
      <KPIStat title="No Delta" value={150} deltaType="none" />
    </>
  ),
};

export const WithDescription: Story = {
  args: {
    title: "Active Users",
    value: 2847,
    previousValue: 2654,
    description: "Last 7 days",
    variant: "accent",
  },
};

export const Loading: Story = {
  args: {
    title: "Loading Data",
    value: 0,
    loading: true,
  },
};

export const NegativeTrend: Story = {
  args: {
    title: "Bounce Rate",
    value: 42.3,
    suffix: "%",
    previousValue: 38.1,
    variant: "danger",
    description: "Higher is worse",
  },
};

export const CustomDelta: Story = {
  args: {
    title: "Score",
    value: 87,
    suffix: "/100",
    delta: 12,
    deltaType: "absolute",
    variant: "success",
  },
};

export const Clickable: Story = {
  args: {
    title: "Click for Details",
    value: 5678,
    previousValue: 5000,
    onClick: () => alert("KPI clicked!"),
    variant: "accent",
  },
};

export const Dashboard: Story = {
  decorators: [
    (Story) => (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-[900px]">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <KPIStat
        title="Total Revenue"
        value={45231.89}
        prefix="$"
        previousValue={37645.23}
        sparklineData={[30000, 32000, 35000, 38000, 40000, 42000, 45231]}
        variant="success"
      />
      <KPIStat
        title="Active Users"
        value={12847}
        previousValue={11234}
        sparklineData={[10000, 10500, 11000, 11234, 11500, 12000, 12847]}
        variant="accent"
      />
      <KPIStat
        title="Conversion Rate"
        value={3.2}
        suffix="%"
        previousValue={2.8}
        sparklineData={[2.1, 2.3, 2.5, 2.8, 2.9, 3.0, 3.2]}
        variant="success"
      />
      <KPIStat
        title="Avg Response Time"
        value={142}
        suffix="ms"
        previousValue={156}
        delta={-9}
        sparklineData={[200, 180, 175, 160, 156, 150, 142]}
        variant="default"
      />
    </>
  ),
};

export const MonetaryValues: Story = {
  decorators: [
    (Story) => (
      <div className="space-y-4 w-64">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <KPIStat title="Revenue" value={1234567.89} prefix="$" previousValue={1000000} />
      <KPIStat title="Cost" value={456789.12} prefix="$" previousValue={500000} variant="danger" />
      <KPIStat title="Profit" value={777778.77} prefix="$" previousValue={500000} variant="success" />
    </>
  ),
};

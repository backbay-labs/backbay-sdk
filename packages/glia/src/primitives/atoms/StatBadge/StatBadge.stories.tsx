import type { Meta, StoryObj } from "@storybook/react";
import { StatBadge } from "./StatBadge";
import { Sparkles, Heart, Coins } from "lucide-react";

const meta: Meta<typeof StatBadge> = {
  title: "Primitives/Atoms/StatBadge",
  component: StatBadge,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["xp", "streak", "difficulty", "achievement", "time", "score", "jobs", "receipts", "nodes", "trust", "disputes"],
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
    },
    glow: {
      control: "select",
      options: ["none", "subtle", "intense"],
    },
    showIcon: {
      control: "boolean",
    },
    animateValue: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatBadge>;

export const Default: Story = {
  args: {
    value: 1250,
    suffix: " XP",
    variant: "xp",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <StatBadge variant="xp" value={1250} suffix=" XP" />
      <StatBadge variant="streak" value={7} suffix=" days" />
      <StatBadge variant="difficulty" value="Medium" />
      <StatBadge variant="achievement" value="Unlocked" />
      <StatBadge variant="time" value="2:30" />
      <StatBadge variant="score" value={95} suffix="%" />
    </div>
  ),
};

export const BackbayVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <StatBadge variant="jobs" value={42} suffix=" active" />
      <StatBadge variant="receipts" value={156} />
      <StatBadge variant="nodes" value={8} suffix=" online" />
      <StatBadge variant="trust" value={98} suffix="%" />
      <StatBadge variant="disputes" value={3} suffix=" pending" />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <StatBadge size="sm" variant="xp" value={500} suffix=" XP" />
      <StatBadge size="default" variant="xp" value={1000} suffix=" XP" />
      <StatBadge size="lg" variant="xp" value={2500} suffix=" XP" />
    </div>
  ),
};

export const GlowEffects: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <StatBadge glow="none" variant="achievement" value="No Glow" />
      <StatBadge glow="subtle" variant="achievement" value="Subtle" />
      <StatBadge glow="intense" variant="achievement" value="Intense" />
    </div>
  ),
};

export const CustomIcon: Story = {
  args: {
    value: 99,
    suffix: " lives",
    variant: "score",
    icon: <Heart className="h-3 w-3 fill-current" />,
  },
};

export const WithPrefix: Story = {
  args: {
    value: 42.5,
    prefix: "$",
    suffix: "K",
    variant: "score",
    icon: <Coins className="h-3 w-3" />,
  },
};

export const NoIcon: Story = {
  args: {
    value: "Level 42",
    showIcon: false,
    variant: "achievement",
  },
};

export const LargeNumbers: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <StatBadge variant="xp" value={1000} suffix=" XP" />
      <StatBadge variant="xp" value={12500} suffix=" XP" />
      <StatBadge variant="xp" value={1250000} suffix=" XP" />
    </div>
  ),
};

export const GameStats: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 p-4 bg-card/50 rounded-lg border border-border/50">
      <StatBadge variant="xp" value={15420} suffix=" XP" glow="subtle" />
      <StatBadge variant="streak" value={14} suffix=" day streak" glow="subtle" />
      <StatBadge variant="achievement" value="3 new" icon={<Sparkles className="h-3 w-3" />} />
      <StatBadge variant="score" value={87} suffix="% accuracy" />
    </div>
  ),
};

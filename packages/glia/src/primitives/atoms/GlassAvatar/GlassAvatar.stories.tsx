import type { Meta, StoryObj } from "@storybook/react";
import { GlassAvatar } from "./GlassAvatar";

const meta: Meta<typeof GlassAvatar> = {
  title: "Primitives/Atoms/GlassAvatar",
  component: GlassAvatar,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
    },
    status: {
      control: "select",
      options: [undefined, "online", "offline", "busy", "away"],
    },
    showRing: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof GlassAvatar>;

export const Default: Story = {
  args: {
    src: "https://i.pravatar.cc/80?img=12",
    alt: "User",
    size: "md",
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <GlassAvatar size="xs" src="https://i.pravatar.cc/80?img=1" alt="XS" />
      <GlassAvatar size="sm" src="https://i.pravatar.cc/80?img=2" alt="SM" />
      <GlassAvatar size="md" src="https://i.pravatar.cc/80?img=3" alt="MD" />
      <GlassAvatar size="lg" src="https://i.pravatar.cc/80?img=4" alt="LG" />
      <GlassAvatar size="xl" src="https://i.pravatar.cc/80?img=5" alt="XL" />
    </div>
  ),
};

export const WithStatus: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <GlassAvatar size="lg" src="https://i.pravatar.cc/80?img=10" alt="Online" status="online" />
      <GlassAvatar size="lg" src="https://i.pravatar.cc/80?img=11" alt="Offline" status="offline" />
      <GlassAvatar size="lg" src="https://i.pravatar.cc/80?img=12" alt="Busy" status="busy" />
      <GlassAvatar size="lg" src="https://i.pravatar.cc/80?img=13" alt="Away" status="away" />
    </div>
  ),
};

export const Fallback: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <GlassAvatar size="md" alt="Alice Johnson" fallback="AJ" />
      <GlassAvatar size="lg" alt="Bob Smith" fallback="BS" />
      <GlassAvatar size="xl" alt="Cyntra" fallback="CY" showRing />
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <div className="flex items-center -space-x-3">
      <GlassAvatar size="lg" src="https://i.pravatar.cc/80?img=20" alt="User 1" showRing />
      <GlassAvatar size="lg" src="https://i.pravatar.cc/80?img=21" alt="User 2" showRing />
      <GlassAvatar size="lg" src="https://i.pravatar.cc/80?img=22" alt="User 3" showRing />
    </div>
  ),
};

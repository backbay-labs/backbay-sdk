import type { Meta, StoryObj } from "@storybook/react";
import { GlassBadge } from "./GlassBadge";
import { CheckCircle, AlertTriangle, Info, XCircle, Zap } from "lucide-react";

const meta: Meta<typeof GlassBadge> = {
  title: "Primitives/Atoms/GlassBadge",
  component: GlassBadge,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "warning", "error", "info"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
    pulse: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof GlassBadge>;

export const Default: Story = {
  args: {
    children: "Active",
    variant: "default",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <GlassBadge variant="default">Default</GlassBadge>
      <GlassBadge variant="success">Success</GlassBadge>
      <GlassBadge variant="warning">Warning</GlassBadge>
      <GlassBadge variant="error">Error</GlassBadge>
      <GlassBadge variant="info">Info</GlassBadge>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <GlassBadge variant="default" icon={<Zap />}>Powered</GlassBadge>
      <GlassBadge variant="success" icon={<CheckCircle />}>Verified</GlassBadge>
      <GlassBadge variant="warning" icon={<AlertTriangle />}>Caution</GlassBadge>
      <GlassBadge variant="error" icon={<XCircle />}>Failed</GlassBadge>
      <GlassBadge variant="info" icon={<Info />}>Notice</GlassBadge>
    </div>
  ),
};

export const Pulsing: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <GlassBadge variant="success" pulse>Live</GlassBadge>
      <GlassBadge variant="error" pulse>Alert</GlassBadge>
      <GlassBadge variant="default" pulse>Processing</GlassBadge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <GlassBadge size="sm" variant="default">Small</GlassBadge>
      <GlassBadge size="md" variant="default">Medium</GlassBadge>
      <GlassBadge size="sm" variant="success">Small</GlassBadge>
      <GlassBadge size="md" variant="success">Medium</GlassBadge>
    </div>
  ),
};

import type { Meta, StoryObj } from "@storybook/react";
import { GlowButton } from "./GlowButton";
import { Mail, Send, Plus, Download, Trash2 } from "lucide-react";

const meta: Meta<typeof GlowButton> = {
  title: "Primitives/Atoms/GlowButton",
  component: GlowButton,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "ghost", "outline", "destructive", "secondary"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    glow: {
      control: "select",
      options: ["none", "low", "high"],
    },
    loading: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof GlowButton>;

export const Default: Story = {
  args: {
    children: "Click me",
    variant: "default",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <GlowButton variant="default">Default</GlowButton>
      <GlowButton variant="ghost">Ghost</GlowButton>
      <GlowButton variant="outline">Outline</GlowButton>
      <GlowButton variant="destructive">Destructive</GlowButton>
      <GlowButton variant="secondary">Secondary</GlowButton>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <GlowButton size="sm">Small</GlowButton>
      <GlowButton size="default">Default</GlowButton>
      <GlowButton size="lg">Large</GlowButton>
      <GlowButton size="icon">
        <Plus className="h-4 w-4" />
      </GlowButton>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <GlowButton>
        <Mail className="h-4 w-4" />
        Send Email
      </GlowButton>
      <GlowButton variant="outline">
        <Download className="h-4 w-4" />
        Download
      </GlowButton>
      <GlowButton variant="destructive">
        <Trash2 className="h-4 w-4" />
        Delete
      </GlowButton>
    </div>
  ),
};

export const GlowEffects: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <GlowButton glow="none">No Glow</GlowButton>
      <GlowButton glow="low">Low Glow</GlowButton>
      <GlowButton glow="high">High Glow</GlowButton>
    </div>
  ),
};

export const Loading: Story = {
  args: {
    children: "Processing...",
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled",
    disabled: true,
  },
};

export const IconButtons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <GlowButton size="icon" variant="default">
        <Send className="h-4 w-4" />
      </GlowButton>
      <GlowButton size="icon" variant="ghost">
        <Mail className="h-4 w-4" />
      </GlowButton>
      <GlowButton size="icon" variant="outline">
        <Plus className="h-4 w-4" />
      </GlowButton>
      <GlowButton size="icon" variant="destructive">
        <Trash2 className="h-4 w-4" />
      </GlowButton>
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    children: "Hover & Click Me",
    variant: "outline",
    glow: "low",
  },
};

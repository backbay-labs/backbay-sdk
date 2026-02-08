import type { Meta, StoryObj } from "@storybook/react";
import { GlassTextarea } from "./GlassTextarea";

const meta: Meta<typeof GlassTextarea> = {
  title: "Primitives/Atoms/GlassTextarea",
  component: GlassTextarea,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "error", "success"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlassTextarea>;

export const Default: Story = {
  args: {
    placeholder: "Enter your message...",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Description",
    placeholder: "Describe your project...",
    description: "Provide a brief summary of the project goals.",
  },
};

export const AutoResize: Story = {
  args: {
    label: "Auto-resize Textarea",
    placeholder: "Start typing and this textarea will grow...",
    autoResize: true,
    description: "This textarea grows with its content.",
  },
};

export const WithCount: Story = {
  args: {
    label: "Bio",
    placeholder: "Tell us about yourself...",
    showCount: true,
    maxLength: 280,
    defaultValue: "I build glass-themed UI components.",
  },
};

export const ErrorState: Story = {
  args: {
    label: "Message",
    placeholder: "Enter a message...",
    error: "Message is required and must be at least 10 characters.",
    defaultValue: "Hi",
    showCount: true,
  },
};

export const SuccessState: Story = {
  args: {
    label: "Notes",
    variant: "success",
    placeholder: "Add notes...",
    defaultValue: "All checks passed successfully.",
    description: "Input validated.",
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <GlassTextarea size="sm" placeholder="Small textarea" label="Small" />
      <GlassTextarea size="default" placeholder="Default textarea" label="Default" />
      <GlassTextarea size="lg" placeholder="Large textarea" label="Large" />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    label: "Disabled Textarea",
    placeholder: "Cannot edit",
    disabled: true,
    defaultValue: "This content is read-only.",
  },
};

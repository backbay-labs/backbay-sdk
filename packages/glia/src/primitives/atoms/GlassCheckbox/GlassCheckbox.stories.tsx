import type { Meta, StoryObj } from "@storybook/react";
import { GlassCheckbox } from "./GlassCheckbox";
import { useState } from "react";

const meta: Meta<typeof GlassCheckbox> = {
  title: "Primitives/Atoms/GlassCheckbox",
  component: GlassCheckbox,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
    },
    checked: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
    disableAnimations: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof GlassCheckbox>;

export const Default: Story = {
  args: {
    label: "Accept terms and conditions",
  },
};

export const WithDescription: Story = {
  args: {
    label: "Marketing emails",
    description: "Receive emails about new products, features, and more.",
  },
};

export const Checked: Story = {
  args: {
    label: "Remember me",
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-3">
      <GlassCheckbox label="Disabled unchecked" disabled />
      <GlassCheckbox label="Disabled checked" disabled defaultChecked />
    </div>
  ),
};

export const WithError: Story = {
  args: {
    label: "I agree to the terms",
    error: "You must accept the terms to continue.",
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <GlassCheckbox size="sm" label="Small checkbox" />
      <GlassCheckbox size="default" label="Default checkbox" />
      <GlassCheckbox size="lg" label="Large checkbox" />
    </div>
  ),
};

export const Controlled: Story = {
  render: function ControlledCheckbox() {
    const [checked, setChecked] = useState(false);
    return (
      <div className="space-y-3">
        <GlassCheckbox
          label="Controlled checkbox"
          description={`Current state: ${checked ? "checked" : "unchecked"}`}
          checked={checked}
          onCheckedChange={(value) => setChecked(value === true)}
        />
        <button
          onClick={() => setChecked(!checked)}
          className="text-xs text-cyan-400 underline"
        >
          Toggle from outside
        </button>
      </div>
    );
  },
};

export const MultipleOptions: Story = {
  render: () => (
    <div className="space-y-3">
      <GlassCheckbox label="Email notifications" defaultChecked />
      <GlassCheckbox
        label="SMS notifications"
        description="Standard messaging rates may apply."
      />
      <GlassCheckbox label="Push notifications" defaultChecked />
      <GlassCheckbox label="In-app notifications" />
    </div>
  ),
};

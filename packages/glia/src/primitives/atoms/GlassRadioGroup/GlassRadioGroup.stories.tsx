import type { Meta, StoryObj } from "@storybook/react";
import { GlassRadioGroup, GlassRadioGroupItem } from "./GlassRadioGroup";
import { useState } from "react";

const meta: Meta<typeof GlassRadioGroup> = {
  title: "Primitives/Atoms/GlassRadioGroup",
  component: GlassRadioGroup,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof GlassRadioGroup>;

export const Default: Story = {
  render: () => (
    <GlassRadioGroup defaultValue="option-1">
      <GlassRadioGroupItem value="option-1" label="Option one" />
      <GlassRadioGroupItem value="option-2" label="Option two" />
      <GlassRadioGroupItem value="option-3" label="Option three" />
    </GlassRadioGroup>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <GlassRadioGroup label="Select a plan" defaultValue="pro">
      <GlassRadioGroupItem value="free" label="Free" />
      <GlassRadioGroupItem value="pro" label="Pro" />
      <GlassRadioGroupItem value="enterprise" label="Enterprise" />
    </GlassRadioGroup>
  ),
};

export const WithDescriptions: Story = {
  render: () => (
    <GlassRadioGroup label="Notification preference" defaultValue="email">
      <GlassRadioGroupItem
        value="email"
        label="Email"
        description="Get notified via email for all updates."
      />
      <GlassRadioGroupItem
        value="sms"
        label="SMS"
        description="Receive text messages for critical alerts only."
      />
      <GlassRadioGroupItem
        value="push"
        label="Push notifications"
        description="Real-time browser and mobile push notifications."
      />
    </GlassRadioGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <GlassRadioGroup direction="horizontal" defaultValue="monthly">
      <GlassRadioGroupItem value="monthly" label="Monthly" />
      <GlassRadioGroupItem value="yearly" label="Yearly" />
      <GlassRadioGroupItem value="lifetime" label="Lifetime" />
    </GlassRadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <GlassRadioGroup defaultValue="active" disabled>
      <GlassRadioGroupItem value="active" label="Active" />
      <GlassRadioGroupItem value="inactive" label="Inactive" />
      <GlassRadioGroupItem value="archived" label="Archived" />
    </GlassRadioGroup>
  ),
};

export const WithError: Story = {
  render: () => (
    <GlassRadioGroup label="Priority level" error="Please select a priority level.">
      <GlassRadioGroupItem value="low" label="Low" />
      <GlassRadioGroupItem value="medium" label="Medium" />
      <GlassRadioGroupItem value="high" label="High" />
    </GlassRadioGroup>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-6">
      <GlassRadioGroup label="Small" defaultValue="a">
        <GlassRadioGroupItem size="sm" value="a" label="Option A" />
        <GlassRadioGroupItem size="sm" value="b" label="Option B" />
      </GlassRadioGroup>
      <GlassRadioGroup label="Default" defaultValue="a">
        <GlassRadioGroupItem size="default" value="a" label="Option A" />
        <GlassRadioGroupItem size="default" value="b" label="Option B" />
      </GlassRadioGroup>
      <GlassRadioGroup label="Large" defaultValue="a">
        <GlassRadioGroupItem size="lg" value="a" label="Option A" />
        <GlassRadioGroupItem size="lg" value="b" label="Option B" />
      </GlassRadioGroup>
    </div>
  ),
};

export const Controlled: Story = {
  render: function ControlledRadioGroup() {
    const [value, setValue] = useState("react");
    return (
      <div className="space-y-3">
        <GlassRadioGroup
          label="Preferred framework"
          value={value}
          onValueChange={setValue}
        >
          <GlassRadioGroupItem value="react" label="React" />
          <GlassRadioGroupItem value="vue" label="Vue" />
          <GlassRadioGroupItem value="svelte" label="Svelte" />
          <GlassRadioGroupItem value="angular" label="Angular" />
        </GlassRadioGroup>
        <p className="text-xs text-slate-400">
          Selected: <span className="text-cyan-400">{value}</span>
        </p>
      </div>
    );
  },
};

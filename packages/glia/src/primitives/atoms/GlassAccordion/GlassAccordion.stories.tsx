import type { Meta, StoryObj } from "@storybook/react";
import { GlassAccordion, GlassAccordionItem } from "./GlassAccordion";
import { Settings, Shield, Zap, Bell, User } from "lucide-react";
import React from "react";

const meta: Meta<typeof GlassAccordion> = {
  title: "Primitives/Atoms/GlassAccordion",
  component: GlassAccordion,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "card", "flush"],
    },
    type: {
      control: "select",
      options: ["single", "multiple"],
    },
    collapsible: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 400, padding: 32 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlassAccordion>;

const sampleItems = (
  <>
    <GlassAccordionItem value="item-1" trigger="What is BackbayOS?">
      BackbayOS is a decentralized autonomous production marketplace with a desktop-style
      interface. It provides themed clusters and social experiences within a unified platform.
    </GlassAccordionItem>
    <GlassAccordionItem value="item-2" trigger="How does theming work?">
      The UI supports multiple theme skins including Nebula (clinical cyberpunk) and
      Solarpunk (botanical observatory). Themes control colors, glass effects, motion,
      and ambient backgrounds.
    </GlassAccordionItem>
    <GlassAccordionItem value="item-3" trigger="Can I create custom clusters?">
      Yes. Clusters are themed subdomains with their own subeconomies and social
      experiences. Each cluster can define its own visual identity while sharing
      the core platform components.
    </GlassAccordionItem>
  </>
);

export const Default: Story = {
  render: () => (
    <GlassAccordion defaultValue="item-1">{sampleItems}</GlassAccordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <GlassAccordion type="multiple" defaultValue={["item-1", "item-2"]}>
      {sampleItems}
    </GlassAccordion>
  ),
};

export const CardVariant: Story = {
  render: () => (
    <GlassAccordion variant="card" defaultValue="item-1">
      {sampleItems}
    </GlassAccordion>
  ),
};

export const FlushVariant: Story = {
  render: () => (
    <GlassAccordion variant="flush" defaultValue="item-1">
      {sampleItems}
    </GlassAccordion>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <GlassAccordion defaultValue="settings">
      <GlassAccordionItem
        value="settings"
        trigger="General Settings"
        icon={<Settings className="h-4 w-4" />}
      >
        Configure your general application preferences and defaults.
      </GlassAccordionItem>
      <GlassAccordionItem
        value="security"
        trigger="Security"
        icon={<Shield className="h-4 w-4" />}
      >
        Manage authentication, permissions, and security policies.
      </GlassAccordionItem>
      <GlassAccordionItem
        value="performance"
        trigger="Performance"
        icon={<Zap className="h-4 w-4" />}
      >
        Optimize resource allocation and processing pipelines.
      </GlassAccordionItem>
      <GlassAccordionItem
        value="notifications"
        trigger="Notifications"
        icon={<Bell className="h-4 w-4" />}
      >
        Configure alert thresholds and notification channels.
      </GlassAccordionItem>
    </GlassAccordion>
  ),
};

export const Disabled: Story = {
  render: () => (
    <GlassAccordion defaultValue="item-1">
      <GlassAccordionItem value="item-1" trigger="Enabled item">
        This item is interactive and can be toggled.
      </GlassAccordionItem>
      <GlassAccordionItem value="item-2" trigger="Disabled item" disabled>
        This item is disabled and cannot be interacted with.
      </GlassAccordionItem>
      <GlassAccordionItem value="item-3" trigger="Another enabled item">
        This item works normally.
      </GlassAccordionItem>
    </GlassAccordion>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = React.useState<string>("item-1");
    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setValue("item-1")}
            className="px-3 py-1 text-xs rounded border border-white/20 text-white/70 hover:bg-white/10"
          >
            Open 1
          </button>
          <button
            onClick={() => setValue("item-2")}
            className="px-3 py-1 text-xs rounded border border-white/20 text-white/70 hover:bg-white/10"
          >
            Open 2
          </button>
          <button
            onClick={() => setValue("item-3")}
            className="px-3 py-1 text-xs rounded border border-white/20 text-white/70 hover:bg-white/10"
          >
            Open 3
          </button>
        </div>
        <GlassAccordion value={value} onValueChange={(v) => setValue(v as string)}>
          {sampleItems}
        </GlassAccordion>
      </div>
    );
  },
};

import type { Meta, StoryObj } from "@storybook/react";
import { GlassSelect } from "./GlassSelect";

const meta: Meta<typeof GlassSelect> = {
  title: "Primitives/Molecules/GlassSelect",
  component: GlassSelect,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "error"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlassSelect>;

const clusterOptions = [
  { value: "alexandria", label: "Alexandria" },
  { value: "alpha", label: "Alpha" },
  { value: "baia", label: "Baia" },
  { value: "opus", label: "Opus" },
  { value: "providence", label: "Providence" },
];

export const Default: Story = {
  args: {
    placeholder: "Select a cluster...",
    options: clusterOptions,
  },
};

export const WithLabel: Story = {
  args: {
    label: "Cluster",
    placeholder: "Select a cluster...",
    options: clusterOptions,
    description: "Choose a cluster to deploy to.",
  },
};

export const Grouped: Story = {
  args: {
    label: "Region",
    placeholder: "Select a region...",
    groups: [
      {
        label: "North America",
        options: [
          { value: "us-east", label: "US East" },
          { value: "us-west", label: "US West" },
          { value: "ca-central", label: "Canada Central" },
        ],
      },
      {
        label: "Europe",
        options: [
          { value: "eu-west", label: "EU West" },
          { value: "eu-north", label: "EU North" },
        ],
      },
      {
        label: "Asia Pacific",
        options: [
          { value: "ap-southeast", label: "AP Southeast" },
          { value: "ap-northeast", label: "AP Northeast" },
        ],
      },
    ],
  },
};

export const Disabled: Story = {
  args: {
    label: "Cluster",
    placeholder: "Select a cluster...",
    options: clusterOptions,
    disabled: true,
    description: "Selection is currently disabled.",
  },
};

export const ErrorState: Story = {
  args: {
    label: "Cluster",
    placeholder: "Select a cluster...",
    options: clusterOptions,
    error: "A cluster selection is required.",
  },
};

export const WithDisabledOptions: Story = {
  args: {
    label: "Status",
    placeholder: "Select status...",
    options: [
      { value: "active", label: "Active" },
      { value: "pending", label: "Pending" },
      { value: "archived", label: "Archived", disabled: true },
      { value: "deleted", label: "Deleted", disabled: true },
    ],
  },
};

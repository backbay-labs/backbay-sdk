import type { Meta, StoryObj } from "@storybook/react";
import { GlassDatePicker } from "./GlassDatePicker";

const meta: Meta<typeof GlassDatePicker> = {
  title: "Primitives/Molecules/GlassDatePicker",
  component: GlassDatePicker,
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
    mode: {
      control: "select",
      options: ["single", "range"],
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
type Story = StoryObj<typeof GlassDatePicker>;

export const Default: Story = {
  args: {
    defaultValue: "2026-02-08",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Launch Date",
    defaultValue: "2026-02-08",
    description: "Select the target launch date for your deployment.",
  },
};

export const Range: Story = {
  decorators: [
    (Story) => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
  args: {
    label: "Date Range",
    mode: "range",
    defaultValue: "2026-01-01",
    defaultEndValue: "2026-02-08",
    description: "Select a start and end date.",
  },
};

export const Disabled: Story = {
  args: {
    label: "Locked Date",
    defaultValue: "2026-02-08",
    disabled: true,
    description: "This date cannot be changed.",
  },
};

export const ErrorState: Story = {
  args: {
    label: "Due Date",
    error: "Due date must be in the future.",
    defaultValue: "2024-01-01",
  },
};

export const WithMinMax: Story = {
  args: {
    label: "Booking Date",
    min: "2026-02-01",
    max: "2026-12-31",
    description: "Select a date between Feb 2026 and Dec 2026.",
  },
};

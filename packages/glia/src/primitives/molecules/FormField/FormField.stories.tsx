import type { Meta, StoryObj } from "@storybook/react";
import { FormField } from "./FormField";

const meta: Meta<typeof FormField> = {
  title: "Primitives/Molecules/FormField",
  component: FormField,
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
type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  args: {
    label: "Email",
    children: (
      <input
        className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="you@example.com"
      />
    ),
  },
};

export const WithDescription: Story = {
  args: {
    label: "Username",
    description: "This will be your public display name.",
    children: (
      <input
        className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="backbay_user"
      />
    ),
  },
};

export const WithError: Story = {
  args: {
    label: "Password",
    error: "Password must be at least 8 characters.",
    children: (
      <input
        type="password"
        className="flex h-10 w-full rounded-md border border-destructive bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        defaultValue="short"
      />
    ),
  },
};

export const Required: Story = {
  args: {
    label: "Full Name",
    required: true,
    description: "Enter your legal name.",
    children: (
      <input
        className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="Jane Doe"
      />
    ),
  },
};

export const AllSizes: Story = {
  decorators: [
    (Story) => (
      <div className="w-80 space-y-6">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <FormField label="Small" size="sm" description="Compact spacing">
        <input
          className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="sm"
        />
      </FormField>
      <FormField label="Default" size="default" description="Standard spacing">
        <input
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="default"
        />
      </FormField>
      <FormField label="Large" size="lg" description="Spacious layout">
        <input
          className="flex h-11 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="lg"
        />
      </FormField>
    </>
  ),
};

export const Disabled: Story = {
  args: {
    label: "Locked Field",
    disabled: true,
    description: "This field cannot be modified.",
    children: (
      <input
        disabled
        className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        defaultValue="Read-only value"
      />
    ),
  },
};

export const CompleteForm: Story = {
  decorators: [
    (Story) => (
      <div className="w-96 space-y-1 p-6 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm">
        <Story />
      </div>
    ),
  ],
  render: () => {
    const inputClass =
      "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
    return (
      <>
        <h2 className="text-lg font-semibold mb-4">Create Account</h2>
        <FormField label="Full Name" required>
          <input className={inputClass} placeholder="Jane Doe" />
        </FormField>
        <FormField
          label="Email"
          required
          description="We will never share your email."
        >
          <input
            type="email"
            className={inputClass}
            placeholder="jane@backbay.io"
          />
        </FormField>
        <FormField
          label="Password"
          required
          error="Must contain at least one number."
        >
          <input
            type="password"
            className={inputClass}
            defaultValue="password"
          />
        </FormField>
        <FormField label="Bio" description="Tell us about yourself.">
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            placeholder="Optional bio..."
          />
        </FormField>
      </>
    );
  },
};

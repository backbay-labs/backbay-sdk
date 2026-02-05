import type { Meta, StoryObj } from "@storybook/react";
import { GlowInput } from "./GlowInput";
import { Search, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const meta: Meta<typeof GlowInput> = {
  title: "Primitives/Atoms/GlowInput",
  component: GlowInput,
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
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlowInput>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

export const WithLabel: Story = {
  args: {
    label: "Email Address",
    placeholder: "you@example.com",
  },
};

export const WithDescription: Story = {
  args: {
    label: "Username",
    placeholder: "johndoe",
    description: "This will be your public display name.",
  },
};

export const WithError: Story = {
  args: {
    label: "Email",
    placeholder: "you@example.com",
    error: "Please enter a valid email address.",
    defaultValue: "invalid-email",
  },
};

export const SuccessState: Story = {
  args: {
    label: "Email",
    placeholder: "you@example.com",
    variant: "success",
    defaultValue: "valid@email.com",
    description: "Email verified successfully!",
  },
};

export const WithLeftIcon: Story = {
  args: {
    label: "Search",
    placeholder: "Search...",
    leftIcon: <Search className="h-4 w-4" />,
  },
};

export const WithRightIcon: Story = {
  args: {
    label: "Email",
    placeholder: "you@example.com",
    leftIcon: <Mail className="h-4 w-4" />,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <GlowInput size="sm" placeholder="Small input" label="Small" />
      <GlowInput size="default" placeholder="Default input" label="Default" />
      <GlowInput size="lg" placeholder="Large input" label="Large" />
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <div className="space-y-4">
      <GlowInput
        label="Email"
        type="email"
        placeholder="you@example.com"
        leftIcon={<Mail className="h-4 w-4" />}
      />
      <GlowInput
        label="Username"
        placeholder="johndoe"
        leftIcon={<User className="h-4 w-4" />}
      />
      <GlowInput
        label="Password"
        type="password"
        placeholder="••••••••"
        leftIcon={<Lock className="h-4 w-4" />}
      />
    </div>
  ),
};

export const PasswordToggle: Story = {
  render: function PasswordToggleStory() {
    const [showPassword, setShowPassword] = useState(false);
    return (
      <GlowInput
        label="Password"
        type={showPassword ? "text" : "password"}
        placeholder="Enter password"
        leftIcon={<Lock className="h-4 w-4" />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    label: "Disabled Input",
    placeholder: "Cannot edit",
    disabled: true,
    defaultValue: "Readonly value",
  },
};

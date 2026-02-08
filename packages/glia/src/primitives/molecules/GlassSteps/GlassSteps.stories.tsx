import type { Meta, StoryObj } from "@storybook/react";
import { GlassSteps } from "./GlassSteps";
import { User, Settings, FileText, CheckCircle } from "lucide-react";
import { useState } from "react";

const meta: Meta<typeof GlassSteps> = {
  title: "Primitives/Molecules/GlassSteps",
  component: GlassSteps,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    layout: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[500px] p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlassSteps>;

const defaultSteps = [
  { label: "Account" },
  { label: "Profile" },
  { label: "Preferences" },
  { label: "Review" },
];

export const Default: Story = {
  args: {
    steps: defaultSteps,
    activeStep: 1,
  },
};

export const Completed: Story = {
  args: {
    steps: defaultSteps,
    activeStep: 4,
  },
};

export const Vertical: Story = {
  args: {
    steps: [
      { label: "Account", description: "Create your account" },
      { label: "Profile", description: "Set up your profile" },
      { label: "Preferences", description: "Configure settings" },
      { label: "Review", description: "Confirm details" },
    ],
    activeStep: 2,
    layout: "vertical",
  },
};

export const WithIcons: Story = {
  args: {
    steps: [
      { label: "Account", icon: <User className="h-4 w-4 text-current" /> },
      { label: "Profile", icon: <FileText className="h-4 w-4 text-current" /> },
      { label: "Settings", icon: <Settings className="h-4 w-4 text-current" /> },
      { label: "Done", icon: <CheckCircle className="h-4 w-4 text-current" /> },
    ],
    activeStep: 1,
  },
};

export const Interactive: Story = {
  render: () => {
    const [active, setActive] = useState(0);
    return (
      <div className="space-y-6">
        <GlassSteps
          steps={defaultSteps}
          activeStep={active}
          onStepClick={setActive}
        />
        <div className="flex justify-between">
          <button
            type="button"
            className="px-3 py-1 text-xs font-mono uppercase tracking-wider text-muted-foreground border border-white/[0.1] rounded-md bg-transparent hover:border-cyan-neon/40 transition-colors"
            onClick={() => setActive((s) => Math.max(0, s - 1))}
            disabled={active === 0}
          >
            Back
          </button>
          <button
            type="button"
            className="px-3 py-1 text-xs font-mono uppercase tracking-wider text-cyan-neon border border-cyan-neon/30 rounded-md bg-cyan-neon/5 hover:bg-cyan-neon/10 transition-colors"
            onClick={() => setActive((s) => Math.min(defaultSteps.length, s + 1))}
            disabled={active >= defaultSteps.length}
          >
            Next
          </button>
        </div>
      </div>
    );
  },
};

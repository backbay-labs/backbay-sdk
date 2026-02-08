import type { Meta, StoryObj } from "@storybook/react";
import { GlassModal } from "./GlassModal";
import { GlowButton } from "../../atoms/GlowButton/GlowButton";
import { useState } from "react";

const meta: Meta<typeof GlassModal> = {
  title: "Primitives/Organisms/GlassModal",
  component: GlassModal,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
    },
    showCloseButton: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof GlassModal>;

// ============================================================================
// DEFAULT — Delete confirmation
// ============================================================================

export const Default: Story = {
  args: {
    open: true,
    title: "Delete Cluster",
    description: "This action cannot be undone. The cluster and all its data will be permanently removed.",
    size: "md",
    showCloseButton: true,
  },
  render: (args) => (
    <GlassModal
      {...args}
      onOpenChange={() => {}}
      footer={
        <div className="flex gap-2">
          <GlowButton variant="ghost" size="sm">
            Cancel
          </GlowButton>
          <GlowButton variant="destructive" size="sm">
            Delete
          </GlowButton>
        </div>
      }
    >
      <p className="text-sm text-white/60 leading-relaxed">
        You are about to delete{" "}
        <span className="font-mono text-[#F43F5E]">cluster-opus-7</span>. All
        associated nodes, data, and configurations will be permanently erased.
      </p>
    </GlassModal>
  ),
};

// ============================================================================
// FORM — Modal with input fields
// ============================================================================

export const Form: Story = {
  render: () => (
    <GlassModal
      open
      onOpenChange={() => {}}
      title="New Cluster"
      description="Configure a new cluster instance."
      size="md"
      footer={
        <div className="flex gap-2">
          <GlowButton variant="ghost" size="sm">
            Cancel
          </GlowButton>
          <GlowButton variant="default" size="sm">
            Create
          </GlowButton>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-white/50">
            Cluster Name
          </label>
          <input
            type="text"
            placeholder="my-cluster"
            className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#22D3EE]/40 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-white/50">
            Region
          </label>
          <select className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22D3EE]/40 transition-colors">
            <option value="us-east">US East</option>
            <option value="us-west">US West</option>
            <option value="eu-west">EU West</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-white/50">
            Description
          </label>
          <textarea
            placeholder="Optional description..."
            rows={3}
            className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#22D3EE]/40 transition-colors resize-none"
          />
        </div>
      </div>
    </GlassModal>
  ),
};

// ============================================================================
// LARGE — xl with rich content
// ============================================================================

export const Large: Story = {
  render: () => (
    <GlassModal
      open
      onOpenChange={() => {}}
      title="System Diagnostics"
      description="Overview of all active subsystems and their operational status."
      size="xl"
      footer={
        <div className="flex gap-2">
          <GlowButton variant="ghost" size="sm">
            Export
          </GlowButton>
          <GlowButton variant="default" size="sm">
            Run Diagnostics
          </GlowButton>
        </div>
      }
    >
      <div className="space-y-3">
        {[
          { name: "Neural Core", status: "Online", color: "#10B981" },
          { name: "Quantum Bridge", status: "Degraded", color: "#EAB308" },
          { name: "Memory Banks", status: "Online", color: "#10B981" },
          { name: "Comms Array", status: "Offline", color: "#F43F5E" },
          { name: "Shield Matrix", status: "Online", color: "#10B981" },
        ].map((sys) => (
          <div
            key={sys.name}
            className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/[0.06] px-4 py-3"
          >
            <span className="font-mono text-xs text-white/80">{sys.name}</span>
            <span
              className="font-mono text-[10px] uppercase tracking-[0.12em]"
              style={{ color: sys.color }}
            >
              {sys.status}
            </span>
          </div>
        ))}
      </div>
    </GlassModal>
  ),
};

// ============================================================================
// INTERACTIVE — button trigger
// ============================================================================

export const Interactive: Story = {
  render: function InteractiveStory() {
    const [open, setOpen] = useState(false);

    return (
      <div>
        <GlowButton variant="outline" onClick={() => setOpen(true)}>
          Open Modal
        </GlowButton>
        <GlassModal
          open={open}
          onOpenChange={setOpen}
          title="Confirm Action"
          description="Are you sure you want to proceed?"
          footer={
            <div className="flex gap-2">
              <GlowButton variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </GlowButton>
              <GlowButton variant="default" size="sm" onClick={() => setOpen(false)}>
                Confirm
              </GlowButton>
            </div>
          }
        >
          <p className="text-sm text-white/60">
            This will deploy the selected configuration to all active clusters.
          </p>
        </GlassModal>
      </div>
    );
  },
};

// ============================================================================
// SIZES — all size variants
// ============================================================================

export const Sizes: Story = {
  render: function SizesStory() {
    const [size, setSize] = useState<"sm" | "md" | "lg" | "xl">("md");
    const [open, setOpen] = useState(false);

    return (
      <div className="flex gap-2">
        {(["sm", "md", "lg", "xl"] as const).map((s) => (
          <GlowButton
            key={s}
            variant="ghost"
            size="sm"
            onClick={() => {
              setSize(s);
              setOpen(true);
            }}
          >
            {s.toUpperCase()}
          </GlowButton>
        ))}
        <GlassModal
          open={open}
          onOpenChange={setOpen}
          title={`Size: ${size.toUpperCase()}`}
          description={`This is a ${size} modal.`}
          size={size}
          footer={
            <GlowButton variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Close
            </GlowButton>
          }
        >
          <p className="text-sm text-white/60">
            Content area for the {size} variant.
          </p>
        </GlassModal>
      </div>
    );
  },
};

import type { Meta, StoryObj } from "@storybook/react";
import { useRef } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import {
  GlassResizableGroup,
  GlassResizablePanel,
  GlassResizeHandle,
} from "./GlassResizable";

const meta: Meta<typeof GlassResizableGroup> = {
  title: "Primitives/Organisms/GlassResizable",
  component: GlassResizableGroup,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-6 h-screen bg-[#02040a]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlassResizableGroup>;

// ============================================================================
// Helpers
// ============================================================================

function PanelContent({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="text-center">
        <p className="text-sm font-medium text-[#E5E7EB]">{label}</p>
        {description && (
          <p className="mt-1 text-xs text-[#64748B]">{description}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  render: () => (
    <GlassResizableGroup direction="horizontal" className="h-[400px] rounded-lg border border-border/20">
      <GlassResizablePanel defaultSize={50}>
        <PanelContent label="Panel A" description="Drag the handle to resize" />
      </GlassResizablePanel>
      <GlassResizeHandle orientation="horizontal" />
      <GlassResizablePanel defaultSize={50}>
        <PanelContent label="Panel B" />
      </GlassResizablePanel>
    </GlassResizableGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <GlassResizableGroup direction="vertical" className="h-[500px] rounded-lg border border-border/20">
      <GlassResizablePanel defaultSize={50}>
        <PanelContent label="Top" />
      </GlassResizablePanel>
      <GlassResizeHandle orientation="vertical" />
      <GlassResizablePanel defaultSize={50}>
        <PanelContent label="Bottom" />
      </GlassResizablePanel>
    </GlassResizableGroup>
  ),
};

export const ThreePanels: Story = {
  render: () => (
    <GlassResizableGroup direction="horizontal" className="h-[400px] rounded-lg border border-border/20">
      <GlassResizablePanel defaultSize={30} minSize={15}>
        <PanelContent label="Left" />
      </GlassResizablePanel>
      <GlassResizeHandle orientation="horizontal" />
      <GlassResizablePanel defaultSize={40} minSize={20}>
        <PanelContent label="Center" />
      </GlassResizablePanel>
      <GlassResizeHandle orientation="horizontal" />
      <GlassResizablePanel defaultSize={30} minSize={15}>
        <PanelContent label="Right" />
      </GlassResizablePanel>
    </GlassResizableGroup>
  ),
};

export const Nested: Story = {
  name: "Nested (IDE Layout)",
  render: () => (
    <GlassResizableGroup direction="horizontal" className="h-[500px] rounded-lg border border-border/20">
      <GlassResizablePanel defaultSize={20} minSize={12}>
        <PanelContent label="Sidebar" description="File tree" />
      </GlassResizablePanel>
      <GlassResizeHandle orientation="horizontal" />
      <GlassResizablePanel defaultSize={80}>
        <GlassResizableGroup direction="vertical">
          <GlassResizablePanel defaultSize={70}>
            <PanelContent label="Editor" description="Main content area" />
          </GlassResizablePanel>
          <GlassResizeHandle orientation="vertical" />
          <GlassResizablePanel defaultSize={30} minSize={15}>
            <PanelContent label="Terminal" description="Output panel" />
          </GlassResizablePanel>
        </GlassResizableGroup>
      </GlassResizablePanel>
    </GlassResizableGroup>
  ),
};

export const HandleVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-mono uppercase tracking-wider text-[#64748B]">Subtle</p>
        <GlassResizableGroup
          direction="horizontal"
          handleVariant="subtle"
          className="h-[120px] rounded-lg border border-border/20"
        >
          <GlassResizablePanel defaultSize={50}>
            <PanelContent label="A" />
          </GlassResizablePanel>
          <GlassResizeHandle orientation="horizontal" />
          <GlassResizablePanel defaultSize={50}>
            <PanelContent label="B" />
          </GlassResizablePanel>
        </GlassResizableGroup>
      </div>
      <div>
        <p className="mb-2 text-xs font-mono uppercase tracking-wider text-[#64748B]">Default</p>
        <GlassResizableGroup
          direction="horizontal"
          handleVariant="default"
          className="h-[120px] rounded-lg border border-border/20"
        >
          <GlassResizablePanel defaultSize={50}>
            <PanelContent label="A" />
          </GlassResizablePanel>
          <GlassResizeHandle orientation="horizontal" />
          <GlassResizablePanel defaultSize={50}>
            <PanelContent label="B" />
          </GlassResizablePanel>
        </GlassResizableGroup>
      </div>
      <div>
        <p className="mb-2 text-xs font-mono uppercase tracking-wider text-[#64748B]">Prominent</p>
        <GlassResizableGroup
          direction="horizontal"
          handleVariant="prominent"
          className="h-[120px] rounded-lg border border-border/20"
        >
          <GlassResizablePanel defaultSize={50}>
            <PanelContent label="A" />
          </GlassResizablePanel>
          <GlassResizeHandle orientation="horizontal" />
          <GlassResizablePanel defaultSize={50}>
            <PanelContent label="B" />
          </GlassResizablePanel>
        </GlassResizableGroup>
      </div>
    </div>
  ),
};

export const WithGlassBackground: Story = {
  render: () => (
    <GlassResizableGroup direction="horizontal" className="h-[400px] rounded-lg border border-border/20">
      <GlassResizablePanel defaultSize={50} glass>
        <PanelContent label="Glass Panel" description="Has glass card background" />
      </GlassResizablePanel>
      <GlassResizeHandle orientation="horizontal" />
      <GlassResizablePanel defaultSize={50}>
        <PanelContent label="Plain Panel" description="No glass background" />
      </GlassResizablePanel>
    </GlassResizableGroup>
  ),
};

export const CollapsiblePanel: Story = {
  render: function CollapsiblePanelStory() {
    const panelRef = useRef<ImperativePanelHandle>(null);

    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => panelRef.current?.collapse()}
            className="rounded px-3 py-1 text-xs bg-border/30 text-[#E5E7EB] hover:bg-border/50 transition-colors"
          >
            Collapse Sidebar
          </button>
          <button
            onClick={() => panelRef.current?.expand()}
            className="rounded px-3 py-1 text-xs bg-border/30 text-[#E5E7EB] hover:bg-border/50 transition-colors"
          >
            Expand Sidebar
          </button>
        </div>
        <GlassResizableGroup direction="horizontal" className="h-[400px] rounded-lg border border-border/20">
          <GlassResizablePanel
            ref={panelRef}
            defaultSize={25}
            minSize={10}
            collapsible
            collapsedSize={0}
            glass
          >
            <PanelContent label="Collapsible" description="Can be collapsed to 0" />
          </GlassResizablePanel>
          <GlassResizeHandle orientation="horizontal" />
          <GlassResizablePanel defaultSize={75}>
            <PanelContent label="Main Content" />
          </GlassResizablePanel>
        </GlassResizableGroup>
      </div>
    );
  },
};

export const IDELayout: Story = {
  render: () => (
    <GlassResizableGroup direction="horizontal" className="h-[600px] rounded-lg border border-border/20">
      {/* Activity bar */}
      <GlassResizablePanel defaultSize={4} minSize={3} maxSize={6} glass>
        <div className="flex h-full flex-col items-center gap-3 py-3">
          {["F", "S", "G", "D"].map((letter) => (
            <div
              key={letter}
              className="flex h-8 w-8 items-center justify-center rounded text-xs font-mono text-[#64748B] hover:text-[#E5E7EB] hover:bg-border/30 transition-colors cursor-pointer"
            >
              {letter}
            </div>
          ))}
        </div>
      </GlassResizablePanel>
      <GlassResizeHandle orientation="horizontal" variant="subtle" />

      {/* Sidebar */}
      <GlassResizablePanel defaultSize={18} minSize={12} collapsible collapsedSize={0}>
        <div className="h-full p-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] mb-3">
            Explorer
          </p>
          <div className="space-y-1">
            {["src/", "  components/", "    Button.tsx", "    Panel.tsx", "  lib/", "    utils.ts", "  index.ts"].map(
              (name) => (
                <p
                  key={name}
                  className="text-xs font-mono text-[#94A3B8] hover:text-[#E5E7EB] cursor-pointer px-1 py-0.5 rounded hover:bg-border/20 transition-colors"
                >
                  {name}
                </p>
              ),
            )}
          </div>
        </div>
      </GlassResizablePanel>
      <GlassResizeHandle orientation="horizontal" variant="subtle" />

      {/* Editor + terminal */}
      <GlassResizablePanel defaultSize={78}>
        <GlassResizableGroup direction="vertical">
          {/* Editor tabs + content */}
          <GlassResizablePanel defaultSize={70}>
            <div className="h-full flex flex-col">
              <div className="flex border-b border-border/20 px-2">
                <div className="px-3 py-1.5 text-xs text-[#E5E7EB] border-b border-[#22D3EE]">
                  Button.tsx
                </div>
                <div className="px-3 py-1.5 text-xs text-[#64748B]">Panel.tsx</div>
              </div>
              <div className="flex-1 p-4">
                <pre className="text-xs font-mono text-[#94A3B8] leading-relaxed">
{`export function Button({ children }) {
  return (
    <button className="px-4 py-2">
      {children}
    </button>
  );
}`}
                </pre>
              </div>
            </div>
          </GlassResizablePanel>
          <GlassResizeHandle orientation="vertical" variant="subtle" />

          {/* Terminal */}
          <GlassResizablePanel defaultSize={30} minSize={15} collapsible collapsedSize={0} glass>
            <div className="h-full p-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] mb-2">
                Terminal
              </p>
              <pre className="text-xs font-mono text-[#94A3B8] leading-relaxed">
{`$ bun run build
✓ Compiled successfully
$ _`}
              </pre>
            </div>
          </GlassResizablePanel>
        </GlassResizableGroup>
      </GlassResizablePanel>
    </GlassResizableGroup>
  ),
};

export const PersistentLayout: Story = {
  render: () => (
    <div className="space-y-2">
      <p className="text-xs text-[#64748B]">
        Layout is saved to localStorage with key &quot;glass-resizable-demo&quot;.
        Resize panels and refresh to see persistence.
      </p>
      <GlassResizableGroup
        direction="horizontal"
        autoSaveId="glass-resizable-demo"
        className="h-[400px] rounded-lg border border-border/20"
      >
        <GlassResizablePanel defaultSize={30} minSize={15} glass>
          <PanelContent label="Sidebar" description="Persistent size" />
        </GlassResizablePanel>
        <GlassResizeHandle orientation="horizontal" />
        <GlassResizablePanel defaultSize={40} minSize={20}>
          <PanelContent label="Main" description="Persistent size" />
        </GlassResizablePanel>
        <GlassResizeHandle orientation="horizontal" />
        <GlassResizablePanel defaultSize={30} minSize={15} glass>
          <PanelContent label="Inspector" description="Persistent size" />
        </GlassResizablePanel>
      </GlassResizableGroup>
    </div>
  ),
};

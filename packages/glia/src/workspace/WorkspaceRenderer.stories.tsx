import type { Meta, StoryObj } from "@storybook/react";
import { WorkspaceRenderer, registerComponent } from "./WorkspaceRenderer";
import type { WorkspaceSpec } from "./types";
import * as React from "react";

// Register some mock components for the stories
registerComponent("Header", ({ title, subtitle }: { title?: string; subtitle?: string }) => (
  <div className="p-4 border-b border-border/30">
    <h1 className="text-lg font-bold text-foreground">{title || "Header"}</h1>
    {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
  </div>
));

registerComponent("Sidebar", ({ items = [] }: { items?: string[] }) => (
  <div className="p-4 space-y-2 h-full bg-muted/10">
    <h2 className="text-sm font-medium text-muted-foreground mb-4">Navigation</h2>
    {(items.length > 0 ? items : ["Dashboard", "Projects", "Settings"]).map((item, i) => (
      <div
        key={i}
        className="px-3 py-2 rounded-lg text-sm text-foreground hover:bg-cyan-neon/10 cursor-pointer transition-colors"
      >
        {item}
      </div>
    ))}
  </div>
));

registerComponent("MainContent", ({ message }: { message?: string }) => (
  <div className="p-6 h-full flex items-center justify-center">
    <div className="text-center">
      <div className="text-6xl mb-4">📊</div>
      <p className="text-muted-foreground">{message || "Main content area"}</p>
    </div>
  </div>
));

registerComponent("Card", ({ title, value, trend }: { title?: string; value?: string; trend?: string }) => (
  <div className="p-4 rounded-xl bg-card/50 border border-border/30">
    <div className="text-sm text-muted-foreground">{title || "Metric"}</div>
    <div className="text-2xl font-bold text-foreground mt-1">{value || "0"}</div>
    {trend && (
      <div className={`text-xs mt-2 ${trend.startsWith("+") ? "text-emerald-neon" : "text-magenta-neon"}`}>
        {trend}
      </div>
    )}
  </div>
));

registerComponent("Footer", ({ text }: { text?: string }) => (
  <div className="p-3 text-center text-xs text-muted-foreground border-t border-border/30">
    {text || "© 2024 bb-ui"}
  </div>
));

registerComponent("Panel", ({ label }: { label?: string }) => (
  <div className="p-4 h-full bg-card/30 rounded-lg border border-border/20">
    <div className="text-sm font-medium text-foreground">{label || "Panel"}</div>
  </div>
));

const meta: Meta<typeof WorkspaceRenderer> = {
  title: "Workspace/WorkspaceRenderer",
  component: WorkspaceRenderer,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof WorkspaceRenderer>;

// Split Layout Example
const splitLayoutSpec: WorkspaceSpec = {
  id: "split-demo",
  name: "Split Layout Demo",
  description: "Demonstrates horizontal split layout with sidebar and main content",
  layout: {
    type: "split",
    direction: "horizontal",
    sizes: [240, "fill"],
    children: [
      {
        type: "panel",
        component: "Sidebar",
        props: { items: ["Home", "Analytics", "Reports", "Settings"] },
      },
      {
        type: "panel",
        component: "MainContent",
        props: { message: "This is the main content area" },
      },
    ],
  },
  theme: {
    background: "#0a0f15",
    foreground: "#e5e7eb",
    accent: "#22d3ee",
  },
};

export const SplitLayout: Story = {
  args: {
    spec: splitLayoutSpec,
  },
  decorators: [
    (Story) => (
      <div className="w-full h-screen">
        <Story />
      </div>
    ),
  ],
};

// Stack Layout Example
const stackLayoutSpec: WorkspaceSpec = {
  id: "stack-demo",
  name: "Stack Layout Demo",
  description: "Demonstrates vertical stack layout",
  layout: {
    type: "stack",
    direction: "vertical",
    gap: 0,
    children: [
      {
        type: "panel",
        component: "Header",
        props: { title: "Dashboard", subtitle: "Welcome back" },
      },
      {
        type: "stack",
        direction: "horizontal",
        gap: 16,
        children: [
          {
            type: "panel",
            component: "Sidebar",
          },
          {
            type: "panel",
            component: "MainContent",
          },
        ],
      },
      {
        type: "panel",
        component: "Footer",
      },
    ],
  },
  theme: {
    background: "#050812",
    foreground: "#e5e7eb",
    accent: "#22d3ee",
  },
};

export const StackLayout: Story = {
  args: {
    spec: stackLayoutSpec,
  },
  decorators: [
    (Story) => (
      <div className="w-full h-screen">
        <Story />
      </div>
    ),
  ],
};

// Grid Layout Example
const gridLayoutSpec: WorkspaceSpec = {
  id: "grid-demo",
  name: "Grid Layout Demo",
  description: "Demonstrates CSS grid layout for dashboard cards",
  layout: {
    type: "stack",
    direction: "vertical",
    gap: 0,
    children: [
      {
        type: "panel",
        component: "Header",
        props: { title: "Analytics Dashboard" },
      },
      {
        type: "grid",
        columns: 4,
        gap: 16,
        children: [
          {
            id: "card-1",
            content: {
              type: "panel",
              component: "Card",
              props: { title: "Total Users", value: "12,345", trend: "+12.5%" },
            },
          },
          {
            id: "card-2",
            content: {
              type: "panel",
              component: "Card",
              props: { title: "Active Sessions", value: "1,234", trend: "+5.2%" },
            },
          },
          {
            id: "card-3",
            content: {
              type: "panel",
              component: "Card",
              props: { title: "Revenue", value: "$45,678", trend: "+8.3%" },
            },
          },
          {
            id: "card-4",
            content: {
              type: "panel",
              component: "Card",
              props: { title: "Conversion", value: "3.2%", trend: "-0.5%" },
            },
          },
          {
            id: "main",
            colSpan: 4,
            content: {
              type: "panel",
              component: "MainContent",
              props: { message: "Charts and detailed analytics would go here" },
            },
          },
        ],
      },
    ],
  },
  theme: {
    background: "#02040a",
    foreground: "#e5e7eb",
    accent: "#22d3ee",
    spacing: 16,
  },
};

export const GridLayout: Story = {
  args: {
    spec: gridLayoutSpec,
  },
  decorators: [
    (Story) => (
      <div className="w-full h-screen p-4">
        <Story />
      </div>
    ),
  ],
};

// Tabs Layout Example
const tabsLayoutSpec: WorkspaceSpec = {
  id: "tabs-demo",
  name: "Tabs Layout Demo",
  description: "Demonstrates tabbed content switching",
  layout: {
    type: "stack",
    direction: "vertical",
    gap: 0,
    children: [
      {
        type: "panel",
        component: "Header",
        props: { title: "Project Settings" },
      },
      {
        type: "tabs",
        orientation: "horizontal",
        defaultTab: "general",
        children: [
          {
            id: "general",
            label: "General",
            content: {
              type: "panel",
              component: "Panel",
              props: { label: "General Settings" },
            },
          },
          {
            id: "security",
            label: "Security",
            content: {
              type: "panel",
              component: "Panel",
              props: { label: "Security Settings" },
            },
          },
          {
            id: "integrations",
            label: "Integrations",
            content: {
              type: "panel",
              component: "Panel",
              props: { label: "Integration Settings" },
            },
          },
          {
            id: "advanced",
            label: "Advanced",
            disabled: true,
            content: {
              type: "panel",
              component: "Panel",
              props: { label: "Advanced Settings" },
            },
          },
        ],
      },
    ],
  },
  theme: {
    background: "#0a0f15",
    foreground: "#e5e7eb",
    accent: "#22d3ee",
  },
};

export const TabsLayout: Story = {
  args: {
    spec: tabsLayoutSpec,
  },
  decorators: [
    (Story) => (
      <div className="w-full h-screen">
        <Story />
      </div>
    ),
  ],
};

// Nested Layout Example
const nestedLayoutSpec: WorkspaceSpec = {
  id: "nested-demo",
  name: "Nested Layout Demo",
  description: "Complex nested layout combining multiple layout types",
  layout: {
    type: "split",
    direction: "vertical",
    sizes: [48, "fill", 32],
    children: [
      {
        type: "panel",
        component: "Header",
        props: { title: "Workspace Demo", subtitle: "Complex nested layouts" },
      },
      {
        type: "split",
        direction: "horizontal",
        sizes: [200, "fill", 300],
        children: [
          {
            type: "panel",
            component: "Sidebar",
            props: { items: ["Overview", "Tasks", "Calendar", "Files"] },
          },
          {
            type: "stack",
            direction: "vertical",
            gap: 16,
            children: [
              {
                type: "grid",
                columns: 3,
                gap: 12,
                children: [
                  {
                    content: {
                      type: "panel",
                      component: "Card",
                      props: { title: "Tasks", value: "24", trend: "+3" },
                    },
                  },
                  {
                    content: {
                      type: "panel",
                      component: "Card",
                      props: { title: "In Progress", value: "8" },
                    },
                  },
                  {
                    content: {
                      type: "panel",
                      component: "Card",
                      props: { title: "Completed", value: "16", trend: "+5" },
                    },
                  },
                ],
              },
              {
                type: "panel",
                component: "MainContent",
                props: { message: "Task list and details" },
              },
            ],
          },
          {
            type: "tabs",
            orientation: "vertical",
            defaultTab: "details",
            children: [
              {
                id: "details",
                label: "Details",
                content: {
                  type: "panel",
                  component: "Panel",
                  props: { label: "Item Details" },
                },
              },
              {
                id: "activity",
                label: "Activity",
                content: {
                  type: "panel",
                  component: "Panel",
                  props: { label: "Activity Log" },
                },
              },
              {
                id: "comments",
                label: "Comments",
                content: {
                  type: "panel",
                  component: "Panel",
                  props: { label: "Comments" },
                },
              },
            ],
          },
        ],
      },
      {
        type: "panel",
        component: "Footer",
        props: { text: "bb-ui Workspace Renderer Demo" },
      },
    ],
  },
  theme: {
    background: "#02040a",
    foreground: "#e5e7eb",
    accent: "#22d3ee",
    muted: "#1a1a2e",
    borderColor: "rgba(34, 211, 238, 0.15)",
  },
};

export const NestedLayout: Story = {
  args: {
    spec: nestedLayoutSpec,
  },
  decorators: [
    (Story) => (
      <div className="w-full h-screen">
        <Story />
      </div>
    ),
  ],
};

// Slot Example
const slotLayoutSpec: WorkspaceSpec = {
  id: "slot-demo",
  name: "Slot Demo",
  description: "Demonstrates slot placeholders for dynamic content",
  layout: {
    type: "stack",
    direction: "vertical",
    gap: 16,
    children: [
      {
        type: "panel",
        component: "Header",
        props: { title: "Slot Demo" },
      },
      {
        type: "split",
        direction: "horizontal",
        sizes: ["fill", "fill"],
        children: [
          {
            type: "slot",
            name: "left",
            fallback: {
              type: "panel",
              component: "Panel",
              props: { label: "Left slot (fallback)" },
            },
          },
          {
            type: "slot",
            name: "right",
            fallback: {
              type: "panel",
              component: "Panel",
              props: { label: "Right slot (fallback)" },
            },
          },
        ],
      },
      {
        type: "slot",
        name: "footer",
      },
    ],
  },
  theme: {
    background: "#0a0f15",
    foreground: "#e5e7eb",
  },
};

export const WithSlots: Story = {
  args: {
    spec: slotLayoutSpec,
    slots: {
      left: <div className="p-6 h-full bg-cyan-neon/10 rounded-lg">Custom left content</div>,
      right: <div className="p-6 h-full bg-magenta-neon/10 rounded-lg">Custom right content</div>,
      footer: <div className="p-4 text-center text-sm text-muted-foreground border-t border-border/30">Custom footer slot</div>,
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full h-screen p-4">
        <Story />
      </div>
    ),
  ],
};

// Placeholder Example (unregistered components)
const placeholderSpec: WorkspaceSpec = {
  id: "placeholder-demo",
  name: "Placeholder Demo",
  description: "Shows placeholder UI for unregistered components",
  layout: {
    type: "grid",
    columns: 2,
    gap: 16,
    children: [
      {
        content: {
          type: "panel",
          component: "UnregisteredChart",
          props: { type: "line", data: [1, 2, 3, 4, 5] },
        },
      },
      {
        content: {
          type: "panel",
          component: "UnregisteredTable",
          props: { columns: ["Name", "Value"], rows: 10 },
        },
      },
      {
        content: {
          type: "panel",
          component: "Card",
          props: { title: "Registered", value: "Works!" },
        },
      },
      {
        content: {
          type: "panel",
          component: "UnregisteredWidget",
        },
      },
    ],
  },
  theme: {
    background: "#0a0f15",
    foreground: "#e5e7eb",
  },
};

export const UnregisteredComponents: Story = {
  args: {
    spec: placeholderSpec,
  },
  decorators: [
    (Story) => (
      <div className="w-full h-96 p-4">
        <Story />
      </div>
    ),
  ],
};

// Custom Theme Example
const themedSpec: WorkspaceSpec = {
  id: "themed-demo",
  name: "Custom Theme Demo",
  layout: {
    type: "grid",
    columns: 2,
    gap: 16,
    children: [
      {
        content: {
          type: "panel",
          component: "Card",
          props: { title: "Gold Accent", value: "$1,234" },
        },
      },
      {
        content: {
          type: "panel",
          component: "Card",
          props: { title: "Custom Theme", value: "Active" },
        },
      },
    ],
  },
  theme: {
    background: "#0d1318",
    foreground: "#f0ede8",
    accent: "#f5a623",
    muted: "#1a2420",
    borderColor: "rgba(245, 166, 35, 0.2)",
    glowColor: "rgba(245, 166, 35, 0.4)",
    borderRadius: 16,
    spacing: 24,
  },
};

export const CustomTheme: Story = {
  args: {
    spec: themedSpec,
  },
  decorators: [
    (Story) => (
      <div className="w-full h-64 p-4">
        <Story />
      </div>
    ),
  ],
};

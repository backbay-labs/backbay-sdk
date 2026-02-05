/**
 * Layout Primitive Manifests
 * Core layout building blocks for workspace composition
 */

import type { ComponentManifest } from "../types";

export const splitPanelManifest: ComponentManifest = {
  id: "split-panel",
  name: "SplitPanel",
  version: "1.0.0",
  category: "layouts",

  purpose: ["container", "grid-layout"],
  description:
    "Resizable split panel layout. Divides space into two resizable sections.",
  bestFor: [
    "IDE-style layouts",
    "Editor + preview layouts",
    "Sidebar + content layouts",
    "Comparison views",
  ],
  avoid: [
    "Mobile layouts (not resizable)",
    "Simple content (overkill)",
    "More than 2 sections (nest instead)",
  ],

  props: {
    direction: {
      type: "enum",
      description: "Split direction",
      enum: ["horizontal", "vertical"],
      default: "horizontal",
    },
    defaultSize: {
      type: "number",
      description: "Default first panel size (percentage)",
      default: 50,
    },
    minSize: {
      type: "number",
      description: "Minimum panel size (percentage)",
      default: 10,
    },
    maxSize: {
      type: "number",
      description: "Maximum panel size (percentage)",
      default: 90,
    },
    onResize: {
      type: "function",
      description: "Resize callback with new size",
    },
    children: {
      type: "array",
      description: "Exactly 2 children for each panel",
      required: true,
    },
  },

  slots: [
    {
      name: "first",
      description: "First panel content",
      accepts: ["*"],
      required: true,
    },
    {
      name: "second",
      description: "Second panel content",
      accepts: ["*"],
      required: true,
    },
  ],
  validParents: ["workspace-root", "split-panel"],
  validChildren: ["*"],

  styles: ["minimal"],
  supportsTheme: true,
  cssVariables: ["--split-handle-color", "--split-handle-width"],

  interactions: ["drag", "resize"],
  a11y: ["keyboard-nav"],

  examples: [
    {
      name: "Sidebar Layout",
      description: "Sidebar + main content",
      props: { direction: "horizontal", defaultSize: 25 },
      context: "Dashboard layouts, file explorers",
    },
    {
      name: "Editor Preview",
      description: "Code editor + live preview",
      props: { direction: "horizontal", defaultSize: 50 },
      context: "Code playgrounds, markdown editors",
    },
  ],

  source: "components/layouts/SplitPanel.tsx",
  storybook: "layouts-splitpanel",
  tags: ["layout", "split", "resize", "panel", "container"],
};

export const tabsPanelManifest: ComponentManifest = {
  id: "tabs-panel",
  name: "TabsPanel",
  version: "1.0.0",
  category: "layouts",

  purpose: ["navigation", "container"],
  description:
    "Tabbed content panel. Switches between multiple content areas with tab navigation.",
  bestFor: [
    "Settings pages",
    "Multi-section content",
    "Code/preview toggles",
    "Category navigation",
  ],
  avoid: [
    "Many tabs (>6 becomes unwieldy)",
    "Deep navigation (use routing)",
    "Frequent switching content",
  ],

  props: {
    tabs: {
      type: "array",
      description: "Tab definitions",
      required: true,
      items: {
        type: "object",
        description: "Tab definition",
        properties: {
          id: { type: "string", description: "Tab ID", required: true },
          label: { type: "string", description: "Tab label", required: true },
          icon: { type: "ReactNode", description: "Tab icon" },
          disabled: { type: "boolean", description: "Disable tab" },
        },
      },
    },
    activeTab: {
      type: "string",
      description: "Controlled active tab ID",
    },
    defaultTab: {
      type: "string",
      description: "Default active tab ID",
    },
    onTabChange: {
      type: "function",
      description: "Tab change handler",
    },
    children: {
      type: "ReactNode",
      description: "Tab content (keyed by tab ID)",
      required: true,
    },
    orientation: {
      type: "enum",
      description: "Tab orientation",
      enum: ["horizontal", "vertical"],
      default: "horizontal",
    },
  },

  slots: [],
  validParents: ["split-panel", "workspace-root"],
  validChildren: ["*"],

  styles: ["minimal", "glassmorphism"],
  supportsTheme: true,
  cssVariables: ["--tab-active-color", "--tab-hover-color"],

  interactions: ["click", "keyboard"],
  a11y: ["keyboard-nav", "aria-labels", "focus-visible"],

  examples: [
    {
      name: "Settings Tabs",
      description: "Settings page with tabs",
      props: {
        tabs: [
          { id: "general", label: "General" },
          { id: "account", label: "Account" },
          { id: "appearance", label: "Appearance" },
        ],
        defaultTab: "general",
      },
      context: "Settings pages, preferences",
    },
  ],

  source: "components/layouts/TabsPanel.tsx",
  storybook: "layouts-tabspanel",
  tags: ["tabs", "navigation", "panel", "container", "switch"],
};

export const stackLayoutManifest: ComponentManifest = {
  id: "stack-layout",
  name: "StackLayout",
  version: "1.0.0",
  category: "layouts",

  purpose: ["container", "grid-layout"],
  description:
    "Flexible stack layout (horizontal or vertical). CSS flexbox abstraction.",
  bestFor: [
    "Button groups",
    "Form layouts",
    "Card lists",
    "Toolbar layouts",
  ],
  avoid: [
    "Complex grid layouts (use BentoGrid)",
    "Overlapping content",
  ],

  props: {
    direction: {
      type: "enum",
      description: "Stack direction",
      enum: ["row", "column"],
      default: "column",
    },
    gap: {
      type: "number",
      description: "Gap between items (px)",
      default: 8,
    },
    align: {
      type: "enum",
      description: "Cross-axis alignment",
      enum: ["start", "center", "end", "stretch"],
      default: "stretch",
    },
    justify: {
      type: "enum",
      description: "Main-axis alignment",
      enum: ["start", "center", "end", "between", "around"],
      default: "start",
    },
    wrap: {
      type: "boolean",
      description: "Allow wrapping",
      default: false,
    },
    children: {
      type: "ReactNode",
      description: "Stack items",
      required: true,
    },
  },

  slots: [
    {
      name: "default",
      description: "Stack items",
      accepts: ["*"],
      required: true,
      multiple: true,
    },
  ],
  validParents: ["*"],
  validChildren: ["*"],

  styles: ["minimal"],
  supportsTheme: true,

  interactions: [],
  a11y: [],

  examples: [
    {
      name: "Button Group",
      description: "Horizontal button group",
      props: { direction: "row", gap: 8, align: "center" },
      context: "Action bars, toolbars",
    },
    {
      name: "Form Layout",
      description: "Vertical form fields",
      props: { direction: "column", gap: 16 },
      context: "Form layouts, settings",
    },
  ],

  source: "components/layouts/StackLayout.tsx",
  storybook: "layouts-stacklayout",
  tags: ["layout", "stack", "flex", "row", "column"],
};

export const layoutManifests: ComponentManifest[] = [
  splitPanelManifest,
  tabsPanelManifest,
  stackLayoutManifest,
];

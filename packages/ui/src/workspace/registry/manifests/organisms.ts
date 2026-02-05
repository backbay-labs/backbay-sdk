/**
 * Organism Component Manifests
 * Complex, composite components
 */

import type { ComponentManifest } from "../types";

export const commandPaletteManifest: ComponentManifest = {
  id: "command-palette",
  name: "CommandPalette",
  version: "1.0.0",
  category: "organisms",

  purpose: ["navigation", "selection"],
  description:
    "Keyboard-driven command palette (cmd+k style) for quick actions and navigation. Built on cmdk.",
  bestFor: [
    "Application command menus",
    "Quick navigation",
    "Action shortcuts",
    "Search interfaces",
  ],
  avoid: [
    "Mobile-only interfaces (keyboard required)",
    "Simple dropdowns (overkill)",
    "Contexts without keyboard users",
  ],

  props: {
    open: {
      type: "boolean",
      description: "Controlled open state",
      required: true,
    },
    onOpenChange: {
      type: "function",
      description: "Open state change handler",
      required: true,
    },
    commands: {
      type: "array",
      description: "List of available commands",
      required: true,
      items: {
        type: "object",
        description: "Command definition",
        properties: {
          id: { type: "string", description: "Unique command ID", required: true },
          label: { type: "string", description: "Display label", required: true },
          icon: { type: "ReactNode", description: "Command icon" },
          shortcut: { type: "string", description: "Keyboard shortcut hint" },
          group: { type: "string", description: "Command group name" },
          onSelect: { type: "function", description: "Selection handler" },
        },
      },
    },
    placeholder: {
      type: "string",
      description: "Search input placeholder",
      default: "Type a command or search...",
    },
    emptyMessage: {
      type: "string",
      description: "Message when no results",
      default: "No results found.",
    },
  },

  slots: [],
  validParents: [],
  validChildren: [],

  styles: ["glassmorphism", "minimal"],
  supportsTheme: true,
  cssVariables: ["--command-bg", "--command-border"],

  interactions: ["keyboard", "click", "focus"],
  a11y: ["keyboard-nav", "aria-labels", "focus-visible", "screen-reader"],

  examples: [
    {
      name: "App Commands",
      description: "Application command palette",
      props: {
        placeholder: "Search commands...",
        commands: [
          { id: "new", label: "New File", shortcut: "Cmd+N", group: "File" },
          { id: "save", label: "Save", shortcut: "Cmd+S", group: "File" },
          { id: "settings", label: "Settings", shortcut: "Cmd+,", group: "App" },
        ],
      },
      context: "Desktop applications, power-user interfaces",
    },
  ],

  source: "components/organisms/CommandPalette/CommandPalette.tsx",
  storybook: "organisms-commandpalette",
  tags: ["command", "palette", "search", "keyboard", "navigation", "cmdk"],
};

export const glassPanelManifest: ComponentManifest = {
  id: "glass-panel",
  name: "GlassPanel",
  version: "1.0.0",
  category: "organisms",

  purpose: ["container", "overlay"],
  description:
    "Glassmorphism container with backdrop blur, borders, and optional glow effects.",
  bestFor: [
    "Card containers",
    "Modal overlays",
    "Sidebar panels",
    "Floating UI elements",
  ],
  avoid: [
    "Dense content areas (blur is heavy)",
    "Low-end device targets",
    "Text-heavy content (readability)",
  ],

  props: {
    children: {
      type: "ReactNode",
      description: "Panel content",
      required: true,
    },
    variant: {
      type: "enum",
      description: "Glass intensity",
      enum: ["light", "medium", "heavy"],
      default: "medium",
    },
    blur: {
      type: "number",
      description: "Backdrop blur amount (px)",
      default: 12,
    },
    border: {
      type: "boolean",
      description: "Show border",
      default: true,
    },
    glow: {
      type: "boolean",
      description: "Enable glow effect",
      default: false,
    },
    glowColor: {
      type: "string",
      description: "Glow color",
    },
    padding: {
      type: "enum",
      description: "Internal padding",
      enum: ["none", "sm", "md", "lg"],
      default: "md",
    },
    rounded: {
      type: "enum",
      description: "Border radius",
      enum: ["none", "sm", "md", "lg", "full"],
      default: "md",
    },
  },

  slots: [
    {
      name: "default",
      description: "Panel content",
      accepts: ["*"],
      required: true,
      multiple: true,
    },
  ],
  validParents: ["bento-grid"],
  validChildren: ["*"],

  styles: ["glassmorphism", "minimal"],
  supportsTheme: true,
  cssVariables: ["--glass-bg", "--glass-border", "--glass-blur"],

  interactions: [],
  a11y: ["high-contrast"],

  examples: [
    {
      name: "Card Container",
      description: "Standard glass card",
      props: { variant: "medium", padding: "lg", rounded: "lg" },
      context: "Card layouts, content containers",
    },
    {
      name: "Glowing Panel",
      description: "Panel with glow effect",
      props: { glow: true, glowColor: "#00ff88", border: true },
      context: "Feature highlights, CTAs",
    },
  ],

  source: "components/organisms/Glass/GlassPanel.tsx",
  storybook: "organisms-glasspanel",
  tags: ["glass", "panel", "container", "blur", "glassmorphism"],
};

export const bentoGridManifest: ComponentManifest = {
  id: "bento-grid",
  name: "BentoGrid",
  version: "1.0.0",
  category: "organisms",

  purpose: ["grid-layout", "container"],
  description:
    "Responsive bento-style grid layout. Auto-places children in an asymmetric, visually interesting grid.",
  bestFor: [
    "Feature grids",
    "Dashboard layouts",
    "Portfolio displays",
    "Landing page sections",
  ],
  avoid: [
    "Simple linear content",
    "Dense data tables",
    "Uniform content sizes",
  ],

  props: {
    children: {
      type: "ReactNode",
      description: "Grid items",
      required: true,
    },
    columns: {
      type: "number",
      description: "Number of columns",
      default: 4,
    },
    gap: {
      type: "number",
      description: "Gap between items (px)",
      default: 16,
    },
    className: {
      type: "string",
      description: "Additional CSS classes",
    },
  },

  slots: [
    {
      name: "default",
      description: "Grid items",
      accepts: ["glass-panel", "three-d-card", "kpi-stat"],
      required: true,
      multiple: true,
    },
  ],
  validParents: [],
  validChildren: ["glass-panel", "three-d-card", "kpi-stat"],

  styles: ["minimal"],
  supportsTheme: true,
  cssVariables: ["--bento-gap"],

  interactions: ["resize"],
  a11y: [],

  examples: [
    {
      name: "Feature Grid",
      description: "4-column feature showcase",
      props: { columns: 4, gap: 24 },
      context: "Landing pages, feature sections",
      code: `<BentoGrid columns={4}>
  <GlassPanel>Feature 1</GlassPanel>
  <GlassPanel>Feature 2</GlassPanel>
  <GlassPanel>Feature 3</GlassPanel>
</BentoGrid>`,
    },
    {
      name: "Dashboard Grid",
      description: "Dashboard widget layout",
      props: { columns: 3, gap: 16 },
      context: "Dashboards, admin panels",
    },
  ],

  source: "components/organisms/BentoGrid/BentoGrid.tsx",
  storybook: "organisms-bentogrid",
  tags: ["grid", "bento", "layout", "responsive", "dashboard"],
};

export const organismManifests: ComponentManifest[] = [
  commandPaletteManifest,
  glassPanelManifest,
  bentoGridManifest,
];

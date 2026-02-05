/**
 * Molecule Component Manifests
 * Composite components built from atoms
 */

import type { ComponentManifest } from "../types";

export const kpiStatManifest: ComponentManifest = {
  id: "kpi-stat",
  name: "KPIStat",
  version: "1.0.0",
  category: "molecules",

  purpose: ["data-display", "status-indicator"],
  description:
    "Key Performance Indicator display with label, value, trend indicator, and optional sparkline.",
  bestFor: [
    "Dashboard metrics",
    "Analytics displays",
    "Summary statistics",
    "Real-time counters",
  ],
  avoid: [
    "Long text content",
    "Non-numeric data",
    "Dense data tables (too large)",
  ],

  props: {
    label: {
      type: "string",
      description: "Metric label",
      required: true,
    },
    value: {
      type: "string",
      description: "Display value (formatted)",
      required: true,
    },
    trend: {
      type: "enum",
      description: "Trend direction",
      enum: ["up", "down", "neutral"],
    },
    trendValue: {
      type: "string",
      description: "Trend percentage or delta",
    },
    icon: {
      type: "ReactNode",
      description: "Optional icon",
    },
    sparkline: {
      type: "array",
      description: "Data points for mini sparkline chart",
      items: { type: "number", description: "Data point" },
    },
    variant: {
      type: "enum",
      description: "Visual variant",
      enum: ["default", "compact", "large"],
      default: "default",
    },
  },

  slots: [
    {
      name: "icon",
      description: "Icon slot",
      accepts: ["*"],
      required: false,
    },
  ],
  validParents: ["bento-grid", "glass-panel"],
  validChildren: [],

  styles: ["minimal", "glassmorphism"],
  supportsTheme: true,
  cssVariables: ["--kpi-trend-up-color", "--kpi-trend-down-color"],

  interactions: ["hover"],
  a11y: ["aria-labels", "screen-reader"],

  examples: [
    {
      name: "Revenue Metric",
      description: "Revenue with positive trend",
      props: {
        label: "Revenue",
        value: "$42,500",
        trend: "up",
        trendValue: "+12.5%",
      },
      context: "Financial dashboards",
    },
    {
      name: "User Count",
      description: "Active users with sparkline",
      props: {
        label: "Active Users",
        value: "1,234",
        sparkline: [10, 25, 18, 30, 45, 38, 52],
      },
      context: "Analytics dashboards",
    },
  ],

  source: "components/molecules/KPIStat/KPIStat.tsx",
  storybook: "molecules-kpistat",
  tags: ["kpi", "stat", "metric", "dashboard", "analytics", "trend"],
};

export const neonToastManifest: ComponentManifest = {
  id: "neon-toast",
  name: "NeonToast",
  version: "1.0.0",
  category: "molecules",

  purpose: ["notification", "status-indicator"],
  description:
    "Notification toast with neon glow effect. Supports multiple severity levels.",
  bestFor: [
    "Success notifications",
    "Error messages",
    "Warnings",
    "Info alerts",
  ],
  avoid: [
    "Critical errors requiring user action (use modal)",
    "Long-form content",
    "Permanent displays",
  ],

  props: {
    title: {
      type: "string",
      description: "Toast title",
      required: true,
    },
    description: {
      type: "string",
      description: "Toast description/message",
    },
    variant: {
      type: "enum",
      description: "Severity/type variant",
      enum: ["success", "error", "warning", "info"],
      default: "info",
    },
    duration: {
      type: "number",
      description: "Auto-dismiss duration in ms (0 = persistent)",
      default: 5000,
    },
    action: {
      type: "object",
      description: "Optional action button config",
      properties: {
        label: { type: "string", description: "Button label", required: true },
        onClick: { type: "function", description: "Click handler" },
      },
    },
    onDismiss: {
      type: "function",
      description: "Callback when toast is dismissed",
    },
  },

  slots: [],
  validParents: [],
  validChildren: [],

  styles: ["neon", "glassmorphism", "animated"],
  supportsTheme: true,
  cssVariables: [
    "--toast-success-color",
    "--toast-error-color",
    "--toast-warning-color",
    "--toast-info-color",
  ],

  interactions: ["click", "hover"],
  a11y: ["aria-labels", "screen-reader", "focus-visible"],

  examples: [
    {
      name: "Success",
      description: "Operation completed successfully",
      props: {
        title: "Saved",
        description: "Your changes have been saved",
        variant: "success",
      },
      context: "Form submissions, save operations",
    },
    {
      name: "Error with Action",
      description: "Error with retry action",
      props: {
        title: "Upload Failed",
        description: "Network error occurred",
        variant: "error",
        action: { label: "Retry" },
      },
      context: "Network errors, failed operations",
    },
  ],

  source: "components/molecules/NeonToast/NeonToast.tsx",
  storybook: "molecules-neontoast",
  tags: ["toast", "notification", "alert", "neon", "message"],
};

export const threeDCardManifest: ComponentManifest = {
  id: "three-d-card",
  name: "ThreeDCard",
  version: "1.0.0",
  category: "molecules",

  purpose: ["container", "data-display"],
  description:
    "Card with 3D perspective effect on hover. Creates depth and interactivity.",
  bestFor: [
    "Feature showcases",
    "Product cards",
    "Team member cards",
    "Portfolio items",
  ],
  avoid: [
    "Dense grids (too much motion)",
    "Mobile-first designs (requires hover)",
    "Accessibility-critical contexts",
  ],

  props: {
    children: {
      type: "ReactNode",
      description: "Card content",
      required: true,
    },
    className: {
      type: "string",
      description: "Additional CSS classes",
    },
    containerClassName: {
      type: "string",
      description: "Container wrapper classes",
    },
    rotationIntensity: {
      type: "number",
      description: "Max rotation degrees",
      default: 10,
    },
    glareEnabled: {
      type: "boolean",
      description: "Enable glare effect on hover",
      default: true,
    },
    glareMaxOpacity: {
      type: "number",
      description: "Max glare opacity (0-1)",
      default: 0.2,
    },
  },

  slots: [
    {
      name: "default",
      description: "Card content",
      accepts: ["*"],
      required: true,
      multiple: true,
    },
  ],
  validParents: ["bento-grid"],
  validChildren: ["*"],

  styles: ["3d", "animated", "glassmorphism"],
  supportsTheme: true,

  interactions: ["hover"],
  a11y: ["reduced-motion"],

  examples: [
    {
      name: "Feature Card",
      description: "Feature showcase card",
      props: { rotationIntensity: 15, glareEnabled: true },
      context: "Feature sections, product showcases",
      code: `<ThreeDCard>
  <h3>Feature Title</h3>
  <p>Feature description here</p>
</ThreeDCard>`,
    },
  ],

  source: "components/molecules/ThreeDCard/ThreeDCard.tsx",
  storybook: "molecules-threedcard",
  tags: ["card", "3d", "perspective", "hover", "interactive"],
};

export const moleculeManifests: ComponentManifest[] = [
  kpiStatManifest,
  neonToastManifest,
  threeDCardManifest,
];

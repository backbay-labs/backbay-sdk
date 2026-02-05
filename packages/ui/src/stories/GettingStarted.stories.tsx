import type { Meta, StoryObj } from "@storybook/react";

const GettingStartedPage = () => (
  <div
    style={{
      padding: 48,
      maxWidth: 900,
      margin: "0 auto",
      color: "#e5e7eb",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      lineHeight: 1.6,
    }}
  >
    <h1 style={{ fontSize: 34, marginBottom: 8 }}>@backbay/bb-ui</h1>
    <p style={{ marginTop: 0, color: "#9ca3af" }}>
      Agent-native UI primitives and components for React.
    </p>

    <h2 style={{ marginTop: 32, fontSize: 22 }}>Install</h2>
    <pre
      style={{
        background: "#0b1020",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: 16,
        overflowX: "auto",
      }}
    >
      <code>bun add @backbay/bb-ui</code>
    </pre>

    <h2 style={{ marginTop: 32, fontSize: 22 }}>Styles</h2>
    <p style={{ color: "#d1d5db" }}>
      bb-ui ships a prebuilt stylesheet. Import it once at your app entrypoint.
    </p>
    <pre
      style={{
        background: "#0b1020",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: 16,
        overflowX: "auto",
      }}
    >
      <code>{`import "@backbay/bb-ui/styles.css";`}</code>
    </pre>

    <h2 style={{ marginTop: 32, fontSize: 22 }}>Recommended Imports</h2>
    <p style={{ color: "#d1d5db" }}>
      Prefer subpath imports to keep bundles small and APIs discoverable.
    </p>
    <pre
      style={{
        background: "#0b1020",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: 16,
        overflowX: "auto",
      }}
    >
      <code>{`import * as protocol from "@backbay/bb-ui/protocol";
import * as hooks from "@backbay/bb-ui/hooks";
import * as components from "@backbay/bb-ui/components";
import * as primitives from "@backbay/bb-ui/primitives";`}</code>
    </pre>

    <h2 style={{ marginTop: 32, fontSize: 22 }}>Theming</h2>
    <p style={{ color: "#d1d5db" }}>
      Themes are applied via CSS variables. Use bb-ui’s theme registry, or
      provide your own variables.
    </p>
    <pre
      style={{
        background: "#0b1020",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        padding: 16,
        overflowX: "auto",
      }}
    >
      <code>{`import { applyThemeCssVariables, DEFAULT_THEMES } from "@backbay/bb-ui/theme";

applyThemeCssVariables(DEFAULT_THEMES.blueprint);`}</code>
    </pre>
  </div>
);

const meta: Meta<typeof GettingStartedPage> = {
  title: "Introduction/Getting Started",
  component: GettingStartedPage,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <GettingStartedPage />,
};


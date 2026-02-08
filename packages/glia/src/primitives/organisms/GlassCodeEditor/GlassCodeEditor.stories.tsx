import type { Meta, StoryObj } from "@storybook/react";
import { GlassCodeEditor } from "./GlassCodeEditor";

const meta: Meta<typeof GlassCodeEditor> = {
  title: "Primitives/Organisms/GlassCodeEditor",
  component: GlassCodeEditor,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    showLineNumbers: { control: "boolean" },
    showCopy: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 600 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlassCodeEditor>;

const tsSnippet = `import { GlassPanel } from "@backbay/glia";

export function Dashboard() {
  const data = useQuery("metrics");

  return (
    <GlassPanel variant="prominent" elevation="hud">
      <h1>System Status</h1>
      <MetricsGrid data={data} />
    </GlassPanel>
  );
}`;

const jsonSnippet = `{
  "name": "@backbay/glia",
  "version": "0.2.0-alpha.2",
  "type": "module",
  "exports": {
    ".": "./dist/index.js",
    "./theme": "./dist/theme.js",
    "./desktop": "./dist/desktop.js"
  },
  "dependencies": {
    "framer-motion": "^11.0.0",
    "class-variance-authority": "^0.7.0"
  }
}`;

const longSnippet = Array.from(
  { length: 40 },
  (_, i) => `const line${i + 1} = "This is line ${i + 1} of the code";`
).join("\n");

export const Default: Story = {
  args: {
    code: tsSnippet,
    language: "TypeScript",
    filename: "Dashboard.tsx",
  },
};

export const JSON: Story = {
  args: {
    code: jsonSnippet,
    language: "JSON",
    filename: "package.json",
  },
};

export const WithFilename: Story = {
  args: {
    code: tsSnippet,
    filename: "src/components/Dashboard.tsx",
  },
};

export const Long: Story = {
  args: {
    code: longSnippet,
    language: "TypeScript",
    filename: "generated.ts",
    maxHeight: 300,
  },
};

export const NoCopy: Story = {
  args: {
    code: tsSnippet,
    language: "TypeScript",
    showCopy: false,
  },
};

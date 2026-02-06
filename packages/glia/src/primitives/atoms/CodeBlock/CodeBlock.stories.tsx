import type { Meta, StoryObj } from "@storybook/react";
import { CodeBlock } from "./CodeBlock";
import { UiThemeProvider } from "../../../theme";

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <UiThemeProvider>
    <div style={{ background: "#02040a", padding: 40, maxWidth: 700 }}>
      {children}
    </div>
  </UiThemeProvider>
);

const meta: Meta<typeof CodeBlock> = {
  title: "Atoms/CodeBlock",
  component: CodeBlock,
  parameters: {
    layout: "padded",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  decorators: [(Story) => <Wrapper><Story /></Wrapper>],
  argTypes: {
    showLineNumbers: { control: "boolean" },
    showCopyButton: { control: "boolean" },
    wordWrap: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

// ============================================================================
// CODE SAMPLES
// ============================================================================

const tsCode = `import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}`;

const pythonCode = `import asyncio
from dataclasses import dataclass

@dataclass
class Task:
    name: str
    priority: int = 0

async def process_tasks(tasks: list[Task]) -> None:
    for task in sorted(tasks, key=lambda t: t.priority):
        print(f"Processing: {task.name}")
        await asyncio.sleep(0.1)

if __name__ == "__main__":
    tasks = [Task("build", 2), Task("test", 1), Task("deploy", 3)]
    asyncio.run(process_tasks(tasks))`;

const jsonCode = `{
  "name": "@backbay/glia",
  "version": "0.2.0-alpha.2",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./theme": "./src/theme/index.ts"
  },
  "dependencies": {
    "react": "^18.0.0",
    "class-variance-authority": "^0.7.0"
  }
}`;

const longCode = Array.from(
  { length: 40 },
  (_, i) => `const value${i + 1} = compute(${i + 1}); // step ${i + 1} of the pipeline`
).join("\n");

const longLineCode = `// This is a very long line that demonstrates horizontal scrolling behavior when wordWrap is disabled. It contains a function call with many arguments: createComponent({ name: "CodeBlock", variant: "glass", theme: "nebula", showLineNumbers: true, showCopyButton: true, language: "typescript" });
const short = true;
// Another extremely long comment line that goes on and on and on to show how the component handles overflow in both scrolling and wrapping modes when configured appropriately.`;

// ============================================================================
// STORIES
// ============================================================================

export const Default: Story = {
  args: {
    code: tsCode,
    language: "typescript",
  },
};

export const WithTitle: Story = {
  args: {
    code: tsCode,
    language: "typescript",
    title: "example.ts",
  },
};

export const WithLineNumbers: Story = {
  args: {
    code: tsCode,
    language: "typescript",
    title: "Counter.tsx",
    showLineNumbers: true,
  },
};

export const HighlightedLines: Story = {
  args: {
    code: tsCode,
    language: "typescript",
    title: "Counter.tsx",
    showLineNumbers: true,
    highlightLines: [3, 4, 5],
  },
};

export const Python: Story = {
  args: {
    code: pythonCode,
    language: "python",
    title: "main.py",
    showLineNumbers: true,
  },
};

export const JSON: Story = {
  args: {
    code: jsonCode,
    language: "json",
    title: "package.json",
  },
};

export const LongCode: Story = {
  args: {
    code: longCode,
    language: "typescript",
    title: "pipeline.ts",
    showLineNumbers: true,
    maxHeight: 300,
  },
};

export const WordWrap: Story = {
  args: {
    code: longLineCode,
    language: "typescript",
    title: "long-lines.ts",
    wordWrap: true,
  },
};

export const Languages: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <CodeBlock code={tsCode} language="typescript" title="app.tsx" />
      <CodeBlock code={pythonCode} language="python" title="main.py" />
      <CodeBlock code={jsonCode} language="json" title="config.json" />
    </div>
  ),
};

export const NoCopyButton: Story = {
  args: {
    code: tsCode,
    language: "typescript",
    showCopyButton: false,
  },
};

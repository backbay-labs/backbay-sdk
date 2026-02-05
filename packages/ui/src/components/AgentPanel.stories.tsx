import type { Meta, StoryObj } from "@storybook/react";
import { AgentPanel, type QuickPrompt } from "./AgentPanel";
import { BBProvider } from "./BBProvider";
import type { Agent, BBConfig } from "../protocol/types";
import { Sparkles, Zap, FileText, Bug, RefreshCw } from "lucide-react";

// Sample config
const sampleConfig: BBConfig = {
  apiBaseUrl: "https://api.example.com",
  syncDebounce: 1000,
  costTracking: true,
};

// Sample agents
const sampleAgents: Agent[] = [
  {
    id: "claude-opus",
    name: "Claude Opus",
    description: "Advanced reasoning and analysis",
    costPerRun: 0.015,
    reproducibility: "partial",
  },
  {
    id: "claude-sonnet",
    name: "Claude Sonnet",
    description: "Fast and efficient for common tasks",
    costPerRun: 0.003,
    reproducibility: "partial",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "OpenAI's multimodal model",
    costPerRun: 0.01,
    reproducibility: "non-deterministic",
  },
  {
    id: "codex",
    name: "Codex",
    description: "Specialized for code generation",
    costPerRun: 0.008,
    reproducibility: "exact",
  },
];

// Quick prompts
const sampleQuickPrompts: QuickPrompt[] = [
  {
    label: "Summarize",
    prompt: "Please summarize the current content",
    icon: <FileText className="w-3 h-3" />,
  },
  {
    label: "Debug",
    prompt: "Help me debug this issue",
    icon: <Bug className="w-3 h-3" />,
  },
  {
    label: "Improve",
    prompt: "Suggest improvements for this code",
    icon: <Sparkles className="w-3 h-3" />,
  },
  {
    label: "Quick Fix",
    prompt: "Apply a quick fix for the most obvious issue",
    icon: <Zap className="w-3 h-3" />,
  },
];

const meta: Meta<typeof AgentPanel> = {
  title: "Components/AgentPanel",
  component: AgentPanel,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <BBProvider config={sampleConfig} agents={sampleAgents}>
        <div className="w-[400px]">
          <Story />
        </div>
      </BBProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AgentPanel>;

// Basic CSS for the panel (since it uses BEM classes)
const panelStyles = `
  .bb-agent-panel {
    background: hsl(220 18% 5% / 0.8);
    border: 1px solid hsl(187 30% 15% / 0.5);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .bb-agent-panel__agents {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .bb-agent-panel__agent {
    padding: 8px 12px;
    border-radius: 8px;
    background: hsl(220 14% 12%);
    border: 1px solid hsl(187 30% 15% / 0.3);
    color: hsl(220 14% 90%);
    font-size: 13px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    transition: all 0.2s;
  }
  .bb-agent-panel__agent:hover:not(:disabled) {
    border-color: hsl(187 94% 53% / 0.5);
    background: hsl(187 94% 53% / 0.1);
  }
  .bb-agent-panel__agent--selected {
    border-color: hsl(187 94% 53%);
    background: hsl(187 94% 53% / 0.15);
  }
  .bb-agent-panel__agent:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .bb-agent-panel__agent-name {
    font-weight: 500;
  }
  .bb-agent-panel__agent-cost {
    font-size: 11px;
    color: hsl(187 94% 53%);
    font-family: monospace;
  }
  .bb-agent-panel__quick-prompts {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .bb-agent-panel__quick-prompt {
    padding: 6px 10px;
    border-radius: 6px;
    background: hsl(220 14% 15%);
    border: 1px solid hsl(220 14% 20%);
    color: hsl(220 14% 70%);
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s;
  }
  .bb-agent-panel__quick-prompt:hover:not(:disabled) {
    background: hsl(220 14% 20%);
    color: hsl(220 14% 90%);
  }
  .bb-agent-panel__quick-prompt:disabled {
    opacity: 0.5;
  }
  .bb-agent-panel__form {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .bb-agent-panel__input {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    background: hsl(220 14% 8%);
    border: 1px solid hsl(220 14% 15%);
    color: hsl(220 14% 90%);
    font-size: 14px;
    resize: vertical;
    min-height: 80px;
  }
  .bb-agent-panel__input:focus {
    outline: none;
    border-color: hsl(187 94% 53% / 0.5);
  }
  .bb-agent-panel__input::placeholder {
    color: hsl(220 14% 40%);
  }
  .bb-agent-panel__form-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .bb-agent-panel__estimate {
    font-size: 12px;
    color: hsl(220 14% 60%);
    font-family: monospace;
  }
  .bb-agent-panel__submit {
    padding: 8px 16px;
    border-radius: 6px;
    background: hsl(187 94% 53%);
    color: hsl(220 20% 3%);
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s;
  }
  .bb-agent-panel__submit:hover:not(:disabled) {
    background: hsl(187 94% 45%);
  }
  .bb-agent-panel__submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .bb-agent-panel__status {
    padding: 12px;
    border-radius: 8px;
    font-size: 13px;
  }
  .bb-agent-panel__status--running {
    background: hsl(48 96% 47% / 0.1);
    border: 1px solid hsl(48 96% 47% / 0.3);
    color: hsl(48 96% 47%);
  }
  .bb-agent-panel__status--completed {
    background: hsl(161 94% 40% / 0.1);
    border: 1px solid hsl(161 94% 40% / 0.3);
    color: hsl(161 94% 40%);
  }
  .bb-agent-panel__status--failed {
    background: hsl(350 89% 60% / 0.1);
    border: 1px solid hsl(350 89% 60% / 0.3);
    color: hsl(350 89% 60%);
  }
  .bb-agent-panel__output {
    margin-top: 8px;
    padding: 8px;
    background: hsl(220 14% 5%);
    border-radius: 4px;
    font-size: 12px;
    color: hsl(220 14% 80%);
  }
  .bb-agent-panel__error {
    margin-top: 8px;
    font-size: 12px;
  }
  .bb-agent-panel__history {
    border-top: 1px solid hsl(220 14% 15%);
    padding-top: 12px;
  }
  .bb-agent-panel__history-title {
    font-size: 12px;
    font-weight: 500;
    color: hsl(220 14% 60%);
    margin-bottom: 8px;
  }
  .bb-agent-panel__history-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .bb-agent-panel__history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    border-radius: 6px;
    font-size: 12px;
  }
  .bb-agent-panel__history-item--completed {
    background: hsl(161 94% 40% / 0.05);
  }
  .bb-agent-panel__history-item--failed {
    background: hsl(350 89% 60% / 0.05);
  }
  .bb-agent-panel__history-agent {
    font-weight: 500;
    color: hsl(220 14% 90%);
  }
  .bb-agent-panel__history-prompt {
    color: hsl(220 14% 60%);
    flex: 1;
    margin-left: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bb-agent-panel__history-cost {
    color: hsl(187 94% 53%);
    font-family: monospace;
  }
  .bb-agent-panel__cost-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid hsl(220 14% 15%);
    font-size: 13px;
  }
  .bb-agent-panel__cost-label {
    color: hsl(220 14% 60%);
  }
  .bb-agent-panel__cost-value {
    font-family: monospace;
    font-weight: 500;
    color: hsl(187 94% 53%);
  }
`;

// Inject styles
const StyleInjector = ({ children }: { children: React.ReactNode }) => (
  <>
    <style>{panelStyles}</style>
    {children}
  </>
);

export const Default: Story = {
  render: (args) => (
    <StyleInjector>
      <AgentPanel {...args} />
    </StyleInjector>
  ),
  args: {
    placeholder: "What would you like to do?",
    showCosts: true,
    showHistory: true,
  },
};

export const WithQuickPrompts: Story = {
  render: (args) => (
    <StyleInjector>
      <AgentPanel {...args} />
    </StyleInjector>
  ),
  args: {
    quickPrompts: sampleQuickPrompts,
    placeholder: "Or type a custom prompt...",
    showCosts: true,
    showHistory: true,
  },
};

export const NoCostTracking: Story = {
  render: (args) => (
    <StyleInjector>
      <AgentPanel {...args} />
    </StyleInjector>
  ),
  args: {
    showCosts: false,
    showHistory: true,
    placeholder: "Enter a prompt...",
  },
};

export const NoHistory: Story = {
  render: (args) => (
    <StyleInjector>
      <AgentPanel {...args} />
    </StyleInjector>
  ),
  args: {
    showCosts: true,
    showHistory: false,
    placeholder: "Enter a prompt...",
  },
};

export const FilteredAgents: Story = {
  render: (args) => (
    <StyleInjector>
      <AgentPanel {...args} />
    </StyleInjector>
  ),
  args: {
    agentFilter: (agent: Agent) => agent.id.startsWith("claude"),
    placeholder: "Only Claude models available",
    showCosts: true,
  },
};

export const DefaultAgent: Story = {
  render: (args) => (
    <StyleInjector>
      <AgentPanel {...args} />
    </StyleInjector>
  ),
  args: {
    defaultAgent: "gpt-4o",
    placeholder: "GPT-4o selected by default",
    showCosts: true,
  },
};

export const Minimal: Story = {
  render: (args) => (
    <StyleInjector>
      <AgentPanel {...args} />
    </StyleInjector>
  ),
  args: {
    showCosts: false,
    showHistory: false,
    placeholder: "Simple prompt interface",
  },
};

export const FullFeatured: Story = {
  render: (args) => (
    <StyleInjector>
      <AgentPanel {...args} />
    </StyleInjector>
  ),
  args: {
    quickPrompts: sampleQuickPrompts,
    showCosts: true,
    showHistory: true,
    maxHistory: 5,
    placeholder: "Full-featured agent panel",
    context: { projectId: "demo-123", environment: "development" },
  },
};

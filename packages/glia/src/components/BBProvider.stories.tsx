import type { Meta, StoryObj } from "@storybook/react";
import { BBProvider, useBBContext } from "./BBProvider";
import type { Agent, BBConfig } from "../protocol/types";

// Sample config
const sampleConfig: BBConfig = {
  apiBaseUrl: "https://api.example.com",
  syncDebounce: 1000,
  conflictResolution: "prompt",
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
];

// Consumer component that displays context values
function ContextDisplay() {
  const ctx = useBBContext();

  return (
    <div className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Config</h3>
        <pre className="text-xs bg-muted/30 p-3 rounded overflow-auto">
          {JSON.stringify(ctx.config, null, 2)}
        </pre>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Agents ({ctx.agents.length})
        </h3>
        <div className="space-y-2">
          {ctx.agents.map((agent) => (
            <div
              key={agent.id}
              className="flex justify-between items-center p-2 bg-muted/20 rounded"
            >
              <div>
                <div className="text-sm font-medium text-foreground">{agent.name}</div>
                <div className="text-xs text-muted-foreground">{agent.description}</div>
              </div>
              <div className="text-xs text-cyan-neon">${agent.costPerRun.toFixed(3)}/run</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Sync Status</h3>
          <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
            ctx.syncStatus === "synced" ? "bg-emerald-neon/20 text-emerald-neon" :
            ctx.syncStatus === "pending" ? "bg-yellow-warning/20 text-yellow-warning" :
            ctx.syncStatus === "conflict" ? "bg-magenta-neon/20 text-magenta-neon" :
            "bg-muted text-muted-foreground"
          }`}>
            {ctx.syncStatus}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Cost</h3>
          <div className="text-lg font-mono text-cyan-neon">${ctx.totalCost.toFixed(3)}</div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">
          Active Runs: {ctx.activeRuns.length}
        </h3>
        <h3 className="text-sm font-medium text-muted-foreground">
          Run History: {ctx.runHistory.length}
        </h3>
      </div>
    </div>
  );
}

// Interactive demo with run simulation
function InteractiveDemo() {
  const ctx = useBBContext();

  const simulateRun = () => {
    const agent = ctx.agents[Math.floor(Math.random() * ctx.agents.length)];
    const runId = `run-${Date.now()}`;

    ctx.addRun({
      id: runId,
      agentId: agent.id,
      prompt: "Sample prompt for demonstration",
      status: "running",
      startedAt: Date.now(),
    });

    // Simulate completion after 2s
    setTimeout(() => {
      ctx.updateRun(runId, {
        status: "completed",
        output: "This is a simulated response from the agent.",
        cost: agent.costPerRun,
        completedAt: Date.now(),
      });
    }, 2000);
  };

  return (
    <div className="space-y-4 p-6 rounded-xl bg-card/50 border border-border/50">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-foreground">Interactive Demo</h2>
        <button
          onClick={simulateRun}
          className="px-4 py-2 bg-cyan-neon text-background rounded-lg text-sm font-medium hover:bg-cyan-neon/90 transition-colors"
        >
          Simulate Run
        </button>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Runs</h3>
        {ctx.activeRuns.length === 0 ? (
          <div className="text-sm text-muted-foreground italic">No active runs</div>
        ) : (
          <div className="space-y-2">
            {ctx.activeRuns.map((run) => (
              <div key={run.id} className="p-2 bg-yellow-warning/10 border border-yellow-warning/30 rounded">
                <div className="text-sm text-foreground">
                  {ctx.getAgent(run.agentId)?.name} - {run.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Run History</h3>
        {ctx.runHistory.length === 0 ? (
          <div className="text-sm text-muted-foreground italic">No runs yet</div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-auto">
            {ctx.runHistory.slice().reverse().map((run) => (
              <div
                key={run.id}
                className={`p-2 rounded text-sm ${
                  run.status === "completed" ? "bg-emerald-neon/10 border border-emerald-neon/30" :
                  run.status === "failed" ? "bg-magenta-neon/10 border border-magenta-neon/30" :
                  "bg-muted/30"
                }`}
              >
                <div className="flex justify-between">
                  <span className="text-foreground">{ctx.getAgent(run.agentId)?.name}</span>
                  <span className="text-cyan-neon">${(run.cost ?? 0).toFixed(3)}</span>
                </div>
                {run.output && (
                  <div className="text-xs text-muted-foreground mt-1 truncate">{run.output}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-border/50">
        <div className="text-lg font-mono text-cyan-neon">
          Session Total: ${ctx.totalCost.toFixed(3)}
        </div>
      </div>
    </div>
  );
}

const meta: Meta<typeof BBProvider> = {
  title: "Components/BBProvider",
  component: BBProvider,
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BBProvider>;

export const Default: Story = {
  render: () => (
    <BBProvider config={sampleConfig} agents={sampleAgents}>
      <div className="w-[400px]">
        <ContextDisplay />
      </div>
    </BBProvider>
  ),
};

export const WithInteractiveDemo: Story = {
  render: () => (
    <BBProvider config={sampleConfig} agents={sampleAgents}>
      <div className="w-[450px]">
        <InteractiveDemo />
      </div>
    </BBProvider>
  ),
};

export const OfflineMode: Story = {
  render: () => (
    <BBProvider config={sampleConfig} agents={sampleAgents} initialSyncStatus="offline">
      <div className="w-[400px]">
        <ContextDisplay />
      </div>
    </BBProvider>
  ),
};

export const PendingSync: Story = {
  render: () => (
    <BBProvider config={sampleConfig} agents={sampleAgents} initialSyncStatus="pending">
      <div className="w-[400px]">
        <ContextDisplay />
      </div>
    </BBProvider>
  ),
};

export const ConflictState: Story = {
  render: () => (
    <BBProvider config={sampleConfig} agents={sampleAgents} initialSyncStatus="conflict">
      <div className="w-[400px]">
        <ContextDisplay />
      </div>
    </BBProvider>
  ),
};

export const NoAgents: Story = {
  render: () => (
    <BBProvider config={sampleConfig} agents={[]}>
      <div className="w-[400px]">
        <ContextDisplay />
      </div>
    </BBProvider>
  ),
};

export const SingleAgent: Story = {
  render: () => (
    <BBProvider config={sampleConfig} agents={[sampleAgents[0]]}>
      <div className="w-[400px]">
        <ContextDisplay />
      </div>
    </BBProvider>
  ),
};

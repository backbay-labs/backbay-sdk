import type { Meta, StoryObj } from "@storybook/react";
import { AgentConsole } from "./AgentConsole";
import type { Message, FocusNode, QuickAction, AgentState, AgentMode } from "./types";

const meta: Meta<typeof AgentConsole> = {
  title: "Primitives/3D/Agent/AgentConsole",
  component: AgentConsole,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    agentState: {
      control: "select",
      options: ["idle", "listening", "thinking", "responding", "error"],
    },
    agentMode: {
      control: "select",
      options: ["conversational", "monitoring", "focused", "commanding"],
    },
    trustTier: {
      control: "select",
      options: ["bronze", "silver", "gold"],
    },
    isTyping: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof AgentConsole>;

// Mock data
const sampleMessages: Message[] = [
  {
    id: "1",
    role: "user",
    content: "What's the status of the current jobs?",
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: "2",
    role: "agent",
    content: "I can see 3 running jobs and 2 queued. The fab network is operating normally with all nodes online.",
    timestamp: new Date(Date.now() - 45000).toISOString(),
    thinking: "Checking job status across all clusters...",
  },
  {
    id: "3",
    role: "user",
    content: "Can you prioritize job-42?",
    timestamp: new Date(Date.now() - 30000).toISOString(),
  },
  {
    id: "4",
    role: "agent",
    content: "Done! Job-42 has been moved to high priority. It should start processing within the next few seconds.",
    timestamp: new Date(Date.now() - 15000).toISOString(),
    toolCalls: [
      {
        id: "tc-1",
        name: "prioritize_job",
        arguments: { job_id: "job-42", priority: "high" },
        result: { success: true },
        status: "completed",
      },
    ],
  },
];

const sampleFocusNodes: FocusNode[] = [
  {
    id: "focus-1",
    label: "Job 42",
    kind: "job",
    importance: 0.9,
    hasUnread: true,
    entityRef: { type: "job", id: "job-42" },
    description: "High priority render task",
  },
  {
    id: "focus-2",
    label: "Node Alpha",
    kind: "node",
    importance: 0.7,
    entityRef: { type: "node", id: "node-alpha" },
    description: "Primary compute node",
  },
  {
    id: "focus-3",
    label: "Warning",
    kind: "warning",
    importance: 0.8,
    description: "Node Beta is degraded",
  },
  {
    id: "focus-4",
    label: "Context",
    kind: "context",
    importance: 0.5,
    description: "Current workspace context",
  },
];

const sampleQuickActions: QuickAction[] = [
  {
    id: "action-1",
    label: "New Job",
    icon: "plus",
    shortcut: "N",
    enabled: true,
    category: "primary",
  },
  {
    id: "action-2",
    label: "Pause All",
    icon: "pause",
    shortcut: "P",
    enabled: true,
    category: "secondary",
  },
  {
    id: "action-3",
    label: "Emergency Stop",
    icon: "alert",
    shortcut: "Esc",
    enabled: true,
    category: "danger",
  },
];

const handlePromptSubmit = (text: string) => {
  console.log("Prompt submitted:", text);
};

export const Idle: Story = {
  args: {
    agentState: "idle",
    agentMode: "conversational",
    trustTier: "silver",
    isTyping: false,
    messages: sampleMessages,
    focusNodes: sampleFocusNodes,
    quickActions: sampleQuickActions,
    onPromptSubmit: handlePromptSubmit,
    onQuickAction: (id) => console.log("Quick action:", id),
    onFocusNodeClick: (id) => console.log("Focus node clicked:", id),
    style: { width: "100%", height: "600px" },
  },
};

export const Listening: Story = {
  args: {
    agentState: "listening",
    agentMode: "conversational",
    trustTier: "silver",
    isTyping: false,
    messages: sampleMessages,
    focusNodes: sampleFocusNodes,
    quickActions: sampleQuickActions,
    onPromptSubmit: handlePromptSubmit,
    onQuickAction: (id) => console.log("Quick action:", id),
    style: { width: "100%", height: "600px" },
  },
};

export const Thinking: Story = {
  args: {
    agentState: "thinking",
    agentMode: "conversational",
    trustTier: "silver",
    isTyping: true,
    messages: sampleMessages,
    focusNodes: sampleFocusNodes,
    quickActions: sampleQuickActions,
    onPromptSubmit: handlePromptSubmit,
    onQuickAction: (id) => console.log("Quick action:", id),
    style: { width: "100%", height: "600px" },
  },
};

export const Responding: Story = {
  args: {
    agentState: "responding",
    agentMode: "conversational",
    trustTier: "silver",
    isTyping: true,
    messages: sampleMessages,
    focusNodes: sampleFocusNodes,
    quickActions: sampleQuickActions,
    onPromptSubmit: handlePromptSubmit,
    onQuickAction: (id) => console.log("Quick action:", id),
    style: { width: "100%", height: "600px" },
  },
};

export const Error: Story = {
  args: {
    agentState: "error",
    agentMode: "conversational",
    trustTier: "silver",
    isTyping: false,
    messages: [
      ...sampleMessages,
      {
        id: "error-1",
        role: "system" as const,
        content: "Connection to fab network lost. Attempting to reconnect...",
        timestamp: new Date().toISOString(),
      },
    ],
    focusNodes: sampleFocusNodes,
    quickActions: sampleQuickActions,
    onPromptSubmit: handlePromptSubmit,
    onQuickAction: (id) => console.log("Quick action:", id),
    style: { width: "100%", height: "600px" },
  },
};

export const MonitoringMode: Story = {
  args: {
    agentState: "idle",
    agentMode: "monitoring",
    trustTier: "gold",
    isTyping: false,
    messages: [
      {
        id: "m-1",
        role: "agent",
        content: "Monitoring mode active. I'll alert you to any significant changes.",
        timestamp: new Date().toISOString(),
      },
    ],
    focusNodes: [
      { id: "f-1", label: "CPU Usage", kind: "context", importance: 0.6 },
      { id: "f-2", label: "Active Jobs", kind: "job", importance: 0.8 },
      { id: "f-3", label: "Network", kind: "node", importance: 0.5 },
    ],
    quickActions: sampleQuickActions,
    onPromptSubmit: handlePromptSubmit,
    onQuickAction: (id) => console.log("Quick action:", id),
    style: { width: "100%", height: "600px" },
  },
};

export const FocusedMode: Story = {
  args: {
    agentState: "thinking",
    agentMode: "focused",
    trustTier: "silver",
    isTyping: true,
    messages: [
      {
        id: "m-1",
        role: "user",
        content: "Analyze job-42 in detail",
        timestamp: new Date(Date.now() - 10000).toISOString(),
      },
      {
        id: "m-2",
        role: "agent",
        content: "Focusing on job-42. Analyzing execution history, dependencies, and performance metrics...",
        timestamp: new Date().toISOString(),
        thinking: "Gathering detailed metrics from job execution logs...",
      },
    ],
    focusNodes: sampleFocusNodes,
    focusedNodeId: "focus-1",
    quickActions: sampleQuickActions,
    onPromptSubmit: handlePromptSubmit,
    onQuickAction: (id) => console.log("Quick action:", id),
    onFocusNodeClick: (id) => console.log("Focus node clicked:", id),
    style: { width: "100%", height: "600px" },
  },
};

export const CommandingMode: Story = {
  args: {
    agentState: "responding",
    agentMode: "commanding",
    trustTier: "gold",
    isTyping: true,
    messages: [
      {
        id: "m-1",
        role: "user",
        content: "Execute emergency failover",
        timestamp: new Date(Date.now() - 5000).toISOString(),
      },
      {
        id: "m-2",
        role: "agent",
        content: "Initiating emergency failover sequence...",
        timestamp: new Date().toISOString(),
        toolCalls: [
          {
            id: "tc-1",
            name: "emergency_failover",
            arguments: { confirm: true },
            status: "running",
          },
        ],
      },
    ],
    focusNodes: [
      { id: "f-1", label: "Failover", kind: "action", importance: 1.0 },
      { id: "f-2", label: "Warning", kind: "warning", importance: 0.9 },
    ],
    quickActions: [
      { id: "cancel", label: "Cancel", category: "danger", enabled: true },
    ],
    onPromptSubmit: handlePromptSubmit,
    onQuickAction: (id) => console.log("Quick action:", id),
    style: { width: "100%", height: "600px" },
  },
};

export const BronzeTier: Story = {
  args: {
    agentState: "idle",
    agentMode: "conversational",
    trustTier: "bronze",
    isTyping: false,
    messages: sampleMessages.slice(0, 2),
    focusNodes: sampleFocusNodes.slice(0, 2),
    quickActions: sampleQuickActions.slice(0, 2),
    onPromptSubmit: handlePromptSubmit,
    onQuickAction: (id) => console.log("Quick action:", id),
    style: { width: "100%", height: "600px" },
  },
};

export const GoldTier: Story = {
  args: {
    agentState: "idle",
    agentMode: "conversational",
    trustTier: "gold",
    isTyping: false,
    messages: sampleMessages,
    focusNodes: sampleFocusNodes,
    quickActions: sampleQuickActions,
    onPromptSubmit: handlePromptSubmit,
    onQuickAction: (id) => console.log("Quick action:", id),
    style: { width: "100%", height: "600px" },
  },
};

export const MinimalUI: Story = {
  args: {
    agentState: "idle",
    agentMode: "conversational",
    trustTier: "silver",
    isTyping: false,
    messages: [],
    focusNodes: [],
    quickActions: [],
    onPromptSubmit: handlePromptSubmit,
    style: { width: "100%", height: "600px" },
  },
};

export const LongConversation: Story = {
  args: {
    agentState: "idle",
    agentMode: "conversational",
    trustTier: "silver",
    isTyping: false,
    messages: [
      ...sampleMessages,
      {
        id: "5",
        role: "user" as const,
        content: "What about the node performance?",
        timestamp: new Date(Date.now() - 10000).toISOString(),
      },
      {
        id: "6",
        role: "agent" as const,
        content: "All nodes are performing within normal parameters. Node Alpha is at 72% capacity, Node Beta at 45%.",
        timestamp: new Date(Date.now() - 5000).toISOString(),
      },
      {
        id: "7",
        role: "user" as const,
        content: "Scale up Node Beta",
        timestamp: new Date().toISOString(),
      },
    ],
    focusNodes: sampleFocusNodes,
    quickActions: sampleQuickActions,
    onPromptSubmit: handlePromptSubmit,
    onQuickAction: (id) => console.log("Quick action:", id),
    style: { width: "100%", height: "600px" },
  },
};

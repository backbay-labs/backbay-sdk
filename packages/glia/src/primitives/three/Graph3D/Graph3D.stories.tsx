import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Graph3D } from "./Graph3D";
import type { GraphSnapshot, GraphNode, GraphEdge } from "./types";

const meta: Meta<typeof Graph3D> = {
  title: "Primitives/3D/DataViz/Graph3D",
  component: Graph3D,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    layout: {
      control: "select",
      options: ["fibonacci", "force", "ring", "custom"],
    },
    dimUnhighlighted: {
      control: "boolean",
    },
    showGrid: {
      control: "boolean",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px", background: "#050812" }}>
        <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.6} />
          <OrbitControls autoRotate autoRotateSpeed={0.5} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Graph3D>;

// Mock data generators
const createNode = (
  id: string,
  label: string,
  category?: string,
  status?: GraphNode["status"],
  weight?: number
): GraphNode => ({
  id,
  label,
  category,
  status,
  weight,
});

const createEdge = (
  source: string,
  target: string,
  type?: GraphEdge["type"]
): GraphEdge => ({
  id: `${source}-${target}`,
  source,
  target,
  type,
});

// Simple graph
const simpleGraph: GraphSnapshot = {
  nodes: [
    createNode("1", "Start", "core", "completed", 0.8),
    createNode("2", "Process", "core", "active", 0.6),
    createNode("3", "Validate", "helper", "normal", 0.4),
    createNode("4", "Output", "core", "normal", 0.5),
  ],
  edges: [
    createEdge("1", "2", "default"),
    createEdge("2", "3", "requires"),
    createEdge("3", "4", "default"),
    createEdge("2", "4", "relates"),
  ],
};

// Knowledge graph
const knowledgeGraph: GraphSnapshot = {
  nodes: [
    createNode("concept-1", "Machine Learning", "concept", "active", 1.0),
    createNode("concept-2", "Neural Networks", "concept", "normal", 0.8),
    createNode("concept-3", "Deep Learning", "concept", "normal", 0.7),
    createNode("concept-4", "Transformers", "concept", "candidate", 0.6),
    createNode("concept-5", "Attention", "concept", "normal", 0.5),
    createNode("concept-6", "GPT", "model", "active", 0.9),
    createNode("concept-7", "BERT", "model", "normal", 0.7),
    createNode("concept-8", "LLM", "category", "normal", 0.8),
  ],
  edges: [
    createEdge("concept-1", "concept-2", "relates"),
    createEdge("concept-2", "concept-3", "requires"),
    createEdge("concept-3", "concept-4", "relates"),
    createEdge("concept-4", "concept-5", "requires"),
    createEdge("concept-4", "concept-6", "relates"),
    createEdge("concept-4", "concept-7", "relates"),
    createEdge("concept-6", "concept-8", "relates"),
    createEdge("concept-7", "concept-8", "relates"),
    createEdge("concept-1", "concept-8", "relates"),
  ],
};

// Task graph
const taskGraph: GraphSnapshot = {
  nodes: [
    createNode("task-1", "Setup Environment", "setup", "completed", 0.3),
    createNode("task-2", "Design API", "design", "completed", 0.5),
    createNode("task-3", "Implement Auth", "feature", "active", 0.7),
    createNode("task-4", "Write Tests", "testing", "candidate", 0.4),
    createNode("task-5", "Implement CRUD", "feature", "blocked", 0.6),
    createNode("task-6", "Deploy", "ops", "normal", 0.5),
    createNode("task-7", "Documentation", "docs", "normal", 0.3),
  ],
  edges: [
    createEdge("task-1", "task-2", "default"),
    createEdge("task-2", "task-3", "requires"),
    createEdge("task-2", "task-5", "requires"),
    createEdge("task-3", "task-4", "relates"),
    createEdge("task-5", "task-4", "relates"),
    createEdge("task-3", "task-6", "default"),
    createEdge("task-5", "task-6", "default"),
    createEdge("task-6", "task-7", "default"),
  ],
};

// Large graph for stress testing
const largeGraph: GraphSnapshot = {
  nodes: Array.from({ length: 30 }, (_, i) =>
    createNode(
      `node-${i}`,
      `Node ${i}`,
      ["core", "helper", "util"][i % 3],
      ["normal", "active", "completed", "candidate"][i % 4] as GraphNode["status"],
      Math.random()
    )
  ),
  edges: Array.from({ length: 45 }, (_, i) => {
    const source = `node-${i % 30}`;
    const target = `node-${(i + 1 + Math.floor(Math.random() * 5)) % 30}`;
    return createEdge(source, target, ["default", "requires", "relates"][i % 3] as GraphEdge["type"]);
  }),
};

export const Default: Story = {
  args: {
    graph: simpleGraph,
    layout: "fibonacci",
  },
};

export const FibonacciLayout: Story = {
  args: {
    graph: knowledgeGraph,
    layout: "fibonacci",
  },
};

export const ForceLayout: Story = {
  args: {
    graph: knowledgeGraph,
    layout: "force",
    layoutOptions: {
      repelStrength: 0.5,
      linkStrength: 0.3,
    },
  },
};

export const RingLayout: Story = {
  args: {
    graph: simpleGraph,
    layout: "ring",
    layoutOptions: {
      radius: 3,
    },
  },
};

export const WithSelection: Story = {
  args: {
    graph: knowledgeGraph,
    layout: "fibonacci",
    selectedNodeId: "concept-6",
    dimUnhighlighted: true,
  },
};

export const WithFocusedPath: Story = {
  args: {
    graph: taskGraph,
    layout: "fibonacci",
    focusedPath: ["task-1", "task-2", "task-3", "task-6"],
    dimUnhighlighted: true,
  },
};

export const WithHighlightedNodes: Story = {
  args: {
    graph: knowledgeGraph,
    layout: "fibonacci",
    highlightedNodeIds: ["concept-4", "concept-5", "concept-6"],
    dimUnhighlighted: true,
  },
};

export const TaskBoard: Story = {
  args: {
    graph: taskGraph,
    layout: "fibonacci",
    agentActivity: {
      mode: "weaving",
      activeNodeIds: ["task-3", "task-4"],
    },
  },
};

export const KnowledgeMap: Story = {
  args: {
    graph: knowledgeGraph,
    layout: "force",
    layoutOptions: {
      repelStrength: 0.6,
      gravity: 0.1,
    },
  },
};

export const LargeGraph: Story = {
  args: {
    graph: largeGraph,
    layout: "fibonacci",
    maxNodeCountForLabels: 10,
  },
};

export const AgentWeaving: Story = {
  args: {
    graph: knowledgeGraph,
    layout: "fibonacci",
    agentActivity: {
      mode: "weaving",
      activeNodeIds: ["concept-1", "concept-2", "concept-3"],
      activeEdgeIds: ["concept-1-concept-2", "concept-2-concept-3"],
    },
  },
};

export const EmbedMode: Story = {
  args: {
    graph: simpleGraph,
    layout: "fibonacci",
    embedMode: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px", background: "#0a0f1a" }}>
        <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={0.5} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

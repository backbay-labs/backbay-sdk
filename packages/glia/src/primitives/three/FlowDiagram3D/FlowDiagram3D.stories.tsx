import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { FlowDiagram3D } from "./FlowDiagram3D";
import type { FlowStage, FlowConnection } from "./types";

const meta: Meta<typeof FlowDiagram3D> = {
  title: "Primitives/3D/Workflow/FlowDiagram3D",
  component: FlowDiagram3D,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    layout: {
      control: "select",
      options: ["linear", "branching", "parallel"],
    },
    direction: {
      control: "radio",
      options: ["horizontal", "vertical"],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px", background: "#050810" }}>
        <Canvas camera={{ position: [0, 2, 12], fov: 50 }}>
          <color attach="background" args={["#050810"]} />
          <fog attach="fog" args={["#050810", 12, 35]} />
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={0.4} color="#00ccff" />
          <pointLight position={[-10, 5, -5]} intensity={0.3} color="#8B5CF6" />
          <Stars
            radius={60}
            depth={40}
            count={1200}
            factor={3}
            saturation={0}
            fade
            speed={0.3}
          />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={4}
            maxDistance={25}
          />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FlowDiagram3D>;

// -----------------------------------------------------------------------------
// Sample Data
// -----------------------------------------------------------------------------

const linearStages: FlowStage[] = [
  { id: "build", label: "Build", status: "complete", duration: "1.2s", icon: "🔨" },
  { id: "test", label: "Test", status: "complete", duration: "4.8s", icon: "🧪" },
  { id: "review", label: "Review", status: "running", progress: 0.6, icon: "👀", description: "Code review in progress" },
  { id: "stage", label: "Stage", status: "pending", icon: "📦" },
  { id: "deploy", label: "Deploy", status: "pending", icon: "🚀" },
];

const linearConnections: FlowConnection[] = [
  { from: "build", to: "test", condition: "on success", animated: true },
  { from: "test", to: "review", animated: true },
  { from: "review", to: "stage" },
  { from: "stage", to: "deploy" },
];

const failedStages: FlowStage[] = [
  { id: "build", label: "Build", status: "complete", duration: "1.2s", icon: "🔨" },
  { id: "test", label: "Test", status: "failed", duration: "2.1s", icon: "🧪", description: "3 tests failed" },
  { id: "review", label: "Review", status: "skipped", icon: "👀" },
  { id: "stage", label: "Stage", status: "skipped", icon: "📦" },
  { id: "deploy", label: "Deploy", status: "skipped", icon: "🚀" },
];

const failedConnections: FlowConnection[] = [
  { from: "build", to: "test", condition: "on success", animated: true },
  { from: "test", to: "review", condition: "on failure" },
  { from: "review", to: "stage" },
  { from: "stage", to: "deploy" },
];

const branchingStages: FlowStage[] = [
  { id: "build", label: "Build", status: "complete", duration: "1.2s", icon: "🔨" },
  { id: "unit", label: "Unit Test", status: "complete", duration: "3.1s", icon: "🧪" },
  { id: "integ", label: "Integ Test", status: "running", progress: 0.45, icon: "🔗", description: "Integration suite running" },
  { id: "e2e", label: "E2E Test", status: "running", progress: 0.8, icon: "🌐", description: "Browser tests in progress" },
  { id: "merge", label: "Merge", status: "pending", icon: "🔀" },
  { id: "deploy", label: "Deploy", status: "pending", icon: "🚀" },
];

const branchingConnections: FlowConnection[] = [
  { from: "build", to: "unit", animated: true },
  { from: "build", to: "integ", animated: true },
  { from: "build", to: "e2e", animated: true },
  { from: "unit", to: "merge", condition: "on success", animated: true },
  { from: "integ", to: "merge", condition: "on success" },
  { from: "e2e", to: "merge", condition: "on success" },
  { from: "merge", to: "deploy" },
];

const verticalStages: FlowStage[] = [
  { id: "checkout", label: "Checkout", status: "complete", duration: "0.3s", icon: "📥" },
  { id: "install", label: "Install", status: "complete", duration: "12s", icon: "📦" },
  { id: "lint", label: "Lint", status: "complete", duration: "1.8s", icon: "🔍" },
  { id: "build", label: "Build", status: "running", progress: 0.7, icon: "🔨" },
];

const verticalConnections: FlowConnection[] = [
  { from: "checkout", to: "install", animated: true },
  { from: "install", to: "lint", animated: true },
  { from: "lint", to: "build", animated: true },
];

const allCompleteStages: FlowStage[] = [
  { id: "build", label: "Build", status: "complete", duration: "1.2s", icon: "🔨" },
  { id: "test", label: "Test", status: "complete", duration: "4.8s", icon: "🧪" },
  { id: "review", label: "Review", status: "complete", duration: "15m", icon: "👀" },
  { id: "stage", label: "Stage", status: "complete", duration: "32s", icon: "📦" },
  { id: "deploy", label: "Deploy", status: "complete", duration: "45s", icon: "🚀" },
];

const allCompleteConnections: FlowConnection[] = [
  { from: "build", to: "test", condition: "on success", animated: true },
  { from: "test", to: "review", animated: true },
  { from: "review", to: "stage", animated: true },
  { from: "stage", to: "deploy", animated: true },
];

// -----------------------------------------------------------------------------
// Stories
// -----------------------------------------------------------------------------

export const Default: Story = {
  args: {
    stages: linearStages,
    connections: linearConnections,
    layout: "linear",
    direction: "horizontal",
    activeStageId: "review",
  },
};

export const WithFailure: Story = {
  args: {
    stages: failedStages,
    connections: failedConnections,
    layout: "linear",
    direction: "horizontal",
  },
};

export const Branching: Story = {
  args: {
    stages: branchingStages,
    connections: branchingConnections,
    layout: "branching",
    direction: "horizontal",
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "700px", background: "#050810" }}>
        <Canvas camera={{ position: [3, 4, 14], fov: 50 }}>
          <color attach="background" args={["#050810"]} />
          <fog attach="fog" args={["#050810", 14, 40]} />
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={0.4} color="#00ccff" />
          <pointLight position={[-10, 5, -5]} intensity={0.3} color="#8B5CF6" />
          <Stars radius={60} depth={40} count={1200} factor={3} fade speed={0.3} />
          <OrbitControls enableDamping dampingFactor={0.05} minDistance={4} maxDistance={30} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export const Vertical: Story = {
  args: {
    stages: verticalStages,
    connections: verticalConnections,
    layout: "linear",
    direction: "vertical",
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "700px", background: "#050810" }}>
        <Canvas camera={{ position: [5, 0, 10], fov: 50 }}>
          <color attach="background" args={["#050810"]} />
          <fog attach="fog" args={["#050810", 12, 35]} />
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={0.4} color="#00ccff" />
          <Stars radius={60} depth={40} count={1200} factor={3} fade speed={0.3} />
          <OrbitControls enableDamping dampingFactor={0.05} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export const AllComplete: Story = {
  args: {
    stages: allCompleteStages,
    connections: allCompleteConnections,
    layout: "linear",
    direction: "horizontal",
  },
};

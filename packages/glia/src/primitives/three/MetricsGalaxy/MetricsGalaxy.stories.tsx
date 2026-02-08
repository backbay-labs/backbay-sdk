import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { MetricsGalaxy } from "./MetricsGalaxy";
import type { MetricNode, MetricConnection } from "./types";

const meta: Meta<typeof MetricsGalaxy> = {
  title: "Primitives/3D/Monitoring/MetricsGalaxy",
  component: MetricsGalaxy,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    layout: {
      control: "select",
      options: ["galaxy", "grid", "radial"],
    },
    autoRotate: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px", background: "#020410" }}>
        <Canvas camera={{ position: [0, 4, 8], fov: 50 }}>
          <color attach="background" args={["#020410"]} />
          <fog attach="fog" args={["#020410", 10, 30]} />
          <ambientLight intensity={0.15} />
          <pointLight position={[10, 10, 10]} intensity={0.3} color="#22D3EE" />
          <pointLight position={[-8, 5, -8]} intensity={0.2} color="#8B5CF6" />
          <Stars
            radius={80}
            depth={50}
            count={1500}
            factor={3}
            saturation={0}
            fade
            speed={0.15}
          />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={4}
            maxDistance={20}
          />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MetricsGalaxy>;

// --- Test data ---

function sparkline(base: number, variance: number, len: number = 12): number[] {
  return Array.from({ length: len }, () => base + (Math.random() - 0.5) * variance * 2);
}

const defaultMetrics: MetricNode[] = [
  {
    id: "cpu",
    label: "CPU",
    value: 72,
    unit: "%",
    trend: 3.2,
    threshold: { warn: 70, critical: 90 },
    history: sparkline(72, 8),
    category: "compute",
  },
  {
    id: "memory",
    label: "Memory",
    value: 4.2,
    unit: "GB",
    trend: -1.1,
    threshold: { warn: 6, critical: 7.5 },
    history: sparkline(4.2, 0.6),
    category: "memory",
  },
  {
    id: "latency",
    label: "Latency",
    value: 23,
    unit: "ms",
    trend: -5.4,
    threshold: { warn: 50, critical: 100 },
    history: sparkline(23, 8),
    category: "network",
  },
  {
    id: "throughput",
    label: "Throughput",
    value: 1200,
    unit: "req/s",
    trend: 12.1,
    threshold: { warn: 800, critical: 500 },
    history: sparkline(1200, 200),
    category: "network",
  },
  {
    id: "disk",
    label: "Disk",
    value: 45,
    unit: "%",
    trend: 0.8,
    threshold: { warn: 75, critical: 90 },
    history: sparkline(45, 5),
    category: "storage",
  },
  {
    id: "gpu",
    label: "GPU",
    value: 38,
    unit: "%",
    trend: 7.3,
    threshold: { warn: 80, critical: 95 },
    history: sparkline(38, 10),
    category: "compute",
  },
  {
    id: "tokens",
    label: "Tokens",
    value: 847,
    unit: "/1000",
    trend: 2.5,
    threshold: { warn: 900, critical: 980 },
    history: sparkline(847, 40),
    category: "compute",
  },
  {
    id: "errors",
    label: "Errors",
    value: 3,
    unit: "/min",
    trend: -2.0,
    threshold: { warn: 10, critical: 25 },
    history: sparkline(3, 2),
    category: "network",
  },
];

const defaultConnections: MetricConnection[] = [
  { from: "cpu", to: "memory", strength: 0.8 },
  { from: "cpu", to: "gpu", strength: 0.6 },
  { from: "latency", to: "throughput", strength: 0.9 },
  { from: "memory", to: "tokens", strength: 0.5 },
  { from: "throughput", to: "errors", strength: 0.7 },
  { from: "disk", to: "memory", strength: 0.4 },
];

const criticalMetrics: MetricNode[] = defaultMetrics.map((m) => {
  if (m.id === "cpu") return { ...m, value: 95, trend: 18.5, history: sparkline(95, 3) };
  if (m.id === "memory") return { ...m, value: 7.8, trend: 12.0, history: sparkline(7.8, 0.3) };
  return m;
});

const minimalMetrics: MetricNode[] = [
  { id: "cpu", label: "CPU", value: 55, unit: "%", trend: 1.2 },
  { id: "mem", label: "Memory", value: 3.1, unit: "GB", trend: -0.4 },
  { id: "net", label: "Network", value: 120, unit: "Mbps", trend: 5.0 },
];

export const Default: Story = {
  args: {
    metrics: defaultMetrics,
    connections: defaultConnections,
    layout: "galaxy",
    autoRotate: true,
  },
};

export const Critical: Story = {
  args: {
    metrics: criticalMetrics,
    connections: defaultConnections,
    layout: "galaxy",
    autoRotate: false,
  },
};

export const RadialLayout: Story = {
  args: {
    metrics: defaultMetrics,
    connections: defaultConnections,
    layout: "radial",
    autoRotate: true,
  },
};

export const GridLayout: Story = {
  args: {
    metrics: defaultMetrics,
    connections: defaultConnections,
    layout: "grid",
    autoRotate: false,
  },
};

export const Minimal: Story = {
  args: {
    metrics: minimalMetrics,
    layout: "galaxy",
    autoRotate: true,
  },
};

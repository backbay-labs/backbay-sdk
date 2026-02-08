import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { DataStream } from "./DataStream";
import type { StreamEvent, EventType } from "./types";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const EVENT_TYPES: EventType[] = ["info", "success", "warning", "error", "system"];

function generateEvent(id: string, type?: EventType, value?: number): StreamEvent {
  const t = type ?? EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
  const labels: Record<EventType, string[]> = {
    info: ["Heartbeat OK", "Config loaded", "Cache hit", "Metric sync", "Index refresh"],
    success: ["Deploy complete", "Build passed", "Test green", "Backup done", "Migration OK"],
    warning: ["High latency", "Disk 85%", "Slow query", "Rate limit near", "Cert expiring"],
    error: ["OOM killed", "Timeout 504", "Auth failed", "Disk full", "Connection lost"],
    system: ["Reboot scheduled", "Failover init", "Scale-up", "GC pause", "Snapshot taken"],
  };
  const pool = labels[t];
  return {
    id,
    type: t,
    label: pool[Math.floor(Math.random() * pool.length)],
    timestamp: Date.now() - Math.random() * 3600000,
    value: value ?? 1 + Math.floor(Math.random() * 10),
    metadata:
      Math.random() > 0.5
        ? { host: `node-${Math.floor(Math.random() * 8)}`, region: "us-east-1" }
        : undefined,
  };
}

function generateEvents(count: number, typeBias?: EventType): StreamEvent[] {
  return Array.from({ length: count }, (_, i) => {
    const biased = typeBias && Math.random() < 0.7;
    return generateEvent(`ev-${i}`, biased ? typeBias : undefined);
  });
}

// -----------------------------------------------------------------------------
// Meta
// -----------------------------------------------------------------------------

const meta: Meta<typeof DataStream> = {
  title: "Primitives/3D/Visualization/DataStream",
  component: DataStream,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    maxVisible: {
      control: { type: "range", min: 5, max: 100, step: 5 },
    },
    speed: {
      control: { type: "range", min: 0, max: 5, step: 0.25 },
    },
    streamShape: {
      control: "radio",
      options: ["ribbon", "helix", "arc"],
    },
    highlightType: {
      control: "select",
      options: [null, "info", "success", "warning", "error", "system"],
    },
    paused: {
      control: "boolean",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px", background: "#050810" }}>
        <Canvas camera={{ position: [0, 3, 10], fov: 50 }}>
          <color attach="background" args={["#050810"]} />
          <fog attach="fog" args={["#050810", 10, 30]} />
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={0.4} color="#22D3EE" />
          <pointLight position={[-10, 5, -5]} intensity={0.3} color="#F43F5E" />
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
            maxDistance={20}
          />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DataStream>;

// -----------------------------------------------------------------------------
// Stories
// -----------------------------------------------------------------------------

export const Default: Story = {
  args: {
    events: generateEvents(30),
    maxVisible: 50,
    speed: 1,
    streamShape: "ribbon",
    paused: false,
  },
};

export const HelixStream: Story = {
  args: {
    events: generateEvents(40),
    maxVisible: 50,
    speed: 1,
    streamShape: "helix",
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px", background: "#050810" }}>
        <Canvas camera={{ position: [0, 4, 12], fov: 50 }}>
          <color attach="background" args={["#050810"]} />
          <fog attach="fog" args={["#050810", 12, 35]} />
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={0.4} color="#8B5CF6" />
          <pointLight position={[-10, 5, -5]} intensity={0.3} color="#22D3EE" />
          <Stars radius={60} depth={40} count={1200} factor={3} fade speed={0.3} />
          <OrbitControls enableDamping dampingFactor={0.05} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export const ArcStream: Story = {
  args: {
    events: generateEvents(20),
    maxVisible: 50,
    speed: 1,
    streamShape: "arc",
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px", background: "#050810" }}>
        <Canvas camera={{ position: [0, 2, 12], fov: 50 }}>
          <color attach="background" args={["#050810"]} />
          <fog attach="fog" args={["#050810", 12, 35]} />
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 8, 5]} intensity={0.5} color="#10B981" />
          <Stars radius={60} depth={40} count={1000} factor={3} fade speed={0.3} />
          <OrbitControls enableDamping dampingFactor={0.05} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export const HighTraffic: Story = {
  args: {
    events: generateEvents(100, "info"),
    maxVisible: 100,
    speed: 2,
    streamShape: "ribbon",
  },
};

export const FilteredErrors: Story = {
  args: {
    events: generateEvents(30),
    maxVisible: 50,
    speed: 1,
    streamShape: "ribbon",
    highlightType: "error",
  },
};

export const Paused: Story = {
  args: {
    events: generateEvents(25),
    maxVisible: 50,
    speed: 1,
    streamShape: "ribbon",
    paused: true,
  },
};

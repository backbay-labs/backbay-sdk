import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ParticleField } from "./ParticleField";

const meta: Meta<typeof ParticleField> = {
  title: "Primitives/3D/Fields/ParticleField",
  component: ParticleField,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs", "!static-grade"],
  argTypes: {
    count: {
      control: { type: "range", min: 10, max: 500, step: 10 },
    },
    range: {
      control: { type: "range", min: 5, max: 50, step: 5 },
    },
    color: {
      control: "color",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "500px", background: "#050812" }}>
        <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
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
type Story = StoryObj<typeof ParticleField>;

export const Default: Story = {
  args: {
    count: 100,
    range: 20,
    color: "#00f0ff",
  },
};

export const CyanNeon: Story = {
  args: {
    count: 150,
    range: 20,
    color: "#00f0ff",
  },
};

export const MagentaNeon: Story = {
  args: {
    count: 150,
    range: 20,
    color: "#ff00aa",
  },
};

export const EmeraldNeon: Story = {
  args: {
    count: 150,
    range: 20,
    color: "#00ff88",
  },
};

export const Dense: Story = {
  args: {
    count: 400,
    range: 15,
    color: "#00f0ff",
  },
};

export const Sparse: Story = {
  args: {
    count: 50,
    range: 30,
    color: "#00f0ff",
  },
};

export const WideSpread: Story = {
  args: {
    count: 200,
    range: 40,
    color: "#6366f1",
  },
};

export const Compact: Story = {
  args: {
    count: 100,
    range: 8,
    color: "#f59e0b",
  },
};

export const MultiColor: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "500px", background: "#050812" }}>
        <Canvas camera={{ position: [0, 0, 20], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.6} />
          <OrbitControls autoRotate autoRotateSpeed={0.3} />
          <ParticleField count={80} range={15} color="#00f0ff" />
          <ParticleField count={80} range={15} color="#ff00aa" />
          <ParticleField count={80} range={15} color="#00ff88" />
        </Canvas>
      </div>
    ),
  ],
  render: () => null,
};

export const BackgroundAmbience: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px", background: "linear-gradient(to bottom, #050812, #0a0f1a)", position: "relative" }}>
        <Canvas camera={{ position: [0, 0, 25], fov: 60 }} style={{ position: "absolute", inset: 0 }}>
          <ambientLight intensity={0.3} />
          <ParticleField count={300} range={35} color="#00f0ff" />
          <OrbitControls
            autoRotate
            autoRotateSpeed={0.2}
            enableZoom={false}
            enablePan={false}
          />
        </Canvas>
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          textAlign: "center",
          padding: "2rem",
          pointerEvents: "none",
        }}>
          <div>
            <h1 style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: "1rem" }}>
              Welcome to bb-ui
            </h1>
            <p style={{ fontSize: "1.25rem", color: "rgba(255,255,255,0.7)" }}>
              A comprehensive component library for agent-native interfaces
            </p>
          </div>
        </div>
      </div>
    ),
  ],
  render: () => null,
};

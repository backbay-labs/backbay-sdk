import type { Meta, StoryObj } from "@storybook/react";
import { AmbientField, useFieldBus } from "./AmbientField";
import { useEffect } from "react";

const meta: Meta<typeof AmbientField> = {
  title: "Primitives/3D/Fields/AmbientField",
  component: AmbientField,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    fov: {
      control: { type: "range", min: 30, max: 90, step: 5 },
    },
    cameraZ: {
      control: { type: "range", min: 1, max: 5, step: 0.5 },
    },
    enablePoints: {
      control: "boolean",
    },
    pointsCount: {
      control: { type: "range", min: 500, max: 10000, step: 500 },
    },
    probeRadius: {
      control: { type: "range", min: 0.02, max: 0.2, step: 0.02 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AmbientField>;

export const Default: Story = {
  args: {
    style: { width: "100%", height: "500px" },
    enablePoints: true,
    pointsCount: 3000,
    probeRadius: 0.08,
  },
};

export const WithoutPoints: Story = {
  args: {
    style: { width: "100%", height: "500px" },
    enablePoints: false,
  },
};

export const DenseStars: Story = {
  args: {
    style: { width: "100%", height: "500px" },
    enablePoints: true,
    pointsCount: 8000,
    probeRadius: 0.06,
  },
};

export const SparseStars: Story = {
  args: {
    style: { width: "100%", height: "500px" },
    enablePoints: true,
    pointsCount: 1000,
    probeRadius: 0.1,
  },
};

export const WideAngle: Story = {
  args: {
    style: { width: "100%", height: "500px" },
    fov: 75,
    cameraZ: 2,
    enablePoints: true,
    pointsCount: 3000,
  },
};

export const CloseUp: Story = {
  args: {
    style: { width: "100%", height: "500px" },
    fov: 40,
    cameraZ: 1.5,
    enablePoints: true,
    pointsCount: 5000,
    probeRadius: 0.15,
  },
};

// Interactive demo with impulses
const ImpulseDemo = () => {
  const bus = useFieldBus();

  useEffect(() => {
    // Fire random impulses periodically
    const interval = setInterval(() => {
      bus.impulse({
        uv: { x: Math.random(), y: Math.random() },
        radius: 0.1 + Math.random() * 0.1,
        amplitude: 0.5 + Math.random() * 0.5,
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [bus]);

  return null;
};

export const WithImpulses: Story = {
  render: (args) => (
    <AmbientField {...args}>
      <ImpulseDemo />
    </AmbientField>
  ),
  args: {
    style: { width: "100%", height: "500px" },
    enablePoints: true,
    pointsCount: 3000,
    probeRadius: 0.08,
  },
};

// Demo with anchors
const AnchorDemo = () => {
  const bus = useFieldBus();

  useEffect(() => {
    // Place permanent anchors
    bus.anchor("anchor-1", {
      uv: { x: 0.3, y: 0.3 },
      strength: 0.7,
      color: "cyan",
    });
    bus.anchor("anchor-2", {
      uv: { x: 0.7, y: 0.3 },
      strength: 0.5,
      color: "magenta",
    });
    bus.anchor("anchor-3", {
      uv: { x: 0.5, y: 0.7 },
      strength: 0.6,
      color: "emerald",
    });

    return () => {
      bus.releaseAnchor("anchor-1");
      bus.releaseAnchor("anchor-2");
      bus.releaseAnchor("anchor-3");
    };
  }, [bus]);

  return null;
};

export const WithAnchors: Story = {
  render: (args) => (
    <AmbientField {...args}>
      <AnchorDemo />
    </AmbientField>
  ),
  args: {
    style: { width: "100%", height: "500px" },
    enablePoints: true,
    pointsCount: 3000,
    probeRadius: 0.08,
  },
};

// Background layer demo
export const AsBackground: Story = {
  render: (args) => (
    <div style={{ position: "relative", width: "100%", height: "600px" }}>
      <AmbientField {...args} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          textAlign: "center",
          padding: "2rem",
          pointerEvents: "none",
        }}
      >
        <div>
          <h1 style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: "1rem" }}>
            Ambient Field
          </h1>
          <p style={{ fontSize: "1.25rem", color: "rgba(255,255,255,0.7)", maxWidth: "600px" }}>
            A reactive 3D background that responds to domain events, creating visual
            impulses and anchors for an immersive experience.
          </p>
        </div>
      </div>
    </div>
  ),
  args: {
    enablePoints: true,
    pointsCount: 4000,
    probeRadius: 0.06,
    style: { background: "linear-gradient(to bottom, #050812, #0a0f1a)" },
  },
};

// Card overlay demo
export const WithContentOverlay: Story = {
  render: (args) => (
    <div style={{ position: "relative", width: "100%", height: "500px" }}>
      <AmbientField {...args} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(12px)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "2rem",
            maxWidth: "400px",
            color: "white",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>
            Sign In
          </h2>
          <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "1.5rem" }}>
            Welcome back! Enter your credentials to continue.
          </p>
          <input
            type="email"
            placeholder="Email"
            style={{
              width: "100%",
              padding: "0.75rem",
              marginBottom: "0.75rem",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              color: "white",
              outline: "none",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            style={{
              width: "100%",
              padding: "0.75rem",
              marginBottom: "1rem",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              color: "white",
              outline: "none",
            }}
          />
          <button
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "linear-gradient(to right, #00f0ff, #ff00aa)",
              border: "none",
              borderRadius: "8px",
              color: "black",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  ),
  args: {
    enablePoints: true,
    pointsCount: 2000,
  },
};

import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { AlertBeacon } from "./AlertBeacon";

const meta: Meta<typeof AlertBeacon> = {
  title: "Primitives/3D/Alerts/AlertBeacon",
  component: AlertBeacon,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    severity: {
      control: "select",
      options: ["info", "warning", "critical", "resolved"],
    },
    pulse: { control: "boolean" },
    ripples: { control: "boolean" },
    size: { control: { type: "range", min: 0.5, max: 3, step: 0.1 } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px", background: "#020410" }}>
        <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }}>
          <color attach="background" args={["#020410"]} />
          <fog attach="fog" args={["#020410", 8, 25]} />
          <ambientLight intensity={0.15} />
          <pointLight position={[5, 5, 5]} intensity={0.2} />
          <Stars
            radius={80}
            depth={50}
            count={1500}
            factor={3}
            saturation={0}
            fade
            speed={0.2}
          />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={10}
          />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AlertBeacon>;

export const Info: Story = {
  args: {
    severity: "info",
    label: "System Update",
    message: "Version 2.3 deployed",
  },
};

export const Warning: Story = {
  args: {
    severity: "warning",
    label: "High Memory",
    message: "Memory usage above 80%",
  },
};

export const Critical: Story = {
  args: {
    severity: "critical",
    label: "Service Down",
    message: "API gateway unreachable",
    ripples: true,
  },
};

export const Resolved: Story = {
  args: {
    severity: "resolved",
    label: "Recovered",
    message: "Service restored",
  },
};

function AllSeveritiesScene() {
  return (
    <group>
      <group position={[-3, 0, 0]}>
        <AlertBeacon
          severity="info"
          label="System Update"
          message="Version 2.3 deployed"
        />
      </group>
      <group position={[-1, 0, 0]}>
        <AlertBeacon
          severity="warning"
          label="High Memory"
          message="Memory usage above 80%"
        />
      </group>
      <group position={[1, 0, 0]}>
        <AlertBeacon
          severity="critical"
          label="Service Down"
          message="API gateway unreachable"
          ripples
        />
      </group>
      <group position={[3, 0, 0]}>
        <AlertBeacon
          severity="resolved"
          label="Recovered"
          message="Service restored"
        />
      </group>
    </group>
  );
}

export const AllSeverities: Story = {
  render: () => <AllSeveritiesScene />,
};

import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { ResourceMeter } from "./ResourceMeter";

const meta: Meta<typeof ResourceMeter> = {
  title: "Primitives/3D/Monitoring/ResourceMeter",
  component: ResourceMeter,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    size: { control: "select", options: ["sm", "md", "lg"] },
    animate: { control: "boolean" },
    showLabel: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px", background: "#020410" }}>
        <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
          <color attach="background" args={["#020410"]} />
          <fog attach="fog" args={["#020410", 8, 25]} />
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 5, 5]} intensity={0.4} color="#22D3EE" />
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
            minDistance={3}
            maxDistance={12}
          />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ResourceMeter>;

export const Default: Story = {
  args: {
    value: 65,
    label: "MEMORY",
    unit: "GB",
    maxValue: 8,
    currentValue: 5.2,
  },
};

export const Critical: Story = {
  args: {
    value: 94,
    label: "CPU",
    unit: "%",
    thresholds: { warn: 70, critical: 90 },
  },
};

export const Low: Story = {
  args: {
    value: 23,
    label: "DISK",
    unit: "%",
  },
};

function AllSizesScene() {
  return (
    <group>
      <group position={[-2, 0, 0]}>
        <ResourceMeter value={55} label="SM" unit="%" size="sm" />
      </group>
      <group position={[0, 0, 0]}>
        <ResourceMeter value={65} label="MD" unit="%" size="md" />
      </group>
      <group position={[2.5, 0, 0]}>
        <ResourceMeter value={75} label="LG" unit="%" size="lg" />
      </group>
    </group>
  );
}

export const AllSizes: Story = {
  render: () => <AllSizesScene />,
};

function DashboardScene() {
  return (
    <group>
      <group position={[-3.5, 0, 0]}>
        <ResourceMeter
          value={72}
          label="CPU"
          unit="%"
          thresholds={{ warn: 70, critical: 90 }}
        />
      </group>
      <group position={[-1.2, 0, 0]}>
        <ResourceMeter
          value={65}
          label="MEMORY"
          unit="GB"
          maxValue={8}
          currentValue={5.2}
        />
      </group>
      <group position={[1.2, 0, 0]}>
        <ResourceMeter value={38} label="GPU" unit="%" />
      </group>
      <group position={[3.5, 0, 0]}>
        <ResourceMeter value={45} label="DISK" unit="%" />
      </group>
    </group>
  );
}

export const Dashboard: Story = {
  render: () => <DashboardScene />,
};

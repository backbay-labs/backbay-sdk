import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as React from "react";
import { SecurityShield } from "./SecurityShield";
import type { ShieldStatus } from "./types";

const meta: Meta<typeof SecurityShield> = {
  title: "Primitives/3D/Security/SecurityShield",
  component: SecurityShield,
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "dark",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh", background: "#050812" }}>
        <Canvas
          camera={{ position: [0, 3, 6], fov: 50 }}
          dpr={[1, 2]}
        >
          <color attach="background" args={["#050812"]} />
          <fog attach="fog" args={["#050812", 5, 20]} />
          <Stars radius={50} depth={30} count={1000} factor={2} saturation={0} fade speed={0.5} />
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 5, 5]} intensity={0.5} color="#4060ff" />
          <pointLight position={[-5, 3, -5]} intensity={0.3} color="#ff0080" />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={3}
            maxDistance={15}
          />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SecurityShield>;

// -----------------------------------------------------------------------------
// Stories
// -----------------------------------------------------------------------------

export const Active: Story = {
  args: {
    level: 1,
    status: "active",
    threatsBlocked: 0,
    radius: 2,
    showStats: true,
  },
};

export const Warning: Story = {
  args: {
    level: 0.7,
    status: "warning",
    threatsBlocked: 3,
    radius: 2,
    showStats: true,
  },
};

export const Breach: Story = {
  args: {
    level: 0.3,
    status: "breach",
    threatsBlocked: 15,
    radius: 2,
    showStats: true,
  },
};

export const Offline: Story = {
  args: {
    level: 0,
    status: "offline",
    threatsBlocked: 0,
    radius: 2,
    showStats: true,
  },
};

export const LowProtection: Story = {
  args: {
    level: 0.25,
    status: "active",
    threatsBlocked: 0,
    radius: 2,
    showStats: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Shield at 25% protection level - opacity and glow scale with level",
      },
    },
  },
};

export const NoHoneycomb: Story = {
  args: {
    level: 1,
    status: "active",
    threatsBlocked: 0,
    radius: 2,
    showStats: true,
    showHoneycomb: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Shield without honeycomb pattern overlay for performance or aesthetic reasons",
      },
    },
  },
};

export const LargeShield: Story = {
  args: {
    level: 0.9,
    status: "active",
    threatsBlocked: 5,
    radius: 3.5,
    showStats: true,
  },
};

// -----------------------------------------------------------------------------
// Interactive Demo
// -----------------------------------------------------------------------------

function InteractiveDemo() {
  const [level, setLevel] = React.useState(1);
  const [status, setStatus] = React.useState<ShieldStatus>("active");
  const [threatsBlocked, setThreatsBlocked] = React.useState(0);

  const simulateThreat = () => {
    setThreatsBlocked((t) => t + 1);
    // Temporarily reduce level when threat blocked
    setLevel((l) => Math.max(0.3, l - 0.05));
    setTimeout(() => setLevel((l) => Math.min(1, l + 0.05)), 500);
  };

  const cycleStatus = () => {
    const statuses: ShieldStatus[] = ["active", "warning", "breach", "offline"];
    const currentIndex = statuses.indexOf(status);
    setStatus(statuses[(currentIndex + 1) % statuses.length]);
  };

  return (
    <>
      <SecurityShield
        level={level}
        status={status}
        threatsBlocked={threatsBlocked}
        radius={2}
        showStats={true}
        onClick={cycleStatus}
      />
      {/* Control panel using Html would go here in a real implementation */}
      <mesh
        position={[-3, 0.5, 0]}
        onClick={simulateThreat}
      >
        <boxGeometry args={[0.8, 0.3, 0.1]} />
        <meshStandardMaterial color="#ff4444" emissive="#ff0000" emissiveIntensity={0.3} />
      </mesh>
      <mesh
        position={[3, 0.5, 0]}
        onClick={cycleStatus}
      >
        <boxGeometry args={[0.8, 0.3, 0.1]} />
        <meshStandardMaterial color="#4444ff" emissive="#0000ff" emissiveIntensity={0.3} />
      </mesh>
    </>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Click the red box to simulate blocking a threat. Click the blue box or the shield to cycle through statuses.",
      },
    },
  },
};

// -----------------------------------------------------------------------------
// Multiple Shields
// -----------------------------------------------------------------------------

function MultipleShieldsDemo() {
  const [threats, setThreats] = React.useState([0, 0, 0]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * 3);
      setThreats((t) => {
        const newT = [...t];
        newT[idx] = newT[idx] + 1;
        return newT;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <SecurityShield
        level={0.95}
        status="active"
        threatsBlocked={threats[0]}
        radius={1.2}
        position={[-3, 0, 0]}
        showStats={true}
      />
      <SecurityShield
        level={0.6}
        status="warning"
        threatsBlocked={threats[1]}
        radius={1.2}
        position={[0, 0, 0]}
        showStats={true}
      />
      <SecurityShield
        level={0.2}
        status="breach"
        threatsBlocked={threats[2]}
        radius={1.2}
        position={[3, 0, 0]}
        showStats={true}
      />
    </>
  );
}

export const MultipleShields: Story = {
  render: () => <MultipleShieldsDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Multiple shields showing different statuses with automatic threat simulation every 2 seconds.",
      },
    },
  },
};

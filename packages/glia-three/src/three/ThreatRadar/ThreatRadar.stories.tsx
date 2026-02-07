import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { ThreatRadar } from "./ThreatRadar";
import type { Threat, ThreatType } from "./types";
import { useEffect, useState } from "react";

const meta: Meta<typeof ThreatRadar> = {
  title: "Primitives/3D/Security/ThreatRadar",
  component: ThreatRadar,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    scanSpeed: {
      control: { type: "range", min: 0.1, max: 2, step: 0.1 },
    },
    radius: {
      control: { type: "range", min: 1, max: 6, step: 0.5 },
    },
    showLabels: {
      control: "boolean",
    },
    showStats: {
      control: "boolean",
    },
    enableGlow: {
      control: "boolean",
    },
    sweepColor: {
      control: "color",
    },
    gridColor: {
      control: "color",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px", background: "#030806" }}>
        <Canvas camera={{ position: [0, 5, 6], fov: 50 }}>
          <color attach="background" args={["#030806"]} />
          <fog attach="fog" args={["#030806", 8, 25]} />
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.3} color="#00ff66" />
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
            minDistance={4}
            maxDistance={15}
          />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ThreatRadar>;

// Helper to create random threats
function createThreat(
  id: string,
  type: ThreatType,
  severity: number,
  active: boolean = false
): Threat {
  return {
    id,
    angle: Math.random() * Math.PI * 2,
    distance: 0.2 + Math.random() * 0.7,
    severity,
    type,
    active,
  };
}

// Static threat data
const staticThreats: Threat[] = [
  {
    id: "t1",
    angle: Math.PI * 0.25,
    distance: 0.7,
    severity: 0.9,
    type: "malware",
    active: true,
  },
  {
    id: "t2",
    angle: Math.PI * 0.8,
    distance: 0.4,
    severity: 0.6,
    type: "intrusion",
    active: false,
  },
  {
    id: "t3",
    angle: Math.PI * 1.3,
    distance: 0.85,
    severity: 0.3,
    type: "anomaly",
    active: false,
  },
  {
    id: "t4",
    angle: Math.PI * 1.7,
    distance: 0.55,
    severity: 0.8,
    type: "ddos",
    active: true,
  },
  {
    id: "t5",
    angle: Math.PI * 0.1,
    distance: 0.3,
    severity: 0.5,
    type: "phishing",
    active: false,
  },
];

// Mixed severity threats
const mixedThreats: Threat[] = [
  createThreat("m1", "malware", 0.95, true),
  createThreat("m2", "intrusion", 0.7, true),
  createThreat("m3", "anomaly", 0.4, false),
  createThreat("m4", "ddos", 0.85, true),
  createThreat("m5", "phishing", 0.3, false),
  createThreat("m6", "malware", 0.5, false),
  createThreat("m7", "intrusion", 0.2, false),
  createThreat("m8", "anomaly", 0.6, false),
];

// High alert scenario
const criticalThreats: Threat[] = [
  {
    id: "c1",
    angle: Math.PI * 0.3,
    distance: 0.2,
    severity: 1.0,
    type: "malware",
    active: true,
  },
  {
    id: "c2",
    angle: Math.PI * 0.6,
    distance: 0.35,
    severity: 0.95,
    type: "ddos",
    active: true,
  },
  {
    id: "c3",
    angle: Math.PI * 0.9,
    distance: 0.15,
    severity: 0.9,
    type: "intrusion",
    active: true,
  },
  {
    id: "c4",
    angle: Math.PI * 1.2,
    distance: 0.4,
    severity: 0.85,
    type: "malware",
    active: true,
  },
  {
    id: "c5",
    angle: Math.PI * 1.5,
    distance: 0.25,
    severity: 0.92,
    type: "ddos",
    active: true,
  },
];

// Perimeter threats (all at edge)
const perimeterThreats: Threat[] = Array.from({ length: 8 }, (_, i) => ({
  id: `p${i}`,
  angle: (i / 8) * Math.PI * 2,
  distance: 0.85 + Math.random() * 0.1,
  severity: 0.3 + Math.random() * 0.4,
  type: ["malware", "intrusion", "anomaly", "ddos", "phishing"][
    i % 5
  ] as ThreatType,
  active: i % 3 === 0,
}));

export const Default: Story = {
  args: {
    threats: staticThreats,
    scanSpeed: 0.5,
    radius: 3,
    showLabels: false,
    showStats: true,
    enableGlow: true,
    sweepColor: "#00ff66",
    gridColor: "#00ff44",
  },
};

export const WithLabels: Story = {
  args: {
    threats: staticThreats,
    scanSpeed: 0.5,
    radius: 3,
    showLabels: true,
    showStats: true,
  },
};

export const CriticalAlert: Story = {
  args: {
    threats: criticalThreats,
    scanSpeed: 0.8,
    radius: 3,
    showLabels: true,
    sweepColor: "#ff3344",
    gridColor: "#ff4444",
  },
};

export const SlowScan: Story = {
  args: {
    threats: mixedThreats,
    scanSpeed: 0.2,
    radius: 3,
    showStats: true,
  },
};

export const FastScan: Story = {
  args: {
    threats: mixedThreats,
    scanSpeed: 1.5,
    radius: 3,
    showStats: true,
  },
};

export const LargeRadius: Story = {
  args: {
    threats: perimeterThreats,
    scanSpeed: 0.3,
    radius: 5,
    showLabels: false,
    sweepColor: "#00ccff",
    gridColor: "#0088ff",
  },
};

export const PerimeterScan: Story = {
  args: {
    threats: perimeterThreats,
    scanSpeed: 0.4,
    radius: 4,
    showLabels: true,
  },
};

export const MinimalUI: Story = {
  args: {
    threats: staticThreats,
    scanSpeed: 0.5,
    radius: 3,
    showLabels: false,
    showStats: false,
    enableGlow: false,
  },
};

export const CyberPunk: Story = {
  args: {
    threats: mixedThreats,
    scanSpeed: 0.6,
    radius: 3.5,
    showLabels: true,
    sweepColor: "#ff00ff",
    gridColor: "#cc00ff",
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px", background: "#0a0015" }}>
        <Canvas camera={{ position: [0, 5, 6], fov: 50 }}>
          <color attach="background" args={["#0a0015"]} />
          <fog attach="fog" args={["#0a0015", 8, 25]} />
          <ambientLight intensity={0.15} />
          <pointLight position={[10, 10, 10]} intensity={0.4} color="#ff00ff" />
          <pointLight position={[-10, 5, -10]} intensity={0.3} color="#00ffff" />
          <Stars
            radius={80}
            depth={50}
            count={2000}
            factor={4}
            saturation={0.5}
            fade
            speed={0.3}
          />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={4}
            maxDistance={15}
          />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export const MilitaryGreen: Story = {
  args: {
    threats: staticThreats,
    scanSpeed: 0.4,
    radius: 3,
    showLabels: true,
    sweepColor: "#88ff00",
    gridColor: "#66cc00",
  },
};

// Interactive story with dynamic threats
function DynamicThreatsDemo() {
  const [threats, setThreats] = useState<Threat[]>(staticThreats);
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);

  // Simulate new threats appearing
  useEffect(() => {
    const interval = setInterval(() => {
      setThreats((prev) => {
        // Randomly add or remove threats
        if (Math.random() > 0.5 && prev.length < 12) {
          const types: ThreatType[] = [
            "malware",
            "intrusion",
            "anomaly",
            "ddos",
            "phishing",
          ];
          const newThreat: Threat = {
            id: `dynamic-${Date.now()}`,
            angle: Math.random() * Math.PI * 2,
            distance: 0.9,
            severity: 0.3 + Math.random() * 0.7,
            type: types[Math.floor(Math.random() * types.length)],
            active: Math.random() > 0.6,
          };
          return [...prev, newThreat];
        } else if (prev.length > 3) {
          // Move threats closer or remove them
          return prev
            .map((t) => ({
              ...t,
              distance: Math.max(0.1, t.distance - 0.05 * Math.random()),
              angle: t.angle + (Math.random() - 0.5) * 0.1,
            }))
            .filter((t) => t.distance > 0.1 || Math.random() > 0.3);
        }
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <ThreatRadar
        threats={threats}
        scanSpeed={0.5}
        radius={3}
        showLabels={true}
        onThreatClick={setSelectedThreat}
      />
      {selectedThreat && (
        <group position={[4, 2, 0]}>
          {/* Could add a detail panel here */}
        </group>
      )}
    </>
  );
}

export const DynamicThreats: Story = {
  render: () => <DynamicThreatsDemo />,
};

// Empty state
export const NoThreats: Story = {
  args: {
    threats: [],
    scanSpeed: 0.5,
    radius: 3,
    showStats: true,
  },
};

// Single critical threat
export const SingleThreat: Story = {
  args: {
    threats: [
      {
        id: "single",
        angle: Math.PI * 0.5,
        distance: 0.5,
        severity: 1.0,
        type: "malware",
        active: true,
      },
    ],
    scanSpeed: 0.6,
    radius: 3,
    showLabels: true,
  },
};

// Angled view for embedding
export const AngledView: Story = {
  args: {
    threats: mixedThreats,
    scanSpeed: 0.5,
    radius: 3,
    rotation: [-Math.PI / 6, 0, 0],
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px", background: "#030806" }}>
        <Canvas camera={{ position: [0, 3, 8], fov: 45 }}>
          <color attach="background" args={["#030806"]} />
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.3} color="#00ff66" />
          <OrbitControls enableDamping dampingFactor={0.05} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as React from "react";
import { SecurityDashboard } from "./SecurityDashboard";
import type {
  DashboardThreat,
  DashboardAuditEvent,
  DashboardLayout,
} from "./types";

const meta: Meta<typeof SecurityDashboard> = {
  title: "Primitives/3D/Security/SecurityDashboard",
  component: SecurityDashboard,
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "dark",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh", background: "#030812" }}>
        <Canvas
          camera={{ position: [0, 8, 14], fov: 50 }}
          dpr={[1, 2]}
        >
          <color attach="background" args={["#030812"]} />
          <fog attach="fog" args={["#030812", 10, 40]} />
          <Stars
            radius={60}
            depth={40}
            count={1500}
            factor={3}
            saturation={0.2}
            fade
            speed={0.3}
          />
          <ambientLight intensity={0.25} />
          <pointLight position={[10, 10, 10]} intensity={0.4} color="#4080ff" />
          <pointLight position={[-10, 5, -10]} intensity={0.3} color="#ff4080" />
          <pointLight position={[0, -5, 5]} intensity={0.2} color="#40ff80" />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={30}
            maxPolarAngle={Math.PI / 2.2}
          />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SecurityDashboard>;

// -----------------------------------------------------------------------------
// Sample Data Generators
// -----------------------------------------------------------------------------

function generateThreats(count: number, activeRatio: number = 0.3): DashboardThreat[] {
  const types: DashboardThreat["type"][] = [
    "malware",
    "intrusion",
    "anomaly",
    "ddos",
    "phishing",
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: `threat-${i}`,
    angle: (i / count) * Math.PI * 2 + Math.random() * 0.3,
    distance: 0.3 + Math.random() * 0.6,
    severity: 0.2 + Math.random() * 0.8,
    type: types[Math.floor(Math.random() * types.length)],
    active: Math.random() < activeRatio,
    label: `Threat ${i + 1}`,
  }));
}

function generateAuditEvents(count: number): DashboardAuditEvent[] {
  const types: DashboardAuditEvent["type"][] = [
    "login",
    "logout",
    "access",
    "modify",
    "delete",
    "error",
    "alert",
  ];
  const severities: DashboardAuditEvent["severity"][] = [
    "info",
    "info",
    "info",
    "warning",
    "error",
    "critical",
  ];
  const actors = ["admin", "user1", "system", "api-service", "backup-agent"];
  const resources = [
    "/api/users",
    "/config/security",
    "/data/records",
    "/auth/tokens",
    "/logs/system",
  ];
  const actions = [
    "read data",
    "update config",
    "delete record",
    "authenticate",
    "export report",
  ];

  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `event-${i}`,
    timestamp: new Date(now - (count - i) * 60000),
    type: types[Math.floor(Math.random() * types.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    actor: actors[Math.floor(Math.random() * actors.length)],
    resource: resources[Math.floor(Math.random() * resources.length)],
    action: actions[Math.floor(Math.random() * actions.length)],
    success: Math.random() > 0.15,
  }));
}

// -----------------------------------------------------------------------------
// Stories
// -----------------------------------------------------------------------------

export const CommandLayout: Story = {
  args: {
    shield: {
      level: 0.92,
      status: "active",
      threatsBlocked: 7,
    },
    threats: generateThreats(8, 0.25),
    auditEvents: generateAuditEvents(12),
    layout: "command",
    animated: true,
    showConnections: true,
    showStatusHUD: true,
    theme: "cyber",
  },
};

export const MonitoringLayout: Story = {
  args: {
    shield: {
      level: 0.75,
      status: "warning",
      threatsBlocked: 15,
    },
    threats: generateThreats(12, 0.4),
    auditEvents: generateAuditEvents(15),
    layout: "monitoring",
    animated: true,
    theme: "cyber",
  },
};

export const CompactLayout: Story = {
  args: {
    shield: {
      level: 0.6,
      status: "warning",
      threatsBlocked: 3,
    },
    threats: generateThreats(5, 0.2),
    auditEvents: generateAuditEvents(8),
    layout: "compact",
    animated: true,
    theme: "cyber",
  },
};

export const UnderAttack: Story = {
  args: {
    shield: {
      level: 0.35,
      status: "breach",
      threatsBlocked: 42,
    },
    threats: generateThreats(15, 0.7),
    auditEvents: [
      ...generateAuditEvents(10),
      {
        id: "attack-1",
        timestamp: new Date(),
        type: "alert",
        severity: "critical",
        actor: "intrusion-detection",
        resource: "/system/core",
        action: "detected breach attempt",
        success: false,
      },
      {
        id: "attack-2",
        timestamp: new Date(),
        type: "error",
        severity: "critical",
        actor: "firewall",
        resource: "/network/perimeter",
        action: "blocking mass intrusion",
        success: true,
      },
    ],
    layout: "command",
    animated: true,
    theme: "cyber",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Security dashboard during an active breach with multiple threats and critical events.",
      },
    },
  },
};

export const Secure: Story = {
  args: {
    shield: {
      level: 1.0,
      status: "active",
      threatsBlocked: 0,
    },
    threats: [],
    auditEvents: generateAuditEvents(8).map((e) => ({
      ...e,
      severity: "info" as const,
      success: true,
    })),
    layout: "command",
    animated: true,
    theme: "matrix",
  },
  parameters: {
    docs: {
      description: {
        story: "Fully secure system with no active threats and all events successful.",
      },
    },
  },
};

export const Offline: Story = {
  args: {
    shield: {
      level: 0,
      status: "offline",
      threatsBlocked: 0,
    },
    threats: [],
    auditEvents: [
      {
        id: "offline-1",
        timestamp: new Date(),
        type: "error",
        severity: "critical",
        actor: "system",
        resource: "/security/shield",
        action: "shield went offline",
        success: false,
      },
    ],
    layout: "command",
    animated: false,
    theme: "terminal",
  },
};

export const MatrixTheme: Story = {
  args: {
    shield: {
      level: 0.88,
      status: "active",
      threatsBlocked: 5,
    },
    threats: generateThreats(6, 0.3),
    auditEvents: generateAuditEvents(10),
    layout: "command",
    animated: true,
    theme: "matrix",
  },
};

export const NeonTheme: Story = {
  args: {
    shield: {
      level: 0.7,
      status: "warning",
      threatsBlocked: 8,
    },
    threats: generateThreats(9, 0.35),
    auditEvents: generateAuditEvents(12),
    layout: "monitoring",
    animated: true,
    theme: "neon",
  },
};

export const TerminalTheme: Story = {
  args: {
    shield: {
      level: 0.95,
      status: "active",
      threatsBlocked: 2,
    },
    threats: generateThreats(4, 0.2),
    auditEvents: generateAuditEvents(10),
    layout: "compact",
    animated: true,
    theme: "terminal",
  },
};

// -----------------------------------------------------------------------------
// Interactive Demo
// -----------------------------------------------------------------------------

function InteractiveDemo() {
  const [shield, setShield] = React.useState({
    level: 0.85,
    status: "active" as const,
    threatsBlocked: 3,
  });
  const [threats, setThreats] = React.useState<DashboardThreat[]>(
    generateThreats(6, 0.25)
  );
  const [events, setEvents] = React.useState<DashboardAuditEvent[]>(
    generateAuditEvents(10)
  );
  const [layout, setLayout] = React.useState<DashboardLayout>("command");

  // Simulate threat activity
  React.useEffect(() => {
    const interval = setInterval(() => {
      // Randomly spawn or neutralize threats
      if (Math.random() > 0.6) {
        setThreats((prev) => {
          if (prev.length < 15 && Math.random() > 0.5) {
            // Add new threat
            const types: DashboardThreat["type"][] = [
              "malware",
              "intrusion",
              "anomaly",
              "ddos",
              "phishing",
            ];
            return [
              ...prev,
              {
                id: `threat-${Date.now()}`,
                angle: Math.random() * Math.PI * 2,
                distance: 0.3 + Math.random() * 0.6,
                severity: 0.4 + Math.random() * 0.6,
                type: types[Math.floor(Math.random() * types.length)],
                active: true,
              },
            ];
          } else if (prev.length > 0) {
            // Remove a random threat
            const idx = Math.floor(Math.random() * prev.length);
            setShield((s) => ({
              ...s,
              threatsBlocked: s.threatsBlocked + 1,
              level: Math.min(1, s.level + 0.02),
            }));
            return prev.filter((_, i) => i !== idx);
          }
          return prev;
        });
      }

      // Add occasional events
      if (Math.random() > 0.7) {
        const types: DashboardAuditEvent["type"][] = [
          "access",
          "modify",
          "login",
          "alert",
        ];
        const severities: DashboardAuditEvent["severity"][] = [
          "info",
          "info",
          "warning",
          "error",
        ];
        setEvents((prev) => [
          ...prev.slice(-14),
          {
            id: `event-${Date.now()}`,
            timestamp: new Date(),
            type: types[Math.floor(Math.random() * types.length)],
            severity: severities[Math.floor(Math.random() * severities.length)],
            actor: "system",
            resource: "/security/monitor",
            action: "automated scan",
            success: Math.random() > 0.2,
          },
        ]);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Update shield based on threats
  React.useEffect(() => {
    const activeCount = threats.filter((t) => t.active).length;
    if (activeCount > 5) {
      setShield((s) => ({
        ...s,
        status: "breach",
        level: Math.max(0.2, s.level - 0.05),
      }));
    } else if (activeCount > 2) {
      setShield((s) => ({
        ...s,
        status: "warning",
        level: Math.max(0.4, Math.min(0.8, s.level)),
      }));
    } else {
      setShield((s) => ({
        ...s,
        status: "active",
        level: Math.min(1, s.level + 0.01),
      }));
    }
  }, [threats]);

  const handleLayoutCycle = () => {
    const layouts: DashboardLayout[] = ["command", "monitoring", "compact"];
    const currentIdx = layouts.indexOf(layout);
    setLayout(layouts[(currentIdx + 1) % layouts.length]);
  };

  return (
    <>
      <SecurityDashboard
        shield={shield}
        threats={threats}
        auditEvents={events}
        layout={layout}
        onShieldClick={handleLayoutCycle}
        onThreatClick={(t) => console.log("Threat clicked:", t)}
        onEventClick={(e) => console.log("Event clicked:", e)}
        animated={true}
        theme="cyber"
      />
    </>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Interactive demo with simulated threat activity. Click the shield to cycle through layouts. Threats spawn and are neutralized automatically.",
      },
    },
  },
};

// -----------------------------------------------------------------------------
// All Layouts Comparison
// -----------------------------------------------------------------------------

function LayoutComparison() {
  const baseShield = { level: 0.8, status: "active" as const, threatsBlocked: 5 };
  const baseThreats = generateThreats(6, 0.3);
  const baseEvents = generateAuditEvents(8);

  return (
    <>
      {/* Command - centered */}
      <group position={[0, 0, 0]}>
        <SecurityDashboard
          shield={baseShield}
          threats={baseThreats}
          auditEvents={baseEvents}
          layout="command"
          animated={true}
          theme="cyber"
        />
      </group>
    </>
  );
}

export const LayoutShowcase: Story = {
  render: () => <LayoutComparison />,
  parameters: {
    docs: {
      description: {
        story: "Demonstrates the command layout with full integration of all security components.",
      },
    },
  },
};

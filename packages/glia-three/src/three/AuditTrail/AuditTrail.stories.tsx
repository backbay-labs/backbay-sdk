import type { Meta, StoryObj } from "@storybook/react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as React from "react";
import { useEffect, useState } from "react";
import { AuditTrail } from "./AuditTrail";
import type { AuditEvent, AuditEventType, AuditSeverity } from "./types";

const meta: Meta<typeof AuditTrail> = {
  title: "Primitives/3D/Security/AuditTrail",
  component: AuditTrail,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  argTypes: {
    maxEvents: {
      control: { type: "range", min: 5, max: 30, step: 1 },
    },
    length: {
      control: { type: "range", min: 4, max: 16, step: 1 },
    },
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
    },
    theme: {
      control: "select",
      options: ["cyber", "matrix", "terminal", "neon"],
    },
    showDetails: {
      control: "boolean",
    },
    showSummary: {
      control: "boolean",
    },
    enableParticles: {
      control: "boolean",
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px", background: "#050810" }}>
        <Canvas camera={{ position: [0, 4, 10], fov: 50 }}>
          <color attach="background" args={["#050810"]} />
          <fog attach="fog" args={["#050810", 10, 30]} />
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={0.4} color="#00ccff" />
          <pointLight position={[-10, 5, -5]} intensity={0.3} color="#ff0088" />
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
type Story = StoryObj<typeof AuditTrail>;

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function createEvent(
  id: string,
  type: AuditEventType,
  severity: AuditSeverity,
  actor: string,
  resource: string,
  action: string,
  success: boolean = true,
  details?: string,
  parentId?: string
): AuditEvent {
  return {
    id,
    timestamp: new Date(Date.now() - Math.random() * 3600000), // Random time in last hour
    type,
    severity,
    actor,
    resource,
    action,
    success,
    details,
    parentId,
  };
}

function generateRandomEvent(id: string): AuditEvent {
  const types: AuditEventType[] = [
    "login",
    "logout",
    "access",
    "modify",
    "delete",
    "error",
    "alert",
  ];
  const severities: AuditSeverity[] = ["info", "warning", "error", "critical"];
  const actors = [
    "admin@corp.io",
    "system",
    "api-gateway",
    "user@example.com",
    "backup-service",
    "monitor-agent",
  ];
  const resources = [
    "/api/users",
    "/config/database",
    "/logs/access",
    "/auth/tokens",
    "/storage/files",
    "/admin/settings",
  ];
  const actions = [
    "Read configuration",
    "Update settings",
    "Delete record",
    "Create session",
    "Modify permissions",
    "Execute query",
  ];

  const type = types[Math.floor(Math.random() * types.length)];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const success = Math.random() > 0.15;

  return {
    id,
    timestamp: new Date(),
    type,
    severity,
    actor: actors[Math.floor(Math.random() * actors.length)],
    resource: resources[Math.floor(Math.random() * resources.length)],
    action: actions[Math.floor(Math.random() * actions.length)],
    success,
    details: success ? undefined : "Permission denied or resource unavailable",
  };
}

// -----------------------------------------------------------------------------
// Sample Data
// -----------------------------------------------------------------------------

const basicEvents: AuditEvent[] = [
  createEvent("e1", "login", "info", "admin@corp.io", "/auth/login", "User authenticated successfully"),
  createEvent("e2", "access", "info", "admin@corp.io", "/api/users", "Listed all users"),
  createEvent("e3", "modify", "warning", "admin@corp.io", "/config/database", "Updated connection pool size"),
  createEvent("e4", "access", "info", "api-gateway", "/api/health", "Health check passed"),
  createEvent("e5", "delete", "error", "user@example.com", "/storage/files/secret.txt", "Attempted unauthorized deletion", false, "Access denied: insufficient permissions"),
  createEvent("e6", "alert", "critical", "monitor-agent", "/system/cpu", "CPU usage exceeded 95%"),
  createEvent("e7", "modify", "info", "backup-service", "/storage/backups", "Created daily backup"),
  createEvent("e8", "logout", "info", "admin@corp.io", "/auth/logout", "Session terminated"),
];

const securityIncident: AuditEvent[] = [
  createEvent("s1", "login", "info", "attacker@malicious.io", "/auth/login", "Login attempt from unknown IP"),
  createEvent("s2", "access", "warning", "attacker@malicious.io", "/api/users", "Enumeration attempt detected"),
  createEvent("s3", "access", "error", "attacker@malicious.io", "/admin/settings", "Unauthorized access attempt", false),
  createEvent("s4", "alert", "critical", "firewall", "/security/ids", "Intrusion detection triggered"),
  createEvent("s5", "modify", "critical", "system", "/security/blocklist", "IP address blocked", true, "192.168.1.100 added to blocklist"),
  createEvent("s6", "access", "error", "attacker@malicious.io", "/api/tokens", "Rate limit exceeded", false),
  createEvent("s7", "alert", "critical", "monitor-agent", "/security/alerts", "Brute force attack detected"),
  createEvent("s8", "logout", "warning", "attacker@malicious.io", "/auth/session", "Session forcefully terminated"),
];

const normalOperations: AuditEvent[] = [
  createEvent("n1", "login", "info", "developer@corp.io", "/auth/login", "Developer login"),
  createEvent("n2", "access", "info", "developer@corp.io", "/api/repos", "Cloned repository"),
  createEvent("n3", "modify", "info", "developer@corp.io", "/api/branches", "Created feature branch"),
  createEvent("n4", "access", "info", "ci-runner", "/api/builds", "Build triggered"),
  createEvent("n5", "modify", "info", "ci-runner", "/api/artifacts", "Uploaded build artifacts"),
  createEvent("n6", "access", "info", "qa-tester@corp.io", "/api/tests", "Started test suite"),
  createEvent("n7", "modify", "warning", "qa-tester@corp.io", "/api/bugs", "Reported 3 new issues"),
  createEvent("n8", "logout", "info", "developer@corp.io", "/auth/logout", "Developer logout"),
];

const connectedEvents: AuditEvent[] = [
  createEvent("c1", "login", "info", "user@example.com", "/auth", "User logged in"),
  createEvent("c2", "access", "info", "user@example.com", "/files", "Accessed documents", true, undefined, "c1"),
  createEvent("c3", "modify", "warning", "user@example.com", "/files/report.pdf", "Modified sensitive document", true, undefined, "c2"),
  createEvent("c4", "delete", "error", "user@example.com", "/files/report.pdf", "Deletion blocked by policy", false, "Document retention policy active", "c3"),
  createEvent("c5", "alert", "critical", "dlp-agent", "/security/dlp", "Data loss prevention triggered", true, undefined, "c4"),
  createEvent("c6", "access", "warning", "security@corp.io", "/audit/review", "Incident reviewed", true, undefined, "c5"),
];

// -----------------------------------------------------------------------------
// Stories
// -----------------------------------------------------------------------------

export const Default: Story = {
  args: {
    events: basicEvents,
    maxEvents: 20,
    length: 10,
    orientation: "horizontal",
    theme: "cyber",
    showDetails: false,
    showSummary: true,
    enableParticles: true,
  },
};

export const Vertical: Story = {
  args: {
    events: basicEvents,
    maxEvents: 15,
    length: 8,
    orientation: "vertical",
    theme: "cyber",
    showSummary: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "700px", background: "#050810" }}>
        <Canvas camera={{ position: [6, 0, 8], fov: 50 }}>
          <color attach="background" args={["#050810"]} />
          <fog attach="fog" args={["#050810", 10, 30]} />
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

export const SecurityIncident: Story = {
  args: {
    events: securityIncident,
    maxEvents: 20,
    length: 10,
    orientation: "horizontal",
    theme: "neon",
    showDetails: false,
    showSummary: true,
    enableParticles: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px", background: "#0a0012" }}>
        <Canvas camera={{ position: [0, 4, 10], fov: 50 }}>
          <color attach="background" args={["#0a0012"]} />
          <fog attach="fog" args={["#0a0012", 10, 30]} />
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.5} color="#ff00ff" />
          <pointLight position={[-10, 5, -5]} intensity={0.4} color="#ff0066" />
          <Stars radius={60} depth={40} count={1500} factor={4} saturation={0.5} fade speed={0.4} />
          <OrbitControls enableDamping dampingFactor={0.05} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export const MatrixTheme: Story = {
  args: {
    events: normalOperations,
    maxEvents: 20,
    length: 10,
    orientation: "horizontal",
    theme: "matrix",
    showSummary: true,
    enableParticles: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px", background: "#000a00" }}>
        <Canvas camera={{ position: [0, 4, 10], fov: 50 }}>
          <color attach="background" args={["#000a00"]} />
          <fog attach="fog" args={["#000a00", 10, 30]} />
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.4} color="#00ff44" />
          <Stars radius={60} depth={40} count={1000} factor={2} fade speed={0.2} />
          <OrbitControls enableDamping dampingFactor={0.05} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export const TerminalTheme: Story = {
  args: {
    events: basicEvents,
    maxEvents: 20,
    length: 10,
    orientation: "horizontal",
    theme: "terminal",
    showSummary: true,
    enableParticles: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px", background: "#0a0800" }}>
        <Canvas camera={{ position: [0, 4, 10], fov: 50 }}>
          <color attach="background" args={["#0a0800"]} />
          <fog attach="fog" args={["#0a0800", 10, 30]} />
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.4} color="#ffaa00" />
          <pointLight position={[-10, 5, -5]} intensity={0.3} color="#ff6600" />
          <Stars radius={60} depth={40} count={800} factor={2} fade speed={0.2} />
          <OrbitControls enableDamping dampingFactor={0.05} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

export const WithConnections: Story = {
  args: {
    events: connectedEvents,
    maxEvents: 20,
    length: 10,
    orientation: "horizontal",
    theme: "cyber",
    showDetails: false,
    showSummary: true,
    enableParticles: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Events can have a parentId to show connections between related events.",
      },
    },
  },
};

export const ShowAllDetails: Story = {
  args: {
    events: basicEvents.slice(0, 5),
    maxEvents: 5,
    length: 8,
    orientation: "horizontal",
    theme: "cyber",
    showDetails: true,
    showSummary: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Set showDetails=true to always show event information.",
      },
    },
  },
};

export const MinimalUI: Story = {
  args: {
    events: basicEvents,
    maxEvents: 20,
    length: 10,
    orientation: "horizontal",
    theme: "cyber",
    showDetails: false,
    showSummary: false,
    enableParticles: false,
  },
};

export const Empty: Story = {
  args: {
    events: [],
    maxEvents: 20,
    length: 10,
    orientation: "horizontal",
    theme: "cyber",
    showSummary: true,
  },
};

// -----------------------------------------------------------------------------
// Interactive Stories
// -----------------------------------------------------------------------------

function LiveStreamDemo() {
  const [events, setEvents] = useState<AuditEvent[]>(basicEvents.slice(0, 3));
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prev) => {
        const newEvent = generateRandomEvent(`live-${Date.now()}`);
        return [...prev.slice(-14), newEvent]; // Keep last 15 events
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <AuditTrail
        events={events}
        maxEvents={15}
        length={10}
        orientation="horizontal"
        theme="cyber"
        showSummary={true}
        enableParticles={true}
        onEventClick={setSelectedEvent}
      />
      {selectedEvent && (
        <mesh position={[0, -2, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} />
        </mesh>
      )}
    </>
  );
}

export const LiveStream: Story = {
  render: () => <LiveStreamDemo />,
  parameters: {
    docs: {
      description: {
        story: "Simulates a live stream of audit events being added every 2.5 seconds.",
      },
    },
  },
};

function MultipleTrailsDemo() {
  const [webEvents, setWebEvents] = useState<AuditEvent[]>(basicEvents.slice(0, 4));
  const [apiEvents, setApiEvents] = useState<AuditEvent[]>(securityIncident.slice(0, 4));
  const [dbEvents, setDbEvents] = useState<AuditEvent[]>(normalOperations.slice(0, 4));

  useEffect(() => {
    const interval = setInterval(() => {
      const target = Math.floor(Math.random() * 3);
      const newEvent = generateRandomEvent(`multi-${Date.now()}`);

      if (target === 0) {
        setWebEvents((prev) => [...prev.slice(-6), { ...newEvent, resource: `/web${newEvent.resource}` }]);
      } else if (target === 1) {
        setApiEvents((prev) => [...prev.slice(-6), { ...newEvent, resource: `/api${newEvent.resource}` }]);
      } else {
        setDbEvents((prev) => [...prev.slice(-6), { ...newEvent, resource: `/db${newEvent.resource}` }]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <AuditTrail
        events={webEvents}
        maxEvents={8}
        length={5}
        position={[0, 2, 0]}
        orientation="horizontal"
        theme="cyber"
        showSummary={false}
        enableParticles={true}
      />
      <AuditTrail
        events={apiEvents}
        maxEvents={8}
        length={5}
        position={[0, 0, 0]}
        orientation="horizontal"
        theme="neon"
        showSummary={false}
        enableParticles={true}
      />
      <AuditTrail
        events={dbEvents}
        maxEvents={8}
        length={5}
        position={[0, -2, 0]}
        orientation="horizontal"
        theme="matrix"
        showSummary={false}
        enableParticles={true}
      />
    </>
  );
}

export const MultipleTrails: Story = {
  render: () => <MultipleTrailsDemo />,
  parameters: {
    docs: {
      description: {
        story: "Multiple audit trails showing different systems (web, API, database) with different themes.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "700px", background: "#030308" }}>
        <Canvas camera={{ position: [0, 0, 14], fov: 50 }}>
          <color attach="background" args={["#030308"]} />
          <fog attach="fog" args={["#030308", 12, 35]} />
          <ambientLight intensity={0.25} />
          <pointLight position={[10, 10, 10]} intensity={0.3} color="#ffffff" />
          <Stars radius={70} depth={50} count={1500} factor={3} fade speed={0.3} />
          <OrbitControls enableDamping dampingFactor={0.05} minDistance={6} maxDistance={25} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

function AngledViewDemo() {
  return (
    <AuditTrail
      events={securityIncident}
      maxEvents={12}
      length={8}
      orientation="horizontal"
      theme="cyber"
      showSummary={true}
      enableParticles={true}
      rotation={[-Math.PI / 8, 0, 0]}
    />
  );
}

export const AngledView: Story = {
  render: () => <AngledViewDemo />,
  parameters: {
    docs: {
      description: {
        story: "Audit trail with a slight rotation for embedding in dashboard layouts.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "600px", background: "#050810" }}>
        <Canvas camera={{ position: [0, 2, 10], fov: 45 }}>
          <color attach="background" args={["#050810"]} />
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={0.4} color="#00ccff" />
          <OrbitControls enableDamping dampingFactor={0.05} />
          <Story />
        </Canvas>
      </div>
    ),
  ],
};

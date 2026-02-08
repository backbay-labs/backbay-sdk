import type { Meta, StoryObj } from "@storybook/react-vite";
import { RiverView } from "./RiverView";
import type { RiverAction, PolicySegment, CausalLink, CausalLinkType } from "./types";
import type { SignalData } from "./SignalFlare";
import type { IncidentData } from "./IncidentVortex";
import type { DetectorData } from "./DetectorTower";

// =============================================================================
// META
// =============================================================================

const meta: Meta<typeof RiverView> = {
  title: "Primitives/3D/Forensics/RiverView",
  component: RiverView,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RiverView>;

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

const AGENTS = [
  { id: "agent-alpha", label: "Alpha", color: "#22D3EE" },
  { id: "agent-beta", label: "Beta", color: "#F43F5E" },
  { id: "agent-gamma", label: "Gamma", color: "#10B981" },
];

const TIME_START = 0;
const TIME_END = 60_000; // 60 seconds

const ACTION_KINDS = ["fs", "network", "exec", "codepatch", "query", "message"] as const;
const POLICY_STATUSES = ["allowed", "denied", "exception", "uncovered", "approval-required"] as const;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateActions(
  count: number,
  agents: Array<{ id: string }>,
  start: number,
  end: number,
  seed = 42,
): RiverAction[] {
  const rng = seededRandom(seed);
  const actions: RiverAction[] = [];
  const labels: Record<string, string[]> = {
    fs: ["read config.yaml", "write /tmp/out.log", "stat /etc/passwd", "mkdir /var/cache", "unlink temp.db", "read credentials.json"],
    network: ["GET /api/users", "POST /auth/token", "DNS resolve db.internal", "TCP connect 10.0.0.5:5432", "WSS upgrade /stream", "PUT /data/upload"],
    exec: ["spawn python3 task.py", "exec bash -c deploy.sh", "fork worker-12", "kill -9 stale-proc", "run migration.sql", "invoke lambda fn"],
    codepatch: ["patch auth.ts:42", "hotfix rate-limiter", "inject middleware", "update schema v3", "rollback migration", "apply diff #291"],
    query: ["SELECT * FROM users", "EXPLAIN ANALYZE orders", "CREATE INDEX idx_ts", "DROP TABLE temp_logs", "INSERT INTO audit", "COUNT events"],
    message: ["notify #ops channel", "alert on-call team", "send summary email", "publish event.done", "broadcast heartbeat", "log audit trail"],
  };

  for (let i = 0; i < count; i++) {
    const kindIdx = Math.floor(rng() * ACTION_KINDS.length);
    const kind = ACTION_KINDS[kindIdx];
    const agentIdx = Math.floor(rng() * agents.length);
    const riskScore = rng();
    const policyIdx = riskScore > 0.7
      ? (rng() > 0.5 ? 1 : 2) // denied or exception for risky
      : Math.floor(rng() * POLICY_STATUSES.length);

    const kindLabels = labels[kind];
    const label = kindLabels[Math.floor(rng() * kindLabels.length)];

    actions.push({
      id: `action-${i}`,
      kind,
      label,
      agentId: agents[agentIdx].id,
      timestamp: start + rng() * (end - start),
      duration: Math.floor(rng() * 5000) + 100,
      policyStatus: POLICY_STATUSES[policyIdx],
      riskScore,
      noveltyScore: rng(),
      blastRadius: rng(),
      consequence: riskScore > 0.6
        ? `Impact: ${Math.round(riskScore * 100)}% risk score — ${kind === "exec" ? "arbitrary code execution" : kind === "fs" ? "sensitive file access" : kind === "network" ? "external data exfiltration" : "policy violation"}`
        : undefined,
      predecessors: i > 0 && rng() > 0.6 ? [`action-${i - 1}`] : undefined,
      successors: [],
    });
  }

  // Sort by timestamp for consistent display
  actions.sort((a, b) => a.timestamp - b.timestamp);
  return actions;
}

function generatePolicies(): PolicySegment[] {
  return [
    { id: "pol-1", label: "Network Egress", startT: 0.0, endT: 0.25, side: "both", type: "hard-deny" },
    { id: "pol-2", label: "FS Read-Only", startT: 0.2, endT: 0.5, side: "left", type: "soft" },
    { id: "pol-3", label: "Exec Sandbox", startT: 0.45, endT: 0.75, side: "right", type: "hard-deny" },
    { id: "pol-4", label: "Audit Zone", startT: 0.7, endT: 0.9, side: "both", type: "record-only" },
    { id: "pol-gap", label: "UNCOVERED", startT: 0.9, endT: 1.0, side: "both", type: "soft", coverageGap: true },
  ];
}

function generateCausalLinks(actions: RiverAction[], count: number, seed = 99): CausalLink[] {
  const rng = seededRandom(seed);
  const linkTypes: CausalLinkType[] = ["direct", "indirect", "temporal"];
  const links: CausalLink[] = [];
  for (let i = 0; i < count && i < actions.length - 1; i++) {
    const fromIdx = Math.floor(rng() * (actions.length - 1));
    const toIdx = fromIdx + 1 + Math.floor(rng() * Math.min(3, actions.length - fromIdx - 1));
    if (toIdx < actions.length) {
      links.push({
        fromId: actions[fromIdx].id,
        toId: actions[toIdx].id,
        strength: 0.3 + rng() * 0.7,
        type: linkTypes[Math.floor(rng() * linkTypes.length)],
      });
    }
  }
  return links;
}

function generateSignals(actions: RiverAction[], count: number, seed = 77): SignalData[] {
  const rng = seededRandom(seed);
  const signalTypes = ["novelty", "risk", "coverage-gap", "anomaly", "behavioral"] as const;
  const signals: SignalData[] = [];

  // Pick high-risk actions for signals
  const riskyActions = actions
    .filter((a) => a.riskScore > 0.5)
    .slice(0, count);

  for (let i = 0; i < riskyActions.length; i++) {
    const action = riskyActions[i];
    signals.push({
      id: `signal-${i}`,
      type: signalTypes[Math.floor(rng() * signalTypes.length)],
      score: 0.4 + rng() * 0.6,
      label: `Signal on ${action.label}`,
      actionId: action.id,
      detectorId: `detector-${Math.floor(rng() * 4)}`,
    });
  }

  return signals;
}

function generateIncidents(actions: RiverAction[]): IncidentData[] {
  const riskyActionIds = actions.filter((a) => a.riskScore > 0.7).map((a) => a.id);
  return [
    {
      id: "incident-1",
      label: "Privilege Escalation",
      severity: "critical",
      actionIds: riskyActionIds.slice(0, 3),
      position: [-3, 0.3, 1.5],
    },
    {
      id: "incident-2",
      label: "Data Exfiltration",
      severity: "high",
      actionIds: riskyActionIds.slice(3, 5),
      position: [2, 0.3, -1.2],
    },
    {
      id: "incident-3",
      label: "Anomalous Query Spike",
      severity: "medium",
      actionIds: riskyActionIds.slice(5, 7),
      position: [5, 0.3, 0.8],
    },
  ];
}

function generateDetectors(): DetectorData[] {
  return [
    { id: "detector-0", label: "Heuristic Scanner", type: "heuristic", position: [-5, 0, 2.5], active: true, signalCount: 3 },
    { id: "detector-1", label: "ML Anomaly Model", type: "model", position: [-1, 0, -2.5], active: true, signalCount: 5 },
    { id: "detector-2", label: "Signature DB", type: "signature", position: [3, 0, 2.5], active: false, signalCount: 0 },
    { id: "detector-3", label: "Behavior Monitor", type: "behavioral", position: [6, 0, -2.5], active: true, signalCount: 2 },
  ];
}

// =============================================================================
// PRE-BUILT DATASETS
// =============================================================================

const defaultActions = generateActions(45, AGENTS, TIME_START, TIME_END);
const defaultPolicies = generatePolicies();
const defaultCausalLinks = generateCausalLinks(defaultActions, 10);
const defaultSignals = generateSignals(defaultActions, 8);
const defaultIncidents = generateIncidents(defaultActions);
const defaultDetectors = generateDetectors();

// =============================================================================
// STORIES
// =============================================================================

/** Full scene with 3 agents, 45 actions, policies, signals, incidents, detectors, and causal links. */
export const Default: Story = {
  args: {
    actions: defaultActions,
    agents: AGENTS,
    policies: defaultPolicies,
    signals: defaultSignals,
    incidents: defaultIncidents,
    detectors: defaultDetectors,
    causalLinks: defaultCausalLinks,
    timeRange: [TIME_START, TIME_END],
    initialTime: TIME_END,
  },
};

/** Auto-playing replay from start — simulates a live forensic walkthrough. */
export const LiveReplay: Story = {
  args: {
    actions: defaultActions,
    agents: AGENTS,
    policies: defaultPolicies,
    signals: defaultSignals,
    incidents: defaultIncidents,
    detectors: defaultDetectors,
    causalLinks: defaultCausalLinks,
    timeRange: [TIME_START, TIME_END],
    autoPlay: true,
  },
};

/** Security incident scenario: attacker agent doing high-risk fs/exec/network actions. */
export const SecurityIncident: Story = {
  args: {
    actions: [
      { id: "atk-1", kind: "network", label: "DNS exfil probe", agentId: "agent-attacker", timestamp: 2000, policyStatus: "denied", riskScore: 0.95, noveltyScore: 0.9, blastRadius: 0.7, consequence: "Attempted DNS tunneling to external C2" },
      { id: "atk-2", kind: "fs", label: "read /etc/shadow", agentId: "agent-attacker", timestamp: 5000, policyStatus: "denied", riskScore: 0.99, noveltyScore: 0.85, blastRadius: 0.9, consequence: "Credential harvesting attempt" },
      { id: "atk-3", kind: "exec", label: "spawn reverse shell", agentId: "agent-attacker", timestamp: 8000, policyStatus: "denied", riskScore: 1.0, noveltyScore: 0.95, blastRadius: 1.0, consequence: "Reverse shell to external host", predecessors: ["atk-2"] },
      { id: "def-1", kind: "query", label: "SELECT audit_log", agentId: "agent-defender", timestamp: 3000, policyStatus: "allowed", riskScore: 0.1, noveltyScore: 0.1, blastRadius: 0.05 },
      { id: "def-2", kind: "message", label: "alert security team", agentId: "agent-defender", timestamp: 6000, policyStatus: "allowed", riskScore: 0.05, noveltyScore: 0.2, blastRadius: 0.1, predecessors: ["def-1"] },
      { id: "def-3", kind: "exec", label: "isolate container", agentId: "agent-defender", timestamp: 10000, policyStatus: "allowed", riskScore: 0.3, noveltyScore: 0.4, blastRadius: 0.5, consequence: "Network namespace isolation triggered", predecessors: ["def-2"] },
      { id: "obs-1", kind: "query", label: "trace process tree", agentId: "agent-observer", timestamp: 4000, policyStatus: "allowed", riskScore: 0.05, noveltyScore: 0.15, blastRadius: 0.02 },
      { id: "obs-2", kind: "fs", label: "snapshot /proc/maps", agentId: "agent-observer", timestamp: 7000, policyStatus: "allowed", riskScore: 0.1, noveltyScore: 0.3, blastRadius: 0.05 },
      { id: "obs-3", kind: "message", label: "publish forensic report", agentId: "agent-observer", timestamp: 12000, policyStatus: "allowed", riskScore: 0.02, noveltyScore: 0.1, blastRadius: 0.01, predecessors: ["obs-2"] },
    ] satisfies RiverAction[],
    agents: [
      { id: "agent-attacker", label: "Attacker", color: "#EF4444" },
      { id: "agent-defender", label: "Defender", color: "#22D3EE" },
      { id: "agent-observer", label: "Observer", color: "#10B981" },
    ],
    policies: [
      { id: "pol-deny-all", label: "Deny External", startT: 0, endT: 0.5, side: "both" as const, type: "hard-deny" as const },
      { id: "pol-sandbox", label: "Exec Sandbox", startT: 0.4, endT: 0.8, side: "right" as const, type: "hard-deny" as const },
      { id: "pol-audit", label: "Full Audit", startT: 0.7, endT: 1.0, side: "both" as const, type: "record-only" as const },
    ],
    causalLinks: [
      { fromId: "atk-1", toId: "atk-2", strength: 0.9 },
      { fromId: "atk-2", toId: "atk-3", strength: 0.95 },
      { fromId: "def-1", toId: "def-2", strength: 0.7 },
      { fromId: "def-2", toId: "def-3", strength: 0.85 },
      { fromId: "obs-1", toId: "obs-2", strength: 0.5 },
      { fromId: "obs-2", toId: "obs-3", strength: 0.6 },
      { fromId: "atk-2", toId: "def-2", strength: 0.8 },
    ],
    signals: [
      { id: "sig-1", type: "risk", score: 0.95, label: "DNS tunneling detected", actionId: "atk-1", detectorId: "det-1" },
      { id: "sig-2", type: "risk", score: 0.99, label: "Credential access", actionId: "atk-2", detectorId: "det-1" },
      { id: "sig-3", type: "anomaly", score: 0.9, label: "Reverse shell pattern", actionId: "atk-3", detectorId: "det-2" },
    ] satisfies SignalData[],
    incidents: [
      { id: "inc-1", label: "Active Intrusion", severity: "critical", actionIds: ["atk-1", "atk-2", "atk-3"], position: [-4, 0.3, 1.0] },
    ] satisfies IncidentData[],
    detectors: [
      { id: "det-1", label: "Threat Intel Scanner", type: "signature", position: [-5, 0, 2.5], active: true, signalCount: 2 },
      { id: "det-2", label: "Behavioral Analyzer", type: "behavioral", position: [3, 0, -2.5], active: true, signalCount: 1 },
    ] satisfies DetectorData[],
    timeRange: [0, 14000] as [number, number],
    autoPlay: true,
  },
};

/** Minimal: 1 agent, 10 simple actions, no extra features. */
export const MinimalStream: Story = {
  args: {
    actions: generateActions(10, [{ id: "solo-agent" }], 0, 30000, 123),
    agents: [{ id: "solo-agent", label: "Solo Agent", color: "#8B5CF6" }],
    timeRange: [0, 30000],
    initialTime: 30000,
    showPolicyRails: false,
    showCausalThreads: false,
    showSignals: false,
    showDetectors: false,
    showIncidents: false,
  },
};

/** Dense traffic: 3 agents, 120 actions — stress-tests the river layout. */
export const DenseTraffic: Story = {
  args: {
    actions: generateActions(120, AGENTS, TIME_START, TIME_END, 7),
    agents: AGENTS,
    policies: defaultPolicies,
    causalLinks: generateCausalLinks(generateActions(120, AGENTS, TIME_START, TIME_END, 7), 20, 33),
    timeRange: [TIME_START, TIME_END],
    initialTime: TIME_END,
    showSignals: false,
    showIncidents: false,
    showDetectors: false,
  },
};

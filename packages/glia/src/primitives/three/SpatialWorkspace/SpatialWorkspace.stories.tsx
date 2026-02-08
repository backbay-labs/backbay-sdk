import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { SpatialWorkspace } from "./SpatialWorkspace";
import type { Job, Node, Receipt, Dispute, TrustTier } from "@backbay/contract";
import type { VisionFrame, VisionTopology } from "../../../vision";
import {
  CanvasCaptureAdapter,
  RaymondVisionAdapter,
  useVisionCaptureController,
} from "../../../vision";

const meta: Meta<typeof SpatialWorkspace> = {
  title: "Primitives/3D/Workspace/SpatialWorkspace",
  component: SpatialWorkspace,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs", "!static-grade"],
  argTypes: {
    autoRotate: {
      control: "boolean",
    },
    currentTrustTier: {
      control: "select",
      options: ["bronze", "silver", "gold"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SpatialWorkspace>;

// Mock data generators
const createJob = (
  id: string,
  status: Job["status"],
  priority: number = 1
): Job => ({
  id,
  status,
  type: "render",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  payload: { task: "Sample task" },
  priority,
  assignee_id: null,
  result: null,
});

const createNode = (
  id: string,
  type: Node["type"],
  status: Node["status"],
  trustTier: TrustTier
): Node => ({
  id,
  type,
  status,
  trust_tier: trustTier,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  endpoint: `https://node-${id}.example.com`,
  public_key: `pk_${id}`,
  metadata: {},
  capabilities: ["compute", "render", "verify"],
  uptime_percent: 95 + Math.random() * 5,
});

const createReceipt = (
  id: string,
  jobId: string,
  status: Receipt["status"]
): Receipt => ({
  id,
  job_id: jobId,
  node_id: `node-${id}`,
  status,
  created_at: new Date().toISOString(),
  result_hash: `hash_${id}`,
  signature: `sig_${id}`,
});

const createDispute = (
  id: string,
  jobId: string,
  status: Dispute["status"]
): Dispute => ({
  id,
  job_id: jobId,
  challenger_id: "challenger-1",
  defendant_id: "defendant-1",
  status,
  opened_at: new Date().toISOString(),
  resolved_at: null,
  reason: "Verification mismatch",
  evidence: {},
});

// Sample data sets
const sampleJobs: Job[] = [
  createJob("job-1", "running", 3),
  createJob("job-2", "running", 2),
  createJob("job-3", "completed", 1),
  createJob("job-4", "queued", 1),
  createJob("job-5", "queued", 1),
  createJob("job-6", "blocked", 2),
  createJob("job-7", "completed", 1),
];

const sampleNodes: Node[] = [
  createNode("node-1", "operator", "online", "gold"),
  createNode("node-2", "operator", "online", "silver"),
  createNode("node-3", "fab", "online", "bronze"),
  createNode("node-4", "verifier", "online", "gold"),
  createNode("node-5", "verifier", "degraded", "silver"),
  createNode("node-6", "relay", "online", "bronze"),
  createNode("node-7", "operator", "offline", "bronze"),
];

const sampleReceipts: Receipt[] = [
  createReceipt("receipt-1", "job-1", "pending"),
  createReceipt("receipt-2", "job-1", "passed"),
  createReceipt("receipt-3", "job-2", "pending"),
  createReceipt("receipt-4", "job-3", "passed"),
  createReceipt("receipt-5", "job-3", "passed"),
];

const sampleDisputes: Dispute[] = [
  createDispute("dispute-1", "job-6", "open"),
];

export const Default: Story = {
  args: {
    jobs: sampleJobs,
    nodes: sampleNodes,
    receipts: sampleReceipts,
    disputes: sampleDisputes,
    currentTrustTier: "silver",
    autoRotate: true,
    style: { width: "100%", height: "600px" },
  },
};

export const BronzeTier: Story = {
  args: {
    jobs: sampleJobs,
    nodes: sampleNodes,
    receipts: sampleReceipts,
    disputes: sampleDisputes,
    currentTrustTier: "bronze",
    autoRotate: true,
    style: { width: "100%", height: "600px" },
  },
};

export const SilverTier: Story = {
  args: {
    jobs: sampleJobs,
    nodes: sampleNodes,
    receipts: sampleReceipts,
    disputes: sampleDisputes,
    currentTrustTier: "silver",
    autoRotate: true,
    style: { width: "100%", height: "600px" },
  },
};

export const GoldTier: Story = {
  args: {
    jobs: sampleJobs,
    nodes: sampleNodes,
    receipts: sampleReceipts,
    disputes: sampleDisputes,
    currentTrustTier: "gold",
    autoRotate: true,
    style: { width: "100%", height: "600px" },
  },
};

export const JobsOnly: Story = {
  args: {
    jobs: sampleJobs,
    nodes: [],
    receipts: [],
    disputes: [],
    currentTrustTier: "silver",
    filters: {
      showJobs: true,
      showNodes: false,
      showReceipts: false,
      showDisputes: false,
      showTrustRings: true,
    },
    autoRotate: true,
    style: { width: "100%", height: "600px" },
  },
};

export const NodesOnly: Story = {
  args: {
    jobs: [],
    nodes: sampleNodes,
    receipts: [],
    disputes: [],
    currentTrustTier: "silver",
    filters: {
      showJobs: false,
      showNodes: true,
      showReceipts: false,
      showDisputes: false,
      showTrustRings: true,
    },
    autoRotate: true,
    style: { width: "100%", height: "600px" },
  },
};

export const FilteredByStatus: Story = {
  args: {
    jobs: sampleJobs,
    nodes: sampleNodes,
    receipts: sampleReceipts,
    disputes: sampleDisputes,
    currentTrustTier: "silver",
    filters: {
      showJobs: true,
      showNodes: true,
      showReceipts: true,
      showDisputes: true,
      showTrustRings: true,
      jobStatuses: ["running", "blocked"],
      nodeStatuses: ["online"],
    },
    autoRotate: true,
    style: { width: "100%", height: "600px" },
  },
};

function VisionWiringDemo() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const topologyRef = React.useRef<VisionTopology | null>(null);
  const adaptersRef = React.useRef<{
    canvas?: CanvasCaptureAdapter;
    raymond?: RaymondVisionAdapter;
  }>({});

  const [canvasFrame, setCanvasFrame] = React.useState<VisionFrame | null>(null);
  const [rayFrame, setRayFrame] = React.useState<VisionFrame | null>(null);
  const [topologySnapshot, setTopologySnapshot] = React.useState<VisionTopology | null>(null);
  const [canvasReady, setCanvasReady] = React.useState(false);
  const [initialCaptureDone, setInitialCaptureDone] = React.useState(false);

  React.useEffect(() => {
    if (adaptersRef.current.canvas && adaptersRef.current.raymond) {
      return;
    }
    adaptersRef.current.canvas = new CanvasCaptureAdapter({
      id: "spatial-canvas",
      label: "SpatialWorkspace Canvas",
      getCanvas: () => canvasRef.current,
      getTopology: () => topologyRef.current,
      format: "image/png",
    });
    adaptersRef.current.raymond = new RaymondVisionAdapter({
      id: "spatial-raymond",
      label: "SpatialWorkspace Raymond",
      topologyProvider: () => topologyRef.current,
      axis: "xz",
      scale: 0.6,
    });
  }, []);

  const captureVision = React.useCallback(async () => {
    const canvasAdapter = adaptersRef.current.canvas;
    const raymondAdapter = adaptersRef.current.raymond;
    if (!canvasAdapter || !raymondAdapter) return;
    const [canvasShot, raymondShot] = await Promise.all([
      canvasAdapter.capture({
        includeTopology: true,
        size: { width: 640, height: 360 },
      }),
      raymondAdapter.capture({
        includeTopology: true,
        size: { width: 120, height: 1 },
      }),
    ]);
    setCanvasFrame(canvasShot);
    setRayFrame(raymondShot);
  }, []);

  const ready = canvasReady && Boolean(topologySnapshot);
  const {
    mode: captureMode,
    setMode: setCaptureMode,
    intervalMs,
    setIntervalMs,
    busy,
    captureNow,
  } = useVisionCaptureController({
    capture: captureVision,
    ready,
    topology: topologySnapshot,
    initialMode: "manual",
    initialIntervalMs: 2000,
    minIntervalMs: 500,
  });

  React.useEffect(() => {
    if (!ready || initialCaptureDone) return;
    setInitialCaptureDone(true);
    void captureNow();
  }, [ready, initialCaptureDone, captureNow]);

  const onCanvasReady = React.useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
    setCanvasReady(true);
  }, []);

  const onTopologyChange = React.useCallback((topology: VisionTopology) => {
    topologyRef.current = topology;
    setTopologySnapshot(topology);
  }, []);

  const rayColors =
    (rayFrame?.channels?.find((channel) => channel.id === "raymond:vision")?.data as
      | Array<{ r: number; g: number; b: number }>
      | undefined) ?? [];

  const previewColors = rayColors.slice(0, 120);

  return (
    <div style={{ position: "relative", width: "100%", height: "720px" }}>
      <SpatialWorkspace
        jobs={sampleJobs}
        nodes={sampleNodes}
        receipts={sampleReceipts}
        disputes={sampleDisputes}
        currentTrustTier="silver"
        autoRotate={true}
        topologyId="spatial-workspace"
        topologyUpdateMs={500}
        onTopologyChange={onTopologyChange}
        onCanvasReady={onCanvasReady}
        style={{ width: "100%", height: "100%" }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          width: 320,
          padding: 12,
          background: "rgba(5, 8, 18, 0.9)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 12,
          color: "#e2e8f0",
          fontFamily: "monospace",
          fontSize: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <strong>Vision Output</strong>
          <button
            onClick={() => void captureNow()}
            disabled={busy}
            style={{
              background: busy ? "rgba(148, 163, 184, 0.3)" : "#38bdf8",
              color: "#0f172a",
              border: "none",
              borderRadius: 8,
              padding: "4px 10px",
              cursor: busy ? "default" : "pointer",
              fontFamily: "monospace",
            }}
          >
            {busy ? "Capturing..." : "Capture"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <span>Mode</span>
          <select
            value={captureMode}
            onChange={(event) =>
              setCaptureMode(event.target.value as "manual" | "interval" | "topology")
            }
            style={{
              background: "rgba(15, 23, 42, 0.7)",
              color: "#e2e8f0",
              border: "1px solid rgba(148, 163, 184, 0.4)",
              borderRadius: 6,
              padding: "2px 6px",
              fontFamily: "monospace",
              fontSize: 12,
            }}
          >
            <option value="manual">manual</option>
            <option value="interval">interval</option>
            <option value="topology">topology</option>
          </select>
          {captureMode === "interval" && (
            <input
              type="number"
              min={500}
              step={250}
              value={intervalMs}
              onChange={(event) => setIntervalMs(Number(event.target.value))}
              style={{
                width: 80,
                background: "rgba(15, 23, 42, 0.7)",
                color: "#e2e8f0",
                border: "1px solid rgba(148, 163, 184, 0.4)",
                borderRadius: 6,
                padding: "2px 6px",
                fontFamily: "monospace",
                fontSize: 12,
              }}
            />
          )}
          {captureMode === "interval" && <span>ms</span>}
          {captureMode === "topology" && <span>captures on change</span>}
        </div>
        <div style={{ marginBottom: 8 }}>
          Canvas: {canvasFrame?.size?.width ?? "--"}x{canvasFrame?.size?.height ?? "--"}
        </div>
        <div style={{ marginBottom: 8 }}>
          Topology nodes: {topologySnapshot?.nodes.length ?? "--"}
        </div>
        <div style={{ marginBottom: 8 }}>
          Raymond rays: {rayColors.length || "--"}
        </div>
        {canvasFrame?.channels?.[0]?.data && (
          <img
            src={canvasFrame.channels[0].data as string}
            alt="Canvas capture"
            style={{ width: "100%", borderRadius: 8, marginBottom: 8 }}
          />
        )}
        {previewColors.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${previewColors.length}, 1fr)`,
              height: 12,
              borderRadius: 6,
              overflow: "hidden",
              border: "1px solid rgba(148, 163, 184, 0.3)",
            }}
          >
            {previewColors.map((color, idx) => (
              <span
                key={`ray-${idx}`}
                style={{
                  backgroundColor: `rgb(${Math.round(color.r * 255)}, ${Math.round(
                    color.g * 255
                  )}, ${Math.round(color.b * 255)})`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const VisionWiring: Story = {
  render: () => <VisionWiringDemo />,
};

export const WithoutTrustRings: Story = {
  args: {
    jobs: sampleJobs,
    nodes: sampleNodes,
    receipts: sampleReceipts,
    disputes: sampleDisputes,
    currentTrustTier: "silver",
    filters: {
      showJobs: true,
      showNodes: true,
      showReceipts: true,
      showDisputes: true,
      showTrustRings: false,
    },
    autoRotate: true,
    style: { width: "100%", height: "600px" },
  },
};

export const StaticView: Story = {
  args: {
    jobs: sampleJobs,
    nodes: sampleNodes,
    receipts: sampleReceipts,
    disputes: sampleDisputes,
    currentTrustTier: "silver",
    autoRotate: false,
    style: { width: "100%", height: "600px" },
  },
};

export const Empty: Story = {
  args: {
    jobs: [],
    nodes: [],
    receipts: [],
    disputes: [],
    currentTrustTier: "bronze",
    autoRotate: true,
    style: { width: "100%", height: "600px" },
  },
};

// Busy network simulation
const busyJobs = Array.from({ length: 15 }, (_, i) =>
  createJob(
    `job-${i}`,
    ["queued", "running", "completed", "blocked"][i % 4] as Job["status"],
    (i % 3) + 1
  )
);

const busyNodes = Array.from({ length: 12 }, (_, i) =>
  createNode(
    `node-${i}`,
    ["operator", "fab", "verifier", "relay"][i % 4] as Node["type"],
    ["online", "degraded", "offline"][i % 3] as Node["status"],
    ["bronze", "silver", "gold"][i % 3] as TrustTier
  )
);

export const BusyNetwork: Story = {
  args: {
    jobs: busyJobs,
    nodes: busyNodes,
    receipts: busyJobs
      .filter((j) => j.status === "running" || j.status === "completed")
      .flatMap((j) => [
        createReceipt(`${j.id}-r1`, j.id, "pending"),
        createReceipt(`${j.id}-r2`, j.id, "passed"),
      ]),
    disputes: [],
    currentTrustTier: "gold",
    autoRotate: true,
    style: { width: "100%", height: "700px" },
  },
};

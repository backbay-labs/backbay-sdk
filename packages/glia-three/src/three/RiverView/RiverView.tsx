"use client";

/**
 * RiverView - Main orchestrator for the forensic action-river visualization.
 *
 * Self-contained component (provides its own Canvas) that renders a flowing
 * river of agent actions with policy rails, causal threads, incident vortices,
 * signal flares, and detector towers. Includes HUD overlays for replay
 * controls and an action inspector panel.
 */

import * as React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { RiverBed } from "./RiverBed";
import { FlowParticles } from "./FlowParticles";
import { AgentLane } from "./AgentLane";
import { ActionNode } from "./ActionNode";
import { PolicyRail } from "./PolicyRail";
import { CausalThread } from "./CausalThread";
import { IncidentVortex, type IncidentData } from "./IncidentVortex";
import { SignalFlare, type SignalData } from "./SignalFlare";
import { DetectorTower, type DetectorData } from "./DetectorTower";
import { TimeRuler } from "./TimeRuler";
import { ReplayControls } from "./ReplayControls";
import { InspectorPanel } from "./InspectorPanel";
import {
  createRiverCurve,
  getPointOnRiver,
  laneOffset,
  RIVER_DEFAULTS,
  AGENT_COLORS,
} from "./riverHelpers";
import type { RiverAction, PolicySegment, CausalLink } from "./types";

// =============================================================================
// TYPES
// =============================================================================

export interface RiverViewProps {
  /** Array of actions to plot along the river. */
  actions: RiverAction[];
  /** Agent definitions (id + label + optional color). */
  agents: Array<{ id: string; label: string; color?: string }>;
  /** Policy segments rendered as riverbank rails. */
  policies?: PolicySegment[];
  /** Signal flare markers on actions. */
  signals?: SignalData[];
  /** Incident vortex clusters. */
  incidents?: IncidentData[];
  /** Detector towers on the riverbanks. */
  detectors?: DetectorData[];
  /** Causal links between actions. */
  causalLinks?: CausalLink[];

  /** Absolute time range in ms [start, end]. */
  timeRange: [number, number];
  /** Initial playback time (ms). Defaults to timeRange[0]. */
  initialTime?: number;
  /** Begin auto-playing on mount. */
  autoPlay?: boolean;

  /** Show policy rail segments. */
  showPolicyRails?: boolean;
  /** Show causal thread lines between actions. */
  showCausalThreads?: boolean;
  /** Show signal flare markers. */
  showSignals?: boolean;
  /** Show detector towers. */
  showDetectors?: boolean;
  /** Show incident vortices. */
  showIncidents?: boolean;
  /** River width override. */
  riverWidth?: number;

  /** Called when an action is selected or deselected. */
  onActionSelect?: (id: string | null) => void;
  /** Called when an incident vortex is clicked. */
  onIncidentSelect?: (id: string | null) => void;
  /** Called when the replay time changes. */
  onTimeChange?: (time: number) => void;

  className?: string;
  style?: React.CSSProperties;
}

// =============================================================================
// HELPERS
// =============================================================================

/** Map a timestamp within timeRange to a 0-1 parametric t along the river. */
function timeToT(timestamp: number, start: number, end: number): number {
  const duration = end - start;
  if (duration <= 0) return 0;
  return Math.max(0, Math.min(1, (timestamp - start) / duration));
}

// =============================================================================
// RIVER SCENE (inside Canvas)
// =============================================================================

interface RiverSceneProps {
  actions: RiverAction[];
  agents: Array<{ id: string; label: string; color?: string }>;
  policies: PolicySegment[];
  signals: SignalData[];
  incidents: IncidentData[];
  detectors: DetectorData[];
  causalLinks: CausalLink[];
  timeRange: [number, number];
  currentTime: number;
  selectedActionId: string | null;
  showPolicyRails: boolean;
  showCausalThreads: boolean;
  showSignals: boolean;
  showDetectors: boolean;
  showIncidents: boolean;
  riverWidth: number;
  onActionClick: (action: RiverAction) => void;
  onIncidentClick: (id: string) => void;
}

function RiverScene({
  actions,
  agents,
  policies,
  signals,
  incidents,
  detectors,
  causalLinks,
  timeRange,
  currentTime,
  selectedActionId,
  showPolicyRails,
  showCausalThreads,
  showSignals,
  showDetectors,
  showIncidents,
  riverWidth,
  onActionClick,
  onIncidentClick,
}: RiverSceneProps) {
  const [start, end] = timeRange;

  const curve = React.useMemo(() => createRiverCurve(), []);

  // Build agent index map: agentId -> lane index
  const agentIndexMap = React.useMemo(() => {
    const map = new Map<string, number>();
    agents.forEach((a, i) => map.set(a.id, i));
    return map;
  }, [agents]);

  // Compute action positions along the river
  const actionPositions = React.useMemo(() => {
    const map = new Map<string, THREE.Vector3>();
    for (const action of actions) {
      const t = timeToT(action.timestamp, start, end);
      const agentIdx = agentIndexMap.get(action.agentId) ?? 0;
      const lateral = laneOffset(agentIdx, agents.length, riverWidth);
      const pos = getPointOnRiver(curve, t, lateral);
      // Lift above the river surface
      pos.y += 0.15;
      map.set(action.id, pos);
    }
    return map;
  }, [actions, agents.length, agentIndexMap, curve, start, end, riverWidth]);

  // Compute average risk across visible actions for river bed tint
  const avgRisk = React.useMemo(() => {
    if (actions.length === 0) return 0;
    const total = actions.reduce((sum, a) => sum + a.riskScore, 0);
    return total / actions.length;
  }, [actions]);

  // Build signal position map (signal's position = its action's position, offset upward)
  const signalPositionMap = React.useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    for (const signal of signals) {
      const actionPos = actionPositions.get(signal.actionId);
      if (actionPos) {
        map.set(signal.id, [actionPos.x, actionPos.y + 0.5, actionPos.z]);
      }
    }
    return map;
  }, [signals, actionPositions]);

  return (
    <>
      {/* Camera controls — fixed orientation, pan/zoom to navigate the river */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={25}
        panSpeed={1.2}
        zoomSpeed={0.8}
        screenSpacePanning
      />

      {/* Lighting — matches SpatialWorkspace's richer setup */}
      <ambientLight intensity={0.4} color="#94A3B8" />
      <directionalLight position={[10, 10, 5]} intensity={0.8} color="#E2E8F0" />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} color="#94A3B8" />

      {/* Exponential fog for depth */}
      <fogExp2 attach="fog" args={["#050812", 0.015]} />

      {/* River surface */}
      <RiverBed width={riverWidth} riskLevel={avgRisk} />

      {/* Flow particles */}
      <FlowParticles curve={curve} width={riverWidth} />

      {/* Agent lanes */}
      {agents.map((agent, i) => (
        <AgentLane
          key={agent.id}
          curve={curve}
          laneIndex={i}
          totalLanes={agents.length}
          width={riverWidth}
          color={agent.color ?? AGENT_COLORS[i % AGENT_COLORS.length]}
          active={
            selectedActionId != null &&
            actions.some(
              (a) => a.id === selectedActionId && a.agentId === agent.id,
            )
          }
          agentLabel={agent.label}
        />
      ))}

      {/* Action nodes */}
      {actions.map((action) => {
        const pos = actionPositions.get(action.id);
        if (!pos) return null;

        // Determine if this action is within visible time window
        const t = timeToT(action.timestamp, start, end);
        const currentT = timeToT(currentTime, start, end);
        // Show actions that have occurred up to the current time
        const visible = t <= currentT + 0.01;

        if (!visible) return null;

        return (
          <ActionNode
            key={action.id}
            action={action}
            position={[pos.x, pos.y, pos.z]}
            selected={action.id === selectedActionId}
            dimmed={selectedActionId != null && action.id !== selectedActionId}
            onClick={onActionClick}
          />
        );
      })}

      {/* Policy rails */}
      {showPolicyRails && policies.length > 0 && (
        <PolicyRail segments={policies} curve={curve} riverWidth={riverWidth} />
      )}

      {/* Causal threads */}
      {showCausalThreads && causalLinks.length > 0 && (
        <CausalThread
          links={causalLinks}
          actionPositions={actionPositions}
          selectedActionId={selectedActionId}
        />
      )}

      {/* Incident vortices */}
      {showIncidents &&
        incidents.map((incident) => (
          <IncidentVortex
            key={incident.id}
            incident={incident}
            selected={false}
            onClick={onIncidentClick}
          />
        ))}

      {/* Signal flares */}
      {showSignals &&
        signals.map((signal) => {
          const pos = signalPositionMap.get(signal.id);
          if (!pos) return null;
          // Only show signals for actions that have appeared
          const actionT = timeToT(
            actions.find((a) => a.id === signal.actionId)?.timestamp ?? 0,
            start,
            end,
          );
          const currentT = timeToT(currentTime, start, end);
          if (actionT > currentT + 0.01) return null;

          return (
            <SignalFlare key={signal.id} signal={signal} position={pos} />
          );
        })}

      {/* Detector towers */}
      {showDetectors &&
        detectors.map((detector) => (
          <DetectorTower key={detector.id} detector={detector} />
        ))}

      {/* Time ruler */}
      <TimeRuler curve={curve} timeRange={timeRange} currentTime={currentTime} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.51, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial color="#050812" />
      </mesh>
    </>
  );
}

// =============================================================================
// RIVERVIEW CONTAINER
// =============================================================================

export function RiverView({
  actions,
  agents,
  policies = [],
  signals = [],
  incidents = [],
  detectors = [],
  causalLinks = [],
  timeRange,
  initialTime,
  autoPlay = false,
  showPolicyRails = true,
  showCausalThreads = true,
  showSignals = true,
  showDetectors = true,
  showIncidents = true,
  riverWidth = RIVER_DEFAULTS.width,
  onActionSelect,
  onIncidentSelect,
  onTimeChange,
  className,
  style,
}: RiverViewProps) {
  const [start, end] = timeRange;
  const [currentTime, setCurrentTime] = React.useState(initialTime ?? start);
  const [playing, setPlaying] = React.useState(autoPlay);
  const [speed, setSpeed] = React.useState(1);
  const [selectedActionId, setSelectedActionId] = React.useState<string | null>(null);

  // Auto-play animation loop
  const playingRef = React.useRef(playing);
  const speedRef = React.useRef(speed);
  playingRef.current = playing;
  speedRef.current = speed;

  React.useEffect(() => {
    if (!playing) return;

    let lastTime = performance.now();
    let rafId: number;

    function tick(now: number) {
      const delta = now - lastTime;
      lastTime = now;

      if (playingRef.current) {
        setCurrentTime((prev) => {
          // Advance by speed * real-time delta
          const next = prev + speedRef.current * delta;
          if (next >= end) {
            setPlaying(false);
            return end;
          }
          return next;
        });
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [playing, end]);

  // Notify parent of time changes
  React.useEffect(() => {
    onTimeChange?.(currentTime);
  }, [currentTime, onTimeChange]);

  const handleTimeChange = React.useCallback(
    (t: number) => {
      setCurrentTime(t);
    },
    [],
  );

  const handlePlayPause = React.useCallback(() => {
    setPlaying((p) => {
      // If at end, restart
      if (!p) {
        setCurrentTime((prev) => (prev >= end ? start : prev));
      }
      return !p;
    });
  }, [start, end]);

  const handleSpeedChange = React.useCallback((s: number) => {
    setSpeed(s);
  }, []);

  const handleSkipStart = React.useCallback(() => {
    setCurrentTime(start);
  }, [start]);

  const handleSkipEnd = React.useCallback(() => {
    setCurrentTime(end);
    setPlaying(false);
  }, [end]);

  const handleActionClick = React.useCallback(
    (action: RiverAction) => {
      const newId = selectedActionId === action.id ? null : action.id;
      setSelectedActionId(newId);
      onActionSelect?.(newId);
    },
    [selectedActionId, onActionSelect],
  );

  const handleIncidentClick = React.useCallback(
    (id: string) => {
      onIncidentSelect?.(id);
    },
    [onIncidentSelect],
  );

  const handleInspectorClose = React.useCallback(() => {
    setSelectedActionId(null);
    onActionSelect?.(null);
  }, [onActionSelect]);

  // Build inspector action data from the selected action
  const inspectorAction = React.useMemo(() => {
    if (!selectedActionId) return null;
    const action = actions.find((a) => a.id === selectedActionId);
    if (!action) return null;
    return {
      id: action.id,
      kind: action.kind,
      label: action.label,
      agentId: action.agentId,
      timestamp: action.timestamp,
      duration: action.duration,
      policyStatus: action.policyStatus,
      riskScore: Math.round(action.riskScore * 100),
      noveltyScore: Math.round(action.noveltyScore * 100),
      blastRadius: Math.round(action.blastRadius * 100),
      consequence: action.consequence,
    };
  }, [actions, selectedActionId]);

  // Incident markers for the replay timeline
  const incidentMarkers = React.useMemo(() => {
    return incidents.map((inc) => ({
      time: 0, // Incidents don't have a single timestamp; position at center
      severity: inc.severity === "critical" || inc.severity === "high" ? "critical" : "warning",
    }));
  }, [incidents]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "linear-gradient(to bottom, #0a0a15, #050510)",
        ...style,
      }}
    >
      <Canvas
        camera={{
          position: [0, 10, 8],
          fov: 45,
          near: 0.1,
          far: 100,
        }}
        dpr={[1, 1.5]}
      >
        <RiverScene
          actions={actions}
          agents={agents}
          policies={policies}
          signals={signals}
          incidents={incidents}
          detectors={detectors}
          causalLinks={causalLinks}
          timeRange={timeRange}
          currentTime={currentTime}
          selectedActionId={selectedActionId}
          showPolicyRails={showPolicyRails}
          showCausalThreads={showCausalThreads}
          showSignals={showSignals}
          showDetectors={showDetectors}
          showIncidents={showIncidents}
          riverWidth={riverWidth}
          onActionClick={handleActionClick}
          onIncidentClick={handleIncidentClick}
        />
      </Canvas>

      {/* HUD Overlays */}
      <ReplayControls
        currentTime={currentTime}
        timeRange={timeRange}
        playing={playing}
        speed={speed}
        onTimeChange={handleTimeChange}
        onPlayPause={handlePlayPause}
        onSpeedChange={handleSpeedChange}
        onSkipStart={handleSkipStart}
        onSkipEnd={handleSkipEnd}
        incidents={incidentMarkers}
      />

      <InspectorPanel
        action={inspectorAction}
        onClose={handleInspectorClose}
      />
    </div>
  );
}

RiverView.displayName = "RiverView";

"use client";

/**
 * SecurityDashboard - Composite 3D security monitoring dashboard
 *
 * Integrates SecurityShield, ThreatRadar, and AuditTrail components
 * into a unified security monitoring view with multiple layout presets.
 */

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { SecurityShield } from "../SecurityShield";
import { ThreatRadar } from "../ThreatRadar";
import { AuditTrail } from "../AuditTrail";
import type {
  SecurityDashboardProps,
  SecurityStatus,
  DashboardThreat,
} from "./types";
import { LAYOUT_PRESETS, STATUS_THEME_COLORS } from "./types";

// -----------------------------------------------------------------------------
// Connection Lines Sub-component
// -----------------------------------------------------------------------------

interface ConnectionLinesProps {
  shield: [number, number, number];
  radar: [number, number, number];
  audit: [number, number, number];
  color: string;
  animated: boolean;
}

function ConnectionLines({
  shield,
  radar,
  audit,
  color,
  animated,
}: ConnectionLinesProps) {
  const lineRef1 = React.useRef<THREE.Line>(null);
  const lineRef2 = React.useRef<THREE.Line>(null);
  const [dashOffset, setDashOffset] = React.useState(0);

  useFrame((_, delta) => {
    if (animated) {
      setDashOffset((prev) => (prev + delta * 0.5) % 1);
    }
  });

  // Generate curved path points using quadratic bezier
  const generateCurve = (
    start: [number, number, number],
    end: [number, number, number],
    segments: number = 20
  ): [number, number, number][] => {
    const points: [number, number, number][] = [];
    const midY = Math.max(start[1], end[1]) + 0.5;
    const midX = (start[0] + end[0]) / 2;
    const midZ = (start[2] + end[2]) / 2;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const t2 = t * t;
      const mt = 1 - t;
      const mt2 = mt * mt;

      // Quadratic bezier
      const x = mt2 * start[0] + 2 * mt * t * midX + t2 * end[0];
      const y = mt2 * start[1] + 2 * mt * t * midY + t2 * end[1];
      const z = mt2 * start[2] + 2 * mt * t * midZ + t2 * end[2];

      points.push([x, y, z]);
    }
    return points;
  };

  const shieldToRadar = generateCurve(shield, radar);
  const shieldToAudit = generateCurve(shield, audit);

  return (
    <group>
      {/* Shield to Radar connection */}
      <Line
        points={shieldToRadar}
        color={color}
        lineWidth={1.5}
        transparent
        opacity={0.25}
        dashed
        dashScale={10}
        dashSize={0.3}
        dashOffset={dashOffset}
      />
      <Line
        points={shieldToRadar}
        color={color}
        lineWidth={4}
        transparent
        opacity={0.05}
      />

      {/* Shield to Audit connection */}
      <Line
        points={shieldToAudit}
        color={color}
        lineWidth={1.5}
        transparent
        opacity={0.25}
        dashed
        dashScale={10}
        dashSize={0.3}
        dashOffset={-dashOffset}
      />
      <Line
        points={shieldToAudit}
        color={color}
        lineWidth={4}
        transparent
        opacity={0.05}
      />

      {/* Connection nodes at endpoints */}
      {[shield, radar, audit].map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

// -----------------------------------------------------------------------------
// Status HUD Sub-component
// -----------------------------------------------------------------------------

interface StatusHUDProps {
  score: number;
  status: SecurityStatus;
  shieldLevel: number;
  threatCount: number;
  activeThreats: number;
  eventCount: number;
  errorCount: number;
  position: [number, number, number];
  theme: SecurityDashboardProps["theme"];
}

function StatusHUD({
  score,
  status,
  shieldLevel,
  threatCount,
  activeThreats,
  eventCount,
  errorCount,
  position,
  theme = "cyber",
}: StatusHUDProps) {
  const statusColor = STATUS_THEME_COLORS[status];

  const themeAccent =
    theme === "matrix"
      ? "#00ff66"
      : theme === "terminal"
        ? "#ffaa00"
        : theme === "neon"
          ? "#ff00ff"
          : theme === "blueprint"
            ? "#4aa3ff"
            : "#00ffff";

  return (
    <Html position={position} center>
      <div
        style={{
          background: "rgba(0, 4, 8, 0.95)",
          border: `2px solid ${statusColor}`,
          borderRadius: "8px",
          padding: "16px 24px",
          fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
          minWidth: "200px",
          boxShadow: `0 0 30px ${statusColor}40, inset 0 0 20px ${statusColor}15`,
        }}
      >
        {/* Status Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "12px",
            paddingBottom: "10px",
            borderBottom: `1px solid ${statusColor}50`,
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: statusColor,
              letterSpacing: "3px",
              textShadow: `0 0 10px ${statusColor}`,
            }}
          >
            {status}
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#ffffff",
              marginTop: "4px",
            }}
          >
            Security Score:{" "}
            <span style={{ fontWeight: 700, color: statusColor }}>
              {score}%
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px 16px",
            fontSize: "11px",
          }}
        >
          <div style={{ color: "#888" }}>Shield:</div>
          <div style={{ color: themeAccent, fontWeight: 600, textAlign: "right" }}>
            {Math.round(shieldLevel * 100)}%
          </div>

          <div style={{ color: "#888" }}>Threats:</div>
          <div
            style={{
              color: threatCount > 0 ? "#ff6644" : themeAccent,
              fontWeight: 600,
              textAlign: "right",
            }}
          >
            {threatCount}
          </div>

          <div style={{ color: "#888" }}>Active:</div>
          <div
            style={{
              color: activeThreats > 0 ? "#ff3344" : themeAccent,
              fontWeight: 600,
              textAlign: "right",
            }}
          >
            {activeThreats}
          </div>

          <div style={{ color: "#888" }}>Events:</div>
          <div style={{ color: "#ffffff", fontWeight: 600, textAlign: "right" }}>
            {eventCount}
          </div>

          <div style={{ color: "#888" }}>Errors:</div>
          <div
            style={{
              color: errorCount > 0 ? "#ff4444" : themeAccent,
              fontWeight: 600,
              textAlign: "right",
            }}
          >
            {errorCount}
          </div>
        </div>

        {/* Score Bar */}
        <div
          style={{
            marginTop: "12px",
            paddingTop: "10px",
            borderTop: `1px solid ${statusColor}30`,
          }}
        >
          <div
            style={{
              height: "6px",
              background: "#1a1a2e",
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${score}%`,
                background: `linear-gradient(90deg, ${statusColor}80, ${statusColor})`,
                borderRadius: "3px",
                transition: "width 0.3s ease",
                boxShadow: `0 0 8px ${statusColor}`,
              }}
            />
          </div>
        </div>
      </div>
    </Html>
  );
}

// -----------------------------------------------------------------------------
// Main SecurityDashboard Component
// -----------------------------------------------------------------------------

export function SecurityDashboard({
  shield,
  threats,
  auditEvents,
  layout = "command",
  position = [0, 0, 0],
  animated = true,
  onShieldClick,
  onThreatClick,
  onEventClick,
  showConnections = true,
  showStatusHUD = true,
  theme = "cyber",
}: SecurityDashboardProps) {
  const layoutConfig = LAYOUT_PRESETS[layout];

  // Calculate overall security score
  const securityScore = React.useMemo(() => {
    // Base score from shield level
    const shieldScore = shield.level * 40;

    // Penalty for active threats
    const activeThreats = threats.filter((t) => t.active);
    const threatPenalty = activeThreats.length * 8;

    // Penalty for high severity threats
    const severeThreatPenalty =
      threats.filter((t) => t.severity > 0.7).length * 5;

    // Penalty for errors/critical events
    const errorEvents = auditEvents.filter(
      (e) => e.severity === "error" || e.severity === "critical"
    );
    const errorPenalty = errorEvents.length * 3;

    // Penalty for failed events
    const failedEvents = auditEvents.filter((e) => !e.success);
    const failedPenalty = failedEvents.length * 2;

    // Calculate final score
    const baseScore = 60 + shieldScore;
    const penalties =
      threatPenalty + severeThreatPenalty + errorPenalty + failedPenalty;

    return Math.max(0, Math.min(100, Math.round(baseScore - penalties)));
  }, [shield, threats, auditEvents]);

  // Determine overall status
  const overallStatus: SecurityStatus = React.useMemo(() => {
    if (shield.status === "offline") return "OFFLINE";
    if (securityScore >= 75) return "SECURE";
    if (securityScore >= 40) return "WARNING";
    return "CRITICAL";
  }, [securityScore, shield.status]);

  const statusColor = STATUS_THEME_COLORS[overallStatus];

  // Count metrics
  const activeThreats = threats.filter((t) => t.active).length;
  const errorCount = auditEvents.filter(
    (e) => e.severity === "error" || e.severity === "critical"
  ).length;

  // Convert dashboard threats to radar format
  const radarThreats = React.useMemo(() => {
    return threats.map((t) => ({
      ...t,
      detectedAt: Date.now(),
    }));
  }, [threats]);

  // Map audit trail theme
  const auditTheme = theme;

  return (
    <group position={position}>
      {/* SecurityShield */}
      <SecurityShield
        level={shield.level}
        status={shield.status}
        threatsBlocked={shield.threatsBlocked}
        position={layoutConfig.shield.position}
        radius={layoutConfig.shield.radius}
        onClick={onShieldClick}
        showStats={layout !== "compact"}
        animationSpeed={animated ? 1 : 0}
      />

      {/* ThreatRadar */}
      <ThreatRadar
        threats={radarThreats}
        position={layoutConfig.radar.position}
        radius={layoutConfig.radar.radius}
        scanSpeed={animated ? 0.5 : 0}
        onThreatClick={onThreatClick as (threat: DashboardThreat) => void}
        showLabels={layout !== "compact"}
        showStats={layout !== "compact"}
        sweepColor={
          theme === "matrix"
            ? "#00ff66"
            : theme === "terminal"
              ? "#ffaa00"
              : theme === "neon"
                ? "#ff00ff"
                : theme === "blueprint"
                  ? "#4aa3ff"
                  : "#00ff66"
        }
        gridColor={
          theme === "matrix"
            ? "#00ff44"
            : theme === "terminal"
              ? "#ff8800"
              : theme === "neon"
                ? "#ff44ff"
                : "#00ff44"
        }
      />

      {/* AuditTrail */}
      <AuditTrail
        events={auditEvents}
        position={layoutConfig.audit.position}
        length={layoutConfig.audit.length}
        orientation={layoutConfig.audit.orientation}
        onEventClick={onEventClick}
        maxEvents={layout === "compact" ? 10 : 15}
        theme={auditTheme}
        showSummary={layout !== "compact"}
        enableParticles={animated}
      />

      {/* Central Status HUD */}
      {showStatusHUD && (
        <StatusHUD
          score={securityScore}
          status={overallStatus}
          shieldLevel={shield.level}
          threatCount={threats.length}
          activeThreats={activeThreats}
          eventCount={auditEvents.length}
          errorCount={errorCount}
          position={layoutConfig.statusHUD.position}
          theme={theme}
        />
      )}

      {/* Connecting lines between components */}
      {showConnections && layout === "command" && (
        <ConnectionLines
          shield={layoutConfig.shield.position}
          radar={layoutConfig.radar.position}
          audit={layoutConfig.audit.position}
          color={statusColor}
          animated={animated}
        />
      )}

      {/* Ambient glow base */}
      <mesh
        position={[0, -0.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[layout === "compact" ? 4 : 8, 64]} />
        <meshBasicMaterial
          color={statusColor}
          transparent
          opacity={0.03}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Grid floor */}
      <gridHelper
        args={[
          layout === "compact" ? 8 : 16,
          layout === "compact" ? 16 : 32,
          statusColor,
          "#111122",
        ]}
        position={[0, -0.5, 0]}
        material-opacity={0.15}
        material-transparent={true}
      />
    </group>
  );
}

SecurityDashboard.displayName = "SecurityDashboard";

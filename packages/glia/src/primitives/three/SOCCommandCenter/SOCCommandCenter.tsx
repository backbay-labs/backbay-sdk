"use client";

import * as React from "react";
import { Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { AuditTrail } from "../AuditTrail";
import { IntelFeed } from "../IntelFeed";
import { NetworkTopology } from "../NetworkTopology";
import { SecurityDashboard } from "../SecurityDashboard";
import { ThreatRadar } from "../ThreatRadar";
import { STATUS_THEME_COLORS, type SecurityStatus } from "../SecurityDashboard";
import {
  SOC_LAYOUTS,
  SOC_THEME_COLORS,
  type SOCCommandCenterProps,
  type SOCPanelId,
  type SOCPanelLayout,
} from "./types";

interface PanelFrameProps {
  panel: SOCPanelLayout;
  selected: boolean;
  theme: NonNullable<SOCCommandCenterProps["theme"]>;
  onSelect?: (panel: SOCPanelId) => void;
  children: React.ReactNode;
}

function PanelFrame({ panel, selected, theme, onSelect, children }: PanelFrameProps) {
  const themeColors = SOC_THEME_COLORS[theme];
  const isAlertPanel = panel.id === "alerts";
  const isHighlighted = selected || isAlertPanel;
  const frameColor = isHighlighted ? themeColors.glow : themeColors.frame;
  const glowIntensity = isHighlighted ? 0.6 : 0.18;
  const contentScale = panel.scale ?? 1;

  return (
    <group position={panel.position} rotation={panel.rotation ?? [0, 0, 0]}>
      <RoundedBox args={[panel.size[0], panel.size[1], 0.12]} radius={0.08} smoothness={4}>
        <meshStandardMaterial
          color={frameColor}
          emissive={themeColors.glow}
          emissiveIntensity={glowIntensity}
          roughness={0.35}
          metalness={0.5}
          transparent
          opacity={0.9}
        />
      </RoundedBox>

      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[panel.size[0] - 0.25, panel.size[1] - 0.25]} />
        <meshStandardMaterial
          color="#030712"
          emissive={themeColors.accent}
          emissiveIntensity={isHighlighted ? 0.14 : 0.04}
          transparent
          opacity={0.9}
        />
      </mesh>

      <Html position={[0, panel.size[1] / 2 + 0.2, 0.14]} center>
        <div
          className="rounded border px-3 py-2 text-[12px] uppercase tracking-[0.2em]"
          style={{
            background: "rgba(2, 4, 10, 0.85)",
            color: isHighlighted ? themeColors.glow : "rgba(226, 232, 240, 0.7)",
            borderColor: isHighlighted ? `${themeColors.glow}33` : "rgba(255, 255, 255, 0.06)",
            boxShadow: isHighlighted
              ? `0 0 14px ${themeColors.glow}55, inset 0 1px 0 rgba(255,255,255,0.02)`
              : `inset 0 1px 0 rgba(255,255,255,0.02)`,
            backdropFilter: "blur(24px)",
          }}
        >
          {panel.label}
        </div>
      </Html>

      <group
        position={[0, 0, 0.12]}
        scale={[contentScale, contentScale, contentScale]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.(panel.id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        {children}
      </group>
    </group>
  );
}

function getOverallStatus({
  shieldStatus,
  activeThreats,
  severeThreats,
  criticalEvents,
}: {
  shieldStatus: "active" | "warning" | "breach" | "offline";
  activeThreats: number;
  severeThreats: number;
  criticalEvents: number;
}): SecurityStatus {
  if (shieldStatus === "offline") return "OFFLINE";
  if (shieldStatus === "breach" || severeThreats >= 2 || criticalEvents >= 2) {
    return "CRITICAL";
  }
  if (shieldStatus === "warning" || activeThreats > 0 || criticalEvents > 0) {
    return "WARNING";
  }
  return "SECURE";
}

export function SOCCommandCenter({
  networkData,
  threatData,
  auditData,
  alertData,
  intelData,
  layout = "standard",
  selectedPanel,
  onPanelSelect,
  showGlobalStatus = true,
  enableVR = false,
  theme = "cyber",
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: SOCCommandCenterProps) {
  const layoutConfig = SOC_LAYOUTS[layout];
  const themeColors = SOC_THEME_COLORS[theme];
  const intelPanel = layoutConfig.panels.intel;
  const intelBounds = React.useMemo(
    () => ({
      width: Math.max(1, intelPanel.size[0] - 0.6),
      height: Math.max(1, intelPanel.size[1] - 0.6),
    }),
    [intelPanel.size]
  );

  const globalStatus = React.useMemo(() => {
    const activeThreats = alertData.threats.filter((threat) => threat.active).length;
    const severeThreats = alertData.threats.filter((threat) => threat.severity > 0.7).length;
    const criticalEvents = alertData.auditEvents.filter(
      (event) => event.severity === "error" || event.severity === "critical"
    ).length;

    return getOverallStatus({
      shieldStatus: alertData.shield.status,
      activeThreats,
      severeThreats,
      criticalEvents,
    });
  }, [alertData]);

  const statusColor = STATUS_THEME_COLORS[globalStatus];
  const rootRotation: [number, number, number] = enableVR
    ? [rotation[0] - 0.1, rotation[1], rotation[2]]
    : rotation;
  const auditTheme = auditData.theme ?? theme;
  const dashboardTheme = alertData.theme ?? theme;

  return (
    <group position={position} rotation={rootRotation}>
      <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 12]} />
        <meshStandardMaterial
          color="#020617"
          emissive={themeColors.glow}
          emissiveIntensity={0.04}
          transparent
          opacity={0.8}
          roughness={0.9}
        />
      </mesh>

      <PanelFrame
        panel={layoutConfig.panels.network}
        selected={selectedPanel === "network"}
        theme={theme}
        onSelect={onPanelSelect}
      >
        <NetworkTopology {...networkData} theme={networkData.theme ?? theme} />
      </PanelFrame>

      <PanelFrame
        panel={layoutConfig.panels.threat}
        selected={selectedPanel === "threat"}
        theme={theme}
        onSelect={onPanelSelect}
      >
        <ThreatRadar {...threatData} />
      </PanelFrame>

      <PanelFrame
        panel={layoutConfig.panels.audit}
        selected={selectedPanel === "audit"}
        theme={theme}
        onSelect={onPanelSelect}
      >
        <AuditTrail {...auditData} theme={auditTheme} />
      </PanelFrame>

      <PanelFrame
        panel={layoutConfig.panels.alerts}
        selected={selectedPanel === "alerts"}
        theme={theme}
        onSelect={onPanelSelect}
      >
        <SecurityDashboard {...alertData} theme={dashboardTheme} />
      </PanelFrame>

      <PanelFrame
        panel={layoutConfig.panels.intel}
        selected={selectedPanel === "intel"}
        theme={theme}
        onSelect={onPanelSelect}
      >
        <IntelFeed {...intelData} bounds={intelBounds} />
      </PanelFrame>

      {showGlobalStatus && (
        <Html
          position={[layoutConfig.statusPosition[0], layoutConfig.statusPosition[1], 0.16]}
          center
        >
          <div
            className="rounded-lg border px-4 py-2 text-[11px] uppercase tracking-[0.3em]"
            style={{
              borderColor: "rgba(255, 255, 255, 0.06)",
              background: "rgba(2, 4, 10, 0.85)",
              color: statusColor,
              boxShadow: `0 0 18px ${statusColor}40, inset 0 1px 0 rgba(255,255,255,0.02)`,
              fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
              backdropFilter: "blur(24px)",
            }}
          >
            SOC STATUS • {globalStatus}
          </div>
        </Html>
      )}
    </group>
  );
}

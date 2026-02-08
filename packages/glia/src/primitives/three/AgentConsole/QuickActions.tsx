"use client";

/**
 * QuickActions - 3D-positioned action buttons
 *
 * Quick action buttons displayed as an HTML overlay in 3D space.
 * Supports horizontal, vertical, and radial layouts.
 */

import * as React from "react";
import { Html } from "@react-three/drei";
import type { QuickActionsProps, QuickAction } from "./types";

// -----------------------------------------------------------------------------
// Action Button
// -----------------------------------------------------------------------------

interface ActionButtonProps {
  action: QuickAction;
  onClick: () => void;
  index: number;
  layout: "horizontal" | "vertical" | "radial";
  total: number;
}

function ActionButton({ action, onClick, index, layout, total }: ActionButtonProps) {
  const categoryColors = {
    primary: "bg-cyan-500/10 border-cyan-500/[0.15] text-cyan-200 hover:bg-cyan-500/20 hover:shadow-[0_0_12px_rgba(34,211,238,0.2)]",
    secondary: "bg-white/[0.05] border-white/[0.06] text-white/80 hover:bg-white/[0.1] hover:shadow-[0_0_10px_rgba(255,255,255,0.05)]",
    danger: "bg-rose-500/10 border-rose-500/[0.15] text-rose-200 hover:bg-rose-500/20 hover:shadow-[0_0_12px_rgba(244,63,94,0.2)]",
  };

  const colorClass = categoryColors[action.category || "secondary"];

  // Radial positioning
  let style: React.CSSProperties = {};
  if (layout === "radial") {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    const radius = 60; // pixels from center
    style = {
      position: "absolute",
      left: `${50 + Math.cos(angle) * radius}%`,
      top: `${50 + Math.sin(angle) * radius}%`,
      transform: "translate(-50%, -50%)",
    };
  }

  return (
    <button
      onClick={onClick}
      disabled={action.enabled === false}
      style={style}
      className={`
        px-3 py-1.5 rounded-lg border text-xs font-mono uppercase tracking-wider
        backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]
        transition-all duration-150
        disabled:opacity-30 disabled:cursor-not-allowed
        ${colorClass}
        ${layout === "radial" ? "whitespace-nowrap" : ""}
      `}
      title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
    >
      {action.icon && <span className="mr-1">{action.icon}</span>}
      {action.label}
      {action.shortcut && (
        <span className="ml-2 opacity-50 text-[10px]">{action.shortcut}</span>
      )}
    </button>
  );
}

// -----------------------------------------------------------------------------
// Quick Actions Container
// -----------------------------------------------------------------------------

export function QuickActions({
  actions,
  onAction,
  direction = "horizontal",
  position = [0, 1.5, 0],
}: QuickActionsProps) {
  if (actions.length === 0) return null;

  const layoutClasses = {
    horizontal: "flex flex-row gap-2",
    vertical: "flex flex-col gap-2",
    radial: "relative w-[180px] h-[180px]",
  };

  return (
    <Html
      position={position}
      center
      transform
      occlude={false}
      style={{ pointerEvents: "auto" }}
    >
      <div className={layoutClasses[direction]}>
        {actions.map((action, index) => (
          <ActionButton
            key={action.id}
            action={action}
            onClick={() => onAction(action.id)}
            index={index}
            layout={direction}
            total={actions.length}
          />
        ))}
      </div>
    </Html>
  );
}

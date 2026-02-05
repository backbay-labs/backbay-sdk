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
    primary: "bg-indigo-500/30 border-indigo-500/50 text-indigo-200 hover:bg-indigo-500/40",
    secondary: "bg-white/10 border-white/20 text-white/80 hover:bg-white/20",
    danger: "bg-red-500/30 border-red-500/50 text-red-200 hover:bg-red-500/40",
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
        px-3 py-1.5 rounded-lg border text-xs font-mono
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

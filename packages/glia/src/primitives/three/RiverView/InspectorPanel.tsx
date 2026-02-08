"use client";

import * as React from "react";
import { cn } from "../../../lib/utils";

// =============================================================================
// TYPES
// =============================================================================

export interface InspectorAction {
  id: string;
  kind: string;
  label: string;
  agentId: string;
  timestamp: number;
  duration?: number;
  policyStatus: string;
  riskScore: number;
  noveltyScore: number;
  blastRadius: number;
  consequence?: string;
  args?: Record<string, unknown>;
  result?: unknown;
}

export interface InspectorPanelProps {
  action: InspectorAction | null;
  onClose: () => void;
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const KIND_ICONS: Record<string, string> = {
  fs: "\uD83D\uDCC1",
  network: "\uD83C\uDF10",
  exec: "\u26A1",
  codepatch: "\uD83D\uDCDD",
  query: "\uD83D\uDD0D",
  message: "\uD83D\uDCAC",
};

const POLICY_COLORS: Record<string, { bg: string; text: string }> = {
  approved: { bg: "bg-emerald-400/10", text: "text-emerald-400" },
  denied: { bg: "bg-red-400/10", text: "text-red-400" },
  pending: { bg: "bg-amber-400/10", text: "text-amber-400" },
  escalated: { bg: "bg-violet-400/10", text: "text-violet-400" },
};

// =============================================================================
// HELPERS
// =============================================================================

function formatTimestamp(ms: number): string {
  const date = new Date(ms);
  return date.toISOString().replace("T", " ").replace("Z", "");
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function scoreColor(score: number): string {
  if (score >= 75) return "bg-red-400";
  if (score >= 50) return "bg-amber-400";
  if (score >= 25) return "bg-cyan-400";
  return "bg-emerald-400";
}

function scoreBarColor(score: number): string {
  if (score >= 75) return "bg-red-400/30";
  if (score >= 50) return "bg-amber-400/30";
  if (score >= 25) return "bg-cyan-400/30";
  return "bg-emerald-400/30";
}

// =============================================================================
// METRIC BAR
// =============================================================================

function MetricBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B]">
          {label}
        </span>
        <span className="font-mono text-[10px] tabular-nums text-[#E2E8F0]">
          {clamped}%
        </span>
      </div>
      <div className={cn("h-1.5 rounded-full", scoreBarColor(clamped))}>
        <div
          className={cn("h-full rounded-full transition-all duration-300", scoreColor(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// COLLAPSIBLE SECTION
// =============================================================================

function CollapsibleSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="border-t border-white/[0.06] pt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
        aria-expanded={open}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B]">
          {title}
        </span>
        <span className="text-[#64748B] text-xs">{open ? "\u25B2" : "\u25BC"}</span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

// =============================================================================
// INSPECTOR PANEL
// =============================================================================

export function InspectorPanel({ action, onClose, className }: InspectorPanelProps) {
  if (!action) return null;

  const icon = KIND_ICONS[action.kind] ?? "\u2753";
  const policyStyle = POLICY_COLORS[action.policyStatus] ?? POLICY_COLORS.pending;

  return (
    <div
      className={cn(
        "absolute right-4 top-4 w-80 z-20",
        "bg-[rgba(2,4,10,0.85)] backdrop-blur-xl",
        "border border-white/[0.06] rounded-xl",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
        "overflow-hidden",
        className,
      )}
      role="dialog"
      aria-label="Action inspector"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <span className="text-base" aria-hidden="true">
          {icon}
        </span>
        <span className="flex-1 font-mono text-xs text-[#E2E8F0] truncate">
          {action.label}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-6 h-6 rounded-md text-white/40 hover:text-cyan-400 transition-colors duration-150"
          aria-label="Close inspector"
        >
          &times;
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3 max-h-[70vh] overflow-y-auto">
        {/* Status row */}
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-[0.08em]",
              policyStyle.bg,
              policyStyle.text,
            )}
          >
            {action.policyStatus}
          </span>
          <span className="font-mono text-[10px] text-[#64748B]">
            Agent {action.agentId}
          </span>
        </div>

        {/* Metrics */}
        <div className="space-y-2">
          <MetricBar label="Risk" value={action.riskScore} />
          <MetricBar label="Novelty" value={action.noveltyScore} />
          <MetricBar label="Blast Radius" value={action.blastRadius} />
        </div>

        {/* Timestamp */}
        <div className="border-t border-white/[0.06] pt-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B] block mb-1">
            Timestamp
          </span>
          <span className="font-mono text-xs text-[#E2E8F0] tabular-nums">
            {formatTimestamp(action.timestamp)}
          </span>
          {action.duration != null && (
            <span className="ml-2 font-mono text-[10px] text-[#64748B]">
              ({formatDuration(action.duration)})
            </span>
          )}
        </div>

        {/* Consequence */}
        {action.consequence && (
          <div className="border-t border-white/[0.06] pt-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#64748B] block mb-1">
              Consequence
            </span>
            <p className="text-xs text-[#E2E8F0] leading-relaxed">
              {action.consequence}
            </p>
          </div>
        )}

        {/* Details (collapsible JSON) */}
        {(action.args != null || action.result != null) && (
          <CollapsibleSection title="Details">
            <pre className="font-mono text-[10px] text-[#64748B] bg-white/[0.02] rounded-lg p-2 overflow-x-auto max-h-40 whitespace-pre-wrap break-all">
              {JSON.stringify(
                { args: action.args, result: action.result },
                null,
                2,
              )?.slice(0, 2000)}
            </pre>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

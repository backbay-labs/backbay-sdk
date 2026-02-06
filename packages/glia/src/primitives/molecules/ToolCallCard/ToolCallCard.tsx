"use client";

/**
 * ToolCallCard -- Displays an AI tool/function call with its name,
 * arguments, execution status, and optional result.
 *
 * @example
 * <ToolCallCard
 *   name="searchDatabase"
 *   args={{ query: "user preferences", limit: 10 }}
 *   status="running"
 * />
 *
 * @example
 * <ToolCallCard
 *   name="generateImage"
 *   args={{ prompt: "A sunset over mountains" }}
 *   status="complete"
 *   result={{ url: "https://..." }}
 *   duration={2340}
 * />
 */

import * as React from "react";
import { cn, prefersReducedMotion } from "../../../lib/utils";
import {
  useGlassTokens,
  useColorTokens,
  useMotionTokens,
} from "../../../theme/UiThemeProvider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToolCallStatus = "pending" | "running" | "complete" | "error";

export interface ToolCallProps {
  /** Tool/function name */
  name: string;
  /** Tool arguments (will be displayed as formatted JSON) */
  args?: Record<string, unknown>;
  /** Execution status */
  status: ToolCallStatus;
  /** Result data (shown when status is 'complete') */
  result?: unknown;
  /** Error message (shown when status is 'error') */
  error?: string;
  /** Execution duration in ms (shown when complete/error) */
  duration?: number;
  /** Tool call ID (for display) */
  id?: string;
  /** Whether the args/result sections start expanded. Default: false */
  defaultExpanded?: boolean;
  /** Disable animations */
  disableAnimations?: boolean;
  /** Additional className */
  className?: string;
  /** Additional styles */
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Icons (inline SVGs, 16x16)
// ---------------------------------------------------------------------------

function ToolIcon({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M8.5 1L2 9h5.5L7 15l6.5-8H8L8.5 1Z"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({
  expanded,
  color,
}: {
  expanded: boolean;
  color: string;
}) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{
        flexShrink: 0,
        transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 150ms ease",
      }}
    >
      <path
        d="M6 4l4 4-4 4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const JSON_TRUNCATE_LIMIT = 500;

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StatusDot({
  status,
  colors,
}: {
  status: ToolCallStatus;
  colors: { pending: string; running: string; complete: string; error: string };
}) {
  const color = colors[status];
  const isPulsing = status === "running";

  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: color,
        flexShrink: 0,
      }}
      className={cn(isPulsing && "animate-pulse")}
    />
  );
}

const STATUS_LABEL: Record<ToolCallStatus, string> = {
  pending: "Pending",
  running: "Running...",
  complete: "Complete",
  error: "Error",
};

// ---------------------------------------------------------------------------
// CollapsibleSection
// ---------------------------------------------------------------------------

function CollapsibleSection({
  label,
  defaultExpanded,
  badge,
  children,
  borderColor,
  hoverBg,
  textColor,
  softColor,
}: {
  label: string;
  defaultExpanded: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
  borderColor: string;
  hoverBg: string;
  textColor: string;
  softColor: string;
}) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs"
        style={{
          color: textColor,
          borderTop: `1px solid ${borderColor}`,
          background: "transparent",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = hoverBg;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <ChevronIcon expanded={expanded} color={softColor} />
        <span className="font-medium">{label}</span>
        {badge && <span className="ml-auto">{badge}</span>}
      </button>
      {expanded && (
        <div className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// JsonBlock — renders truncated JSON in a <pre>
// ---------------------------------------------------------------------------

function JsonBlock({
  value,
  textColor,
  bgColor,
  borderColor,
}: {
  value: unknown;
  textColor: string;
  bgColor: string;
  borderColor: string;
}) {
  const [showFull, setShowFull] = React.useState(false);
  const raw = JSON.stringify(value, null, 2);
  const isTruncated = raw.length > JSON_TRUNCATE_LIMIT;
  const display = !showFull && isTruncated ? raw.slice(0, JSON_TRUNCATE_LIMIT) + "\u2026" : raw;

  return (
    <div>
      <pre
        className="font-mono overflow-x-auto rounded-md p-2 text-xs leading-relaxed"
        style={{
          color: textColor,
          background: bgColor,
          border: `1px solid ${borderColor}`,
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {display}
      </pre>
      {isTruncated && (
        <button
          type="button"
          onClick={() => setShowFull((v) => !v)}
          className="mt-1 text-xs font-medium"
          style={{ color: textColor, cursor: "pointer", background: "none", border: "none", padding: 0 }}
        >
          {showFull ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ToolCallCard
// ---------------------------------------------------------------------------

export function ToolCallCard({
  name,
  args,
  status,
  result,
  error,
  duration,
  id,
  defaultExpanded = false,
  disableAnimations = false,
  className,
  style,
}: ToolCallProps) {
  const glass = useGlassTokens();
  const colors = useColorTokens();
  const motion = useMotionTokens();
  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = !disableAnimations && !reducedMotion;

  const statusColors = {
    pending: colors.text.soft,
    running: colors.accent.primary,
    complete: colors.accent.positive,
    error: colors.accent.destructive,
  };

  const statusColor = statusColors[status];

  // Inner bg for JSON blocks: slightly darker than card bg
  const jsonBg = "rgba(0,0,0,0.2)";

  return (
    <div
      className={cn("rounded-lg overflow-hidden", className)}
      style={{
        background: glass.cardBg,
        border: `1px solid ${glass.cardBorder}`,
        transition: shouldAnimate ? `border-color ${motion.fast.duration}s ease` : undefined,
        ...style,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5"
      >
        <ToolIcon color={colors.accent.primary} />
        <span
          className="font-mono text-sm truncate flex-1"
          style={{ color: colors.text.primary }}
          title={name}
        >
          {name}
        </span>
        {duration != null && (status === "complete" || status === "error") && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-mono"
            style={{
              color: colors.text.soft,
              background: "rgba(255,255,255,0.06)",
            }}
          >
            {formatDuration(duration)}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <StatusDot status={status} colors={statusColors} />
          <span
            className="text-xs font-medium"
            style={{ color: statusColor }}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
      </div>

      {/* ID row (if provided) */}
      {id && (
        <div
          className="px-3 pb-1 font-mono text-[10px] truncate"
          style={{
            color: colors.text.soft,
            borderTop: `1px solid ${glass.cardBorder}`,
            paddingTop: 4,
          }}
        >
          id: {id}
        </div>
      )}

      {/* Arguments section */}
      {args && Object.keys(args).length > 0 && (
        <CollapsibleSection
          label="Arguments"
          defaultExpanded={defaultExpanded}
          borderColor={glass.cardBorder}
          hoverBg={glass.hoverBg}
          textColor={colors.text.muted}
          softColor={colors.text.soft}
        >
          <JsonBlock
            value={args}
            textColor={colors.text.muted}
            bgColor={jsonBg}
            borderColor={glass.cardBorder}
          />
        </CollapsibleSection>
      )}

      {/* Result section (when complete) */}
      {status === "complete" && result !== undefined && (
        <CollapsibleSection
          label="Result"
          defaultExpanded={defaultExpanded}
          borderColor={glass.cardBorder}
          hoverBg={glass.hoverBg}
          textColor={colors.text.muted}
          softColor={colors.text.soft}
        >
          <JsonBlock
            value={result}
            textColor={colors.text.muted}
            bgColor={jsonBg}
            borderColor={glass.cardBorder}
          />
        </CollapsibleSection>
      )}

      {/* Error section */}
      {status === "error" && error && (
        <div
          className="px-3 py-2 text-xs font-mono"
          style={{
            color: colors.accent.destructive,
            borderTop: `1px solid ${glass.cardBorder}`,
            background: "rgba(255,0,0,0.04)",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

// =============================================================================
// TYPES
// =============================================================================

export interface ReplayControlsProps {
  currentTime: number;
  timeRange: [number, number];
  playing: boolean;
  speed: number;
  onTimeChange: (t: number) => void;
  onPlayPause: () => void;
  onSpeedChange: (speed: number) => void;
  onSkipStart: () => void;
  onSkipEnd: () => void;
  incidents?: Array<{ time: number; severity: string }>;
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SPEED_OPTIONS = [1, 2, 5, 10] as const;

// =============================================================================
// HELPERS
// =============================================================================

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor(ms % 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function severityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-500";
    case "warning":
      return "bg-amber-500";
    default:
      return "bg-cyan-400";
  }
}

// =============================================================================
// TRANSPORT BUTTON
// =============================================================================

function TransportButton({
  label,
  onClick,
  active = false,
  ariaLabel,
}: {
  label: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lg",
        "font-mono text-xs text-[#E2E8F0] transition-all duration-150",
        "hover:bg-white/[0.06]",
        active && "text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)]",
      )}
    >
      {label}
    </button>
  );
}

// =============================================================================
// REPLAY CONTROLS
// =============================================================================

export function ReplayControls({
  currentTime,
  timeRange,
  playing,
  speed,
  onTimeChange,
  onPlayPause,
  onSpeedChange,
  onSkipStart,
  onSkipEnd,
  incidents,
  className,
}: ReplayControlsProps) {
  const [start, end] = timeRange;
  const duration = end - start;
  const progress = duration > 0 ? (currentTime - start) / duration : 0;
  const isEpochRange = start > 1_000_000_000_000 && end > 1_000_000_000_000;
  const elapsedTime = Math.max(0, currentTime - start);

  const trackRef = React.useRef<HTMLDivElement>(null);

  const handleTrackClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onTimeChange(start + fraction * duration);
    },
    [start, duration, onTimeChange],
  );

  const handleStepBack = React.useCallback(() => {
    const step = duration * 0.01;
    onTimeChange(Math.max(start, currentTime - step));
  }, [currentTime, start, duration, onTimeChange]);

  const handleStepForward = React.useCallback(() => {
    const step = duration * 0.01;
    onTimeChange(Math.min(end, currentTime + step));
  }, [currentTime, end, duration, onTimeChange]);

  return (
    <div
      className={cn(
        "absolute bottom-4 left-1/2 -translate-x-1/2 z-20",
        "flex items-center gap-3 px-4 py-2.5",
        "bg-[rgba(2,4,10,0.85)] backdrop-blur-xl",
        "border border-white/[0.06] rounded-xl",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
        className,
      )}
      role="toolbar"
      aria-label="Replay controls"
    >
      {/* Transport buttons */}
      <div className="flex items-center gap-0.5">
        <TransportButton label="&#x23EE;" onClick={onSkipStart} ariaLabel="Skip to start" />
        <TransportButton label="&#x23EA;" onClick={handleStepBack} ariaLabel="Step back" />
        <TransportButton
          label={playing ? "\u23F8" : "\u25B6"}
          onClick={onPlayPause}
          active={playing}
          ariaLabel={playing ? "Pause" : "Play"}
        />
        <TransportButton label="&#x23E9;" onClick={handleStepForward} ariaLabel="Step forward" />
        <TransportButton label="&#x23ED;" onClick={onSkipEnd} ariaLabel="Skip to end" />
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/[0.06]" aria-hidden="true" />

      {/* Scrub bar */}
      <div className="flex flex-col gap-1 min-w-[240px]">
        <div
          ref={trackRef}
          className="relative h-2 rounded-full bg-white/[0.04] border border-white/[0.06] cursor-pointer"
          onClick={handleTrackClick}
          role="slider"
          aria-label="Timeline scrubber"
          aria-valuemin={start}
          aria-valuemax={end}
          aria-valuenow={currentTime}
          tabIndex={0}
        >
          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-cyan-400/30"
            style={{ width: `${progress * 100}%` }}
          />

          {/* Incident markers */}
          {incidents?.map((incident, i) => {
            const pos = duration > 0 ? ((incident.time - start) / duration) * 100 : 0;
            return (
              <div
                key={i}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
                  severityColor(incident.severity),
                )}
                style={{ left: `${Math.max(0, Math.min(100, pos))}%` }}
                title={
                  isEpochRange
                    ? `${incident.severity} at ${new Date(incident.time).toISOString().replace("T", " ").replace("Z", "")} (+${formatTimestamp(Math.max(0, incident.time - start))})`
                    : `${incident.severity} at ${formatTimestamp(Math.max(0, incident.time - start))}`
                }
              />
            );
          })}

          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
            style={{ left: `calc(${progress * 100}% - 6px)` }}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/[0.06]" aria-hidden="true" />

      {/* Time display */}
      <span
        className="font-mono text-xs text-[#E2E8F0] tabular-nums whitespace-nowrap"
        title={
          isEpochRange
            ? new Date(currentTime).toISOString().replace("T", " ").replace("Z", "")
            : undefined
        }
      >
        {formatTimestamp(elapsedTime)}
      </span>

      {/* Divider */}
      <div className="w-px h-6 bg-white/[0.06]" aria-hidden="true" />

      {/* Speed selector */}
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Playback speed">
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={speed === s}
            onClick={() => onSpeedChange(s)}
            className={cn(
              "px-2 py-0.5 rounded-md font-mono text-[10px] uppercase tracking-[0.08em]",
              "transition-all duration-150",
              speed === s
                ? "text-cyan-400 bg-cyan-400/10 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                : "text-[#64748B] hover:text-[#E2E8F0] hover:bg-white/[0.04]",
            )}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}

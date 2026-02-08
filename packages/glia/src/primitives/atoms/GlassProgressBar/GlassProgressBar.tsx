"use client";

import { cn, prefersReducedMotion } from "../../../lib/utils";
import { motion } from "framer-motion";
import React, { useMemo } from "react";

export interface GlassProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Progress value 0-1. Omit for indeterminate mode. */
  value?: number;
  /** Color theme */
  theme?: "cyan" | "magenta" | "emerald" | "rainbow";
  /** Bar size */
  size?: "sm" | "default" | "lg";
  /** Show numeric value */
  showValue?: boolean;
  /** Value suffix (default "%") */
  suffix?: string;
  /** Transition duration in ms */
  animationDuration?: number;
  /** Disable all animations */
  disableAnimations?: boolean;
  /** Accessible label */
  label?: string;
  /** Label position */
  labelPosition?: "top" | "inline";
  /** Enable glow effect on fill */
  glow?: boolean;
  /** Enable diagonal stripe pattern */
  striped?: boolean;
}

const sizeMap = {
  sm: "h-1",
  default: "h-2",
  lg: "h-3",
} as const;

function getThemeGradient(theme: NonNullable<GlassProgressBarProps["theme"]>) {
  switch (theme) {
    case "cyan":
      return "linear-gradient(90deg, #22d3ee, #34d399)";
    case "magenta":
      return "linear-gradient(90deg, #e879f9, #f472b6)";
    case "emerald":
      return "linear-gradient(90deg, #34d399, #22d3ee)";
    case "rainbow":
      return "linear-gradient(90deg, #22d3ee, #e879f9, #34d399)";
  }
}

function getGlowShadow(theme: NonNullable<GlassProgressBarProps["theme"]>) {
  switch (theme) {
    case "cyan":
      return "0 0 8px rgba(34,211,238,0.6), 0 0 20px rgba(34,211,238,0.3)";
    case "magenta":
      return "0 0 8px rgba(232,121,249,0.6), 0 0 20px rgba(232,121,249,0.3)";
    case "emerald":
      return "0 0 8px rgba(52,211,153,0.6), 0 0 20px rgba(52,211,153,0.3)";
    case "rainbow":
      return "0 0 8px rgba(34,211,238,0.6), 0 0 20px rgba(232,121,249,0.3)";
  }
}

/** Subtle leading-edge glow for the fill bar (always on) */
function getLeadingEdgeGlow(theme: NonNullable<GlassProgressBarProps["theme"]>) {
  switch (theme) {
    case "cyan":
      return "0 0 8px rgba(34,211,238,0.4)";
    case "magenta":
      return "0 0 8px rgba(232,121,249,0.4)";
    case "emerald":
      return "0 0 8px rgba(52,211,153,0.4)";
    case "rainbow":
      return "0 0 8px rgba(34,211,238,0.4)";
  }
}

const STRIPE_BG =
  "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px)";

export function GlassProgressBar({
  value,
  theme = "cyan",
  size = "default",
  showValue = false,
  suffix = "%",
  animationDuration = 600,
  disableAnimations = false,
  label,
  labelPosition = "top",
  glow = false,
  striped = false,
  className,
  ...props
}: GlassProgressBarProps) {
  const reducedMotion = prefersReducedMotion();
  const shouldAnimate = !disableAnimations && !reducedMotion;

  const isIndeterminate = value === undefined || value === null;
  const clampedValue = useMemo(
    () => (isIndeterminate ? 0 : Math.max(0, Math.min(1, value!))),
    [isIndeterminate, value]
  );

  const displayPercent = Math.round(clampedValue * 100);
  const gradient = getThemeGradient(theme);
  const glowShadow = glow ? getGlowShadow(theme) : getLeadingEdgeGlow(theme);

  const isInline = labelPosition === "inline";

  const trackContent = (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-full",
        sizeMap[size]
      )}
      style={{
        background: "rgba(2, 4, 10, 0.6)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      {isIndeterminate ? (
        /* Indeterminate sliding bar */
        <motion.div
          className={cn("absolute inset-y-0 rounded-full", sizeMap[size])}
          style={{
            width: "40%",
            background: gradient,
            boxShadow: glowShadow,
          }}
          animate={
            shouldAnimate
              ? { left: ["-40%", "100%"] }
              : { left: "0%" }
          }
          transition={
            shouldAnimate
              ? {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : undefined
          }
        />
      ) : (
        /* Determinate fill */
        <motion.div
          className={cn("h-full rounded-full")}
          style={{
            background: gradient,
            boxShadow: glowShadow,
            transition: "box-shadow 0.5s ease",
            ...(striped
              ? { backgroundImage: STRIPE_BG, backgroundSize: "16px 16px" }
              : {}),
          }}
          initial={shouldAnimate ? { width: "0%" } : { width: `${clampedValue * 100}%` }}
          animate={{ width: `${clampedValue * 100}%` }}
          transition={{
            duration: shouldAnimate ? animationDuration / 1000 : 0,
            ease: "easeOut",
          }}
        />
      )}
    </div>
  );

  return (
    <div
      className={cn("w-full", className)}
      role="progressbar"
      aria-valuenow={isIndeterminate ? undefined : displayPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? (isIndeterminate ? "Loading" : `${displayPercent}${suffix}`)}
      {...props}
    >
      {/* Top label layout */}
      {label && !isInline && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          {showValue && !isIndeterminate && (
            <span className="text-sm tabular-nums text-muted-foreground">
              {displayPercent}
              {suffix}
            </span>
          )}
        </div>
      )}

      {/* Inline label layout */}
      {isInline ? (
        <div className="flex items-center gap-3">
          {label && (
            <span className="text-sm font-medium text-muted-foreground shrink-0">
              {label}
            </span>
          )}
          <div className="flex-1">{trackContent}</div>
          {showValue && !isIndeterminate && (
            <span className="text-sm tabular-nums text-muted-foreground shrink-0">
              {displayPercent}
              {suffix}
            </span>
          )}
        </div>
      ) : (
        <>
          {trackContent}
          {/* Show value below if no label was provided */}
          {showValue && !isIndeterminate && !label && (
            <div className="flex justify-end mt-1">
              <span className="text-sm tabular-nums text-muted-foreground">
                {displayPercent}
                {suffix}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

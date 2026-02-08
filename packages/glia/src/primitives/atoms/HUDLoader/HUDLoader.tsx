"use client";

import { cn, prefersReducedMotion } from "../../../lib/utils";
import * as React from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface HUDLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  progress?: number;
  variant?: "default" | "minimal" | "elaborate";
  className?: string;
}

// ============================================================================
// SIZE MAP
// ============================================================================

const sizeMap: Record<NonNullable<HUDLoaderProps["size"]>, number> = {
  sm: 24,
  md: 48,
  lg: 80,
  xl: 120,
};

// ============================================================================
// KEYFRAMES (injected once)
// ============================================================================

const STYLE_ID = "hud-loader-keyframes";

function ensureKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
@keyframes hud-spin-cw { to { transform: rotate(360deg); } }
@keyframes hud-spin-ccw { to { transform: rotate(-360deg); } }
@keyframes hud-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
`;
  document.head.appendChild(style);
}

// ============================================================================
// HUD LOADER
// ============================================================================

export function HUDLoader({
  size = "md",
  label,
  progress,
  variant = "default",
  className,
}: HUDLoaderProps) {
  const px = sizeMap[size];
  const reducedMotion = prefersReducedMotion();
  const filterId = React.useId();

  React.useEffect(() => {
    ensureKeyframes();
  }, []);

  // Ring geometry
  const center = px / 2;
  const outerR = px * 0.45;
  const middleR = px * 0.33;
  const innerR = px * 0.2;
  const strokeW = Math.max(2, px * 0.06);

  // Arc lengths via stroke-dasharray
  const outerCirc = 2 * Math.PI * outerR;
  const outerArc = outerCirc * (270 / 360);

  const middleCirc = 2 * Math.PI * middleR;
  const middleArc = middleCirc * (180 / 360);

  const innerCirc = 2 * Math.PI * innerR;
  const innerArc = innerCirc * (120 / 360);

  const showProgress = progress != null;
  const showLabel = label != null;
  const isElaborate = variant === "elaborate";
  const isMinimal = variant === "minimal";

  // Font size based on ring size
  const fontSize = Math.max(8, px * 0.18);
  const labelFontSize = Math.max(8, Math.min(10, px * 0.1));

  return (
    <div
      className={cn("inline-flex flex-col items-center justify-center gap-1.5", className)}
      role="status"
      aria-label={label ?? (showProgress ? `Loading ${Math.round(progress! * 100)}%` : "Loading")}
    >
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <filter id={`glow-${filterId}`}>
            <feGaussianBlur stdDeviation={Math.max(1, px * 0.03)} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring: cyan, clockwise */}
        <circle
          cx={center}
          cy={center}
          r={outerR}
          stroke="#22D3EE"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={`${outerArc} ${outerCirc - outerArc}`}
          filter={`url(#glow-${filterId})`}
          style={
            reducedMotion
              ? {}
              : {
                  transformOrigin: `${center}px ${center}px`,
                  animation: "hud-spin-cw 2s linear infinite",
                }
          }
        />

        {/* Middle ring: magenta, counter-clockwise */}
        {!isMinimal && (
          <circle
            cx={center}
            cy={center}
            r={middleR}
            stroke="#F43F5E"
            strokeWidth={strokeW * 0.8}
            strokeLinecap="round"
            strokeDasharray={`${middleArc} ${middleCirc - middleArc}`}
            filter={`url(#glow-${filterId})`}
            style={
              reducedMotion
                ? {}
                : {
                    transformOrigin: `${center}px ${center}px`,
                    animation: "hud-spin-ccw 3s linear infinite",
                  }
            }
          />
        )}

        {/* Elaborate: inner emerald ring */}
        {isElaborate && (
          <circle
            cx={center}
            cy={center}
            r={innerR}
            stroke="#10B981"
            strokeWidth={strokeW * 0.6}
            strokeLinecap="round"
            strokeDasharray={`${innerArc} ${innerCirc - innerArc}`}
            filter={`url(#glow-${filterId})`}
            style={
              reducedMotion
                ? {}
                : {
                    transformOrigin: `${center}px ${center}px`,
                    animation: "hud-spin-cw 4s linear infinite",
                  }
            }
          />
        )}

        {/* Center content: progress text or pulsing dot */}
        {showProgress ? (
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#22D3EE"
            fontFamily="monospace"
            fontSize={fontSize}
            fontWeight="bold"
          >
            {Math.round(progress! * 100)}
          </text>
        ) : (
          !isMinimal && (
            <circle
              cx={center}
              cy={center}
              r={Math.max(1.5, px * 0.03)}
              fill="#22D3EE"
              style={
                reducedMotion
                  ? {}
                  : { animation: "hud-pulse 1.5s ease-in-out infinite" }
              }
            />
          )
        )}
      </svg>

      {/* Label */}
      {showLabel && (
        <span
          className="text-white/60"
          style={{
            fontFamily: "monospace",
            fontSize: labelFontSize,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
          aria-hidden="true"
        >
          {label}
        </span>
      )}
    </div>
  );
}

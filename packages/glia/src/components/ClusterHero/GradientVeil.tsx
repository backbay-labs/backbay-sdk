"use client";

import { cn } from "../../lib/utils";

export interface GradientVeilProps {
  className?: string;
  /** Intensity of the gradient (0-1, default 1) */
  intensity?: number;
}

/**
 * A bottom-anchored gradient overlay for text legibility over video backgrounds.
 * The gradient fades from opaque black at the bottom to transparent at the top.
 */
export function GradientVeil({ className, intensity = 1 }: GradientVeilProps) {
  // Scale alpha values by intensity
  const a1 = (0.85 * intensity).toFixed(2);
  const a2 = (0.5 * intensity).toFixed(2);
  const a3 = (0.2 * intensity).toFixed(2);

  return (
    <div
      className={cn("absolute inset-0 pointer-events-none", className)}
      style={{
        background: `linear-gradient(
          to top,
          rgba(0, 0, 0, ${a1}) 0%,
          rgba(0, 0, 0, ${a2}) 30%,
          rgba(0, 0, 0, ${a3}) 50%,
          transparent 70%
        )`,
      }}
    />
  );
}

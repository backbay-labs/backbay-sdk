"use client";

import * as React from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";
import { getPerformanceConfig } from "../shared/performance";
import { NOISE_DATA_URL } from "../shared/noise";
import type { FogLayerProps } from "./types";
import { FOG_CONFIGS } from "./types";

export function FogLayer({
  type,
  density: propDensity,
  color: propColor,
  height = 0.4,
  animated = true,
  intensity = 1,
  stylePreset = 'ui',
  enabled = true,
  className,
  style,
}: FogLayerProps) {
  const reducedMotion = useReducedMotion();
  const perfConfig = getPerformanceConfig();
  const [offset, setOffset] = React.useState(0);

  const config = FOG_CONFIGS[type];
  const density = propDensity ?? config.defaultDensity;
  const color = propColor ?? config.defaultColor;

  const shouldAnimate = animated && !reducedMotion && perfConfig.tier !== 'minimal';

  // Animation loop for mist/volumetric movement
  React.useEffect(() => {
    if (!shouldAnimate || !enabled || config.animationSpeed === 0) return;

    let frame: number;
    const animate = () => {
      setOffset(prev => (prev + config.animationSpeed) % 100);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [shouldAnimate, enabled, config.animationSpeed]);

  if (!enabled) return null;

  const gradientStyle = React.useMemo(() => {
    const opacity = density * intensity;

    switch (type) {
      case 'depth':
        return {
          background: `linear-gradient(to top, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}, transparent)`,
        };
      case 'ground':
        return {
          background: `linear-gradient(to top,
            ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 0%,
            ${color}${Math.round(opacity * 0.5 * 255).toString(16).padStart(2, '0')} ${height * 50}%,
            transparent ${height * 100}%)`,
        };
      case 'volumetric':
        return {
          background: `
            radial-gradient(ellipse 120% 60% at 50% ${100 - offset}%, ${color}${Math.round(opacity * 0.6 * 255).toString(16).padStart(2, '0')}, transparent),
            radial-gradient(ellipse 100% 40% at ${30 + offset * 0.2}% 80%, ${color}${Math.round(opacity * 0.4 * 255).toString(16).padStart(2, '0')}, transparent),
            radial-gradient(ellipse 80% 50% at ${70 - offset * 0.15}% 90%, ${color}${Math.round(opacity * 0.5 * 255).toString(16).padStart(2, '0')}, transparent)
          `,
        };
      case 'mist':
        return {
          background: `
            radial-gradient(ellipse 150% 80% at ${40 + Math.sin(offset * 0.1) * 20}% ${60 + Math.cos(offset * 0.08) * 10}%, ${color}${Math.round(opacity * 0.3 * 255).toString(16).padStart(2, '0')}, transparent),
            radial-gradient(ellipse 120% 60% at ${60 + Math.cos(offset * 0.12) * 15}% ${40 + Math.sin(offset * 0.09) * 15}%, ${color}${Math.round(opacity * 0.25 * 255).toString(16).padStart(2, '0')}, transparent),
            linear-gradient(to top, ${color}${Math.round(opacity * 0.15 * 255).toString(16).padStart(2, '0')}, transparent 50%)
          `,
        };
      default:
        return {};
    }
  }, [type, color, density, intensity, height, offset]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0",
        className
      )}
      style={{
        ...gradientStyle,
        ...style,
      }}
      aria-hidden="true"
    >
      {stylePreset === 'cinematic' && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${NOISE_DATA_URL}")`,
            backgroundRepeat: 'repeat',
            backgroundSize: `${260 - Math.round(density * 80)}px ${260 - Math.round(density * 80)}px`,
            backgroundPosition: `${offset * 30}px ${offset * 20}px`,
            opacity: Math.min(0.18, 0.04 + density * intensity * 0.12),
            mixBlendMode: 'soft-light',
            filter: 'blur(0.6px) contrast(1.2)',
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

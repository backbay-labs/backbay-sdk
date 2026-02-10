"use client";

import * as React from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "../../../lib/utils";
import { getPerformanceConfig } from "../shared/performance";
import { NOISE_DATA_URL } from "../shared/noise";
import type { VolumetricLightProps } from "./types";
import { LIGHT_CONFIGS } from "./types";

export function VolumetricLight({
  type,
  source = { x: 0.5, y: 0 },
  color: propColor,
  intensity = 0.5,
  decay = 0.5,
  angle = 0,
  width = 0.3,
  animated: propAnimated,
  stylePreset = 'ui',
  enabled = true,
  className,
  style,
}: VolumetricLightProps) {
  const reducedMotion = useReducedMotion();
  const perfConfig = getPerformanceConfig();
  const [time, setTime] = React.useState(0);

  const config = LIGHT_CONFIGS[type];
  const color = propColor ?? config.defaultColor;
  const shouldAnimate = (propAnimated ?? config.animated) && !reducedMotion && perfConfig.tier !== 'minimal';

  React.useEffect(() => {
    if (!shouldAnimate || !enabled) return;
    let frame: number;
    const animate = () => {
      setTime(prev => prev + 0.016);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [shouldAnimate, enabled]);

  const lightStyle = React.useMemo((): React.CSSProperties => {
    const opacity = intensity * config.defaultIntensity;
    const d = Math.max(0, Math.min(1, decay));

    switch (type) {
      case 'godrays':
        return {
          background: `conic-gradient(from ${angle}deg at ${source.x * 100}% ${source.y * 100}%,
            ${color}${Math.round(opacity * 0.4 * 255).toString(16).padStart(2, '0')} 0deg,
            transparent 15deg,
            ${color}${Math.round(opacity * 0.3 * 255).toString(16).padStart(2, '0')} 30deg,
            transparent 45deg,
            ${color}${Math.round(opacity * 0.35 * 255).toString(16).padStart(2, '0')} 60deg,
            transparent 75deg,
            ${color}${Math.round(opacity * 0.25 * 255).toString(16).padStart(2, '0')} 90deg,
            transparent 105deg
          )`,
          mixBlendMode: config.blendMode as React.CSSProperties['mixBlendMode'],
        };

      case 'shaft':
        return {
          background: `linear-gradient(${angle}deg,
            transparent ${(source.x - width/2) * 100}%,
            ${color}${Math.round(opacity * 0.5 * 255).toString(16).padStart(2, '0')} ${source.x * 100}%,
            transparent ${(source.x + width/2) * 100}%
          )`,
          mixBlendMode: config.blendMode as React.CSSProperties['mixBlendMode'],
        };

      case 'bloom': {
        const bloomInner = 18 + d * 22; // 18% → 40%
        const bloomMid = 42 + d * 24; // 42% → 66%
        return {
          background: `radial-gradient(circle at ${source.x * 100}% ${source.y * 100}%,
            ${color}${Math.round(opacity * 0.6 * 255).toString(16).padStart(2, '0')},
            ${color}${Math.round(opacity * 0.3 * 255).toString(16).padStart(2, '0')} ${bloomInner}%,
            transparent ${bloomMid}%
          )`,
          mixBlendMode: config.blendMode as React.CSSProperties['mixBlendMode'],
          filter: 'blur(20px)',
        };
      }

      case 'flare':
        const flareOffset = Math.sin(time * 2) * 5;
        return {
          background: `
            radial-gradient(ellipse 20% 5% at ${source.x * 100}% ${source.y * 100 + flareOffset}%, ${color}${Math.round(opacity * 0.8 * 255).toString(16).padStart(2, '0')}, transparent),
            radial-gradient(ellipse 5% 20% at ${source.x * 100}% ${source.y * 100}%, ${color}${Math.round(opacity * 0.6 * 255).toString(16).padStart(2, '0')}, transparent),
            radial-gradient(circle at ${source.x * 100}% ${source.y * 100}%, ${color}${Math.round(opacity * 0.4 * 255).toString(16).padStart(2, '0')}, transparent 20%)
          `,
          mixBlendMode: config.blendMode as React.CSSProperties['mixBlendMode'],
        };

      case 'caustics':
        const causticPhase = time * 0.5;
        return {
          background: `
            radial-gradient(ellipse at ${50 + Math.sin(causticPhase) * 20}% ${50 + Math.cos(causticPhase * 1.3) * 20}%, ${color}${Math.round(opacity * 0.3 * 255).toString(16).padStart(2, '0')}, transparent 40%),
            radial-gradient(ellipse at ${50 + Math.cos(causticPhase * 0.7) * 25}% ${50 + Math.sin(causticPhase * 1.1) * 25}%, ${color}${Math.round(opacity * 0.25 * 255).toString(16).padStart(2, '0')}, transparent 35%)
          `,
          mixBlendMode: config.blendMode as React.CSSProperties['mixBlendMode'],
        };

      case 'scanner':
        const scanAngle = (time * 60) % 360;
        return {
          background: `conic-gradient(from ${scanAngle}deg at ${source.x * 100}% ${source.y * 100}%,
            ${color}${Math.round(opacity * 0.6 * 255).toString(16).padStart(2, '0')} 0deg,
            transparent 30deg,
            transparent 360deg
          )`,
          mixBlendMode: config.blendMode as React.CSSProperties['mixBlendMode'],
        };

      case 'neon':
        const flickerIntensity = 0.9 + Math.sin(time * 20) * 0.1;
        return {
          background: `linear-gradient(${angle}deg, transparent 40%, ${color}${Math.round(opacity * flickerIntensity * 0.8 * 255).toString(16).padStart(2, '0')} 50%, transparent 60%)`,
          boxShadow: `0 0 30px ${color}${Math.round(opacity * flickerIntensity * 0.5 * 255).toString(16).padStart(2, '0')}, 0 0 60px ${color}${Math.round(opacity * flickerIntensity * 0.3 * 255).toString(16).padStart(2, '0')}`,
          mixBlendMode: config.blendMode as React.CSSProperties['mixBlendMode'],
        };

      case 'spotlight': {
        const spotMid = 40 + d * 35; // 40% → 75%
        return {
          background: `radial-gradient(ellipse ${width * 100}% ${width * 150}% at ${source.x * 100}% ${source.y * 100}%,
            ${color}${Math.round(opacity * 0.7 * 255).toString(16).padStart(2, '0')},
            ${color}${Math.round(opacity * 0.3 * 255).toString(16).padStart(2, '0')} ${spotMid}%,
            transparent 100%
          )`,
          mixBlendMode: config.blendMode as React.CSSProperties['mixBlendMode'],
        };
      }

      case 'rim':
        return {
          boxShadow: `inset 0 0 ${60 * intensity}px ${color}${Math.round(opacity * 0.6 * 255).toString(16).padStart(2, '0')}`,
          mixBlendMode: config.blendMode as React.CSSProperties['mixBlendMode'],
        };

      case 'laser':
        const laserOffset = Math.sin(time * 3) * 10;
        return {
          background: `linear-gradient(${angle + laserOffset}deg,
            transparent 49%,
            ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 49.5%,
            ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 50.5%,
            transparent 51%
          )`,
          mixBlendMode: config.blendMode as React.CSSProperties['mixBlendMode'],
        };

      default:
        return {};
    }
  }, [type, source, color, intensity, decay, angle, width, time, config]);

  if (!enabled) return null;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{ ...lightStyle, ...style }}
      aria-hidden="true"
    >
      {stylePreset === 'cinematic' && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${NOISE_DATA_URL}")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '240px 240px',
            backgroundPosition: `${time * 160}px ${time * 110}px`,
            opacity: Math.min(0.12, 0.03 + intensity * 0.06),
            mixBlendMode: 'overlay',
            filter: 'blur(0.4px) contrast(1.25)',
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

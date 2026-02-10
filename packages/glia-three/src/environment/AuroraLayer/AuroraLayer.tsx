"use client";

import * as React from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";
import { getPerformanceConfig } from "../shared/performance";
import { NOISE_DATA_URL } from "../shared/noise";
import type { AuroraLayerProps } from "./types";
import { AURORA_CONFIGS } from "./types";

export function AuroraLayer({
  type,
  colors: propColors,
  intensity = 1,
  speed = 1,
  stylePreset = 'ui',
  complexity: propComplexity,
  direction = 'vertical',
  blend = 'normal',
  enabled = true,
  className,
  style,
}: AuroraLayerProps) {
  const reducedMotion = useReducedMotion();
  const perfConfig = getPerformanceConfig();
  const [time, setTime] = React.useState(0);
  const lightningRef = React.useRef(0);

  const config = AURORA_CONFIGS[type];
  const colors = propColors ?? config.colors;
  const complexity = propComplexity ?? config.complexity;
  const shouldAnimate = !reducedMotion && perfConfig.tier !== 'minimal';

  React.useEffect(() => {
    if (!shouldAnimate || !enabled) return;
    lightningRef.current = 0;
    let frame: number;
    const animate = () => {
      if (type === 'storm') {
        // Occasional lightning with short decay (avoid per-frame random strobe).
        const chance = stylePreset === 'cinematic' ? 0.003 : 0.007;
        if (Math.random() < chance) lightningRef.current = 1;
        lightningRef.current *= stylePreset === 'cinematic' ? 0.92 : 0.88;
        if (lightningRef.current < 0.02) lightningRef.current = 0;
      }

      setTime(prev => prev + config.animationSpeed * speed);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [shouldAnimate, enabled, type, stylePreset, config.animationSpeed, speed]);

  const lightning = type === 'storm' ? lightningRef.current : 0;

  const auroraStyle = React.useMemo((): React.CSSProperties => {
    const opacity = intensity;
    const c = colors.map(color => `${color}${Math.round(opacity * 200).toString(16).padStart(2, '0')}`);

    switch (type) {
      case 'aurora':
        return {
          background: `
            linear-gradient(${direction === 'horizontal' ? '90deg' : '180deg'},
              ${c[0]} ${Math.sin(time) * 20 + 10}%,
              ${c[1]} ${50 + Math.cos(time * 1.3) * 20}%,
              ${c[2]} ${90 + Math.sin(time * 0.7) * 10}%
            )
          `,
          filter: `blur(${40 + Math.sin(time * 2) * 10}px)`,
          mixBlendMode: blend as React.CSSProperties['mixBlendMode'],
        };

      case 'nebula':
        return {
          background: `
            radial-gradient(ellipse at ${30 + Math.sin(time) * 20}% ${40 + Math.cos(time * 0.8) * 20}%, ${c[0]}, transparent 50%),
            radial-gradient(ellipse at ${70 + Math.cos(time * 1.2) * 15}% ${60 + Math.sin(time * 0.9) * 15}%, ${c[1]}, transparent 40%),
            radial-gradient(ellipse at ${50 + Math.sin(time * 0.7) * 25}% ${50 + Math.cos(time * 1.1) * 25}%, ${c[2]}, transparent 45%)
          `,
          mixBlendMode: blend as React.CSSProperties['mixBlendMode'],
        };

      case 'gradient':
        return {
          background: `linear-gradient(${direction === 'horizontal' ? '90deg' : direction === 'radial' ? '135deg' : '180deg'}, ${c.join(', ')})`,
          mixBlendMode: blend as React.CSSProperties['mixBlendMode'],
        };

      case 'stars':
        // Generate pseudo-random star positions based on complexity
        const starGradients = Array.from({ length: Math.min(complexity * 10, 50) }, (_, i) => {
          const x = ((i * 17 + Math.sin(i) * 30) % 100);
          const y = ((i * 23 + Math.cos(i) * 40) % 100);
          const twinkle = Math.sin(time * (2 + i * 0.1)) * 0.5 + 0.5;
          const size = 1 + (i % 3);
          return `radial-gradient(circle ${size}px at ${x}% ${y}%, ${colors[i % colors.length]}${Math.round(twinkle * opacity * 255).toString(16).padStart(2, '0')}, transparent ${size}px)`;
        });
        return {
          background: starGradients.join(', '),
          mixBlendMode: blend as React.CSSProperties['mixBlendMode'],
        };

      case 'clouds':
        return {
          background: `
            radial-gradient(ellipse 80% 50% at ${20 + Math.sin(time) * 10}% ${30 + Math.cos(time * 0.5) * 10}%, ${c[0]}, transparent),
            radial-gradient(ellipse 60% 40% at ${60 + Math.cos(time * 0.7) * 15}% ${50 + Math.sin(time * 0.6) * 10}%, ${c[1]}, transparent),
            radial-gradient(ellipse 70% 45% at ${40 + Math.sin(time * 0.8) * 12}% ${70 + Math.cos(time * 0.4) * 8}%, ${c[2]}, transparent)
          `,
          filter: 'blur(30px)',
          mixBlendMode: blend as React.CSSProperties['mixBlendMode'],
        };

      case 'sunset':
        return {
          background: `linear-gradient(180deg,
            ${c[2]} 0%,
            ${c[1]} ${40 + Math.sin(time) * 5}%,
            ${c[0]} ${70 + Math.cos(time * 0.5) * 5}%,
            ${c[0]}00 100%
          )`,
          mixBlendMode: blend as React.CSSProperties['mixBlendMode'],
        };

      case 'storm':
        return {
          background: `
            radial-gradient(ellipse 100% 60% at ${30 + Math.sin(time * 2) * 20}% ${20 + Math.cos(time) * 10}%, ${c[1]}, transparent),
            radial-gradient(ellipse 80% 50% at ${70 + Math.cos(time * 1.5) * 25}% ${40 + Math.sin(time * 1.2) * 15}%, ${c[2]}, transparent),
            linear-gradient(180deg, ${c[0]}, ${c[1]})
          `,
          filter: lightning
            ? `brightness(${1 + lightning * (stylePreset === 'cinematic' ? 1.8 : 2.6)}) contrast(${1 + lightning * 0.35})`
            : undefined,
          mixBlendMode: blend as React.CSSProperties['mixBlendMode'],
        };

      case 'cosmic':
        return {
          background: `
            radial-gradient(ellipse at center, ${c[3] ?? c[0]} 0%, transparent 50%),
            radial-gradient(ellipse at ${30 + Math.sin(time * 0.5) * 20}% ${30 + Math.cos(time * 0.3) * 20}%, ${c[1]}, transparent 40%),
            radial-gradient(ellipse at ${70 + Math.cos(time * 0.4) * 15}% ${70 + Math.sin(time * 0.6) * 15}%, ${c[2]}, transparent 35%),
            linear-gradient(180deg, ${c[0]}, ${c[1]})
          `,
          mixBlendMode: blend as React.CSSProperties['mixBlendMode'],
        };

      case 'heat':
        return {
          background: `
            radial-gradient(ellipse at 50% 100%, ${c[0]}, transparent 60%),
            radial-gradient(ellipse at ${30 + Math.sin(time * 3) * 20}% 80%, ${c[1]}, transparent 40%),
            radial-gradient(ellipse at ${70 + Math.cos(time * 2.5) * 20}% 90%, ${c[2]}, transparent 45%)
          `,
          filter: `blur(${10 + Math.sin(time * 5) * 5}px)`,
          mixBlendMode: blend as React.CSSProperties['mixBlendMode'],
        };

      case 'underwater':
        return {
          background: `
            linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 50%, ${c[2]} 100%),
            radial-gradient(ellipse at ${50 + Math.sin(time) * 30}% ${30 + Math.cos(time * 0.8) * 20}%, ${c[2]}40, transparent 40%)
          `,
          mixBlendMode: blend as React.CSSProperties['mixBlendMode'],
        };

      default:
        return {};
    }
  }, [type, colors, intensity, complexity, direction, blend, time, lightning, stylePreset]);

  if (!enabled) return null;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{ ...auroraStyle, ...style }}
      aria-hidden="true"
    >
      {stylePreset === 'cinematic' && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${NOISE_DATA_URL}")`,
            backgroundRepeat: 'repeat',
            backgroundSize: `${200 + complexity * 16}px ${200 + complexity * 16}px`,
            backgroundPosition: `${time * 120}px ${time * 80}px`,
            opacity: Math.min(0.1, 0.04 + intensity * 0.03),
            mixBlendMode: 'overlay',
            filter: 'blur(0.4px) contrast(1.1)',
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

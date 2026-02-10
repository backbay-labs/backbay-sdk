"use client";

import * as React from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "../../../lib/utils";
import { getPerformanceConfig } from "../shared/performance";
import type { WeatherLayerProps, Particle, WeatherConfig } from "./types";
import { WEATHER_CONFIGS } from "./types";
import { createParticle, updateParticle, getParticleCount } from "./particles";
import { WeatherLayerCinematicCanvas } from "./cinematicCanvas";
import { colorsKey, resolveWeatherColors } from "./colors";

// Particle renderer based on shape
interface ParticleRendererProps {
  particle: Particle;
  config: WeatherConfig;
  colorOverride?: string;
}

const ParticleRenderer = React.memo(function ParticleRenderer({
  particle,
  config,
  colorOverride,
}: ParticleRendererProps) {
  const translate = `translate3d(${particle.x}px, ${particle.y}px, 0)`;
  const rotate = `rotate(${particle.rotation}deg)`;
  const particleColor = colorOverride ?? particle.color;

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: particle.opacity,
    transform: `${translate} ${rotate}`,
    willChange: 'transform, opacity',
    pointerEvents: 'none',
  };

  switch (config.shape) {
    case 'streak':
      return (
        <div
          style={{
            ...baseStyle,
            width: 1,
            height: particle.size * 8,
            background: `linear-gradient(to bottom, transparent, ${particleColor}, transparent)`,
          }}
        />
      );
    case 'glow':
      return (
        <div
          style={{
            ...baseStyle,
            width: particle.size,
            height: particle.size,
            borderRadius: '50%',
            backgroundColor: particleColor,
            boxShadow: `0 0 ${particle.size * 2}px ${particleColor}`,
          }}
        />
      );
    case 'leaf':
      return (
        <div
          style={{
            ...baseStyle,
            width: particle.size,
            height: particle.size * 0.6,
            borderRadius: '50% 0 50% 0',
            backgroundColor: particleColor,
          }}
        />
      );
    case 'petal':
      return (
        <div
          style={{
            ...baseStyle,
            width: particle.size,
            height: particle.size * 0.7,
            borderRadius: '50% 50% 50% 50%',
            backgroundColor: particleColor,
            transform: `${translate} ${rotate} scale(1, 0.6)`,
          }}
        />
      );
    default: // circle
      return (
        <div
          style={{
            ...baseStyle,
            width: particle.size,
            height: particle.size,
            borderRadius: '50%',
            backgroundColor: particleColor,
          }}
        />
      );
  }
});

export function WeatherLayer({
  type,
  intensity = 0.5,
  stylePreset = 'ui',
  wind = { x: 0, y: 0 },
  color,
  colors,
  leafColorPreset,
  opacity = 1,
  blur = false,
  maxParticles: propMaxParticles,
  enabled = true,
  className,
  style,
}: WeatherLayerProps) {
  const reducedMotion = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [particles, setParticles] = React.useState<Particle[]>([]);
  const frameRef = React.useRef<number>(0);
  const lastTimeRef = React.useRef<number>(0);
  const particleIdRef = React.useRef<number>(0);

  const config = WEATHER_CONFIGS[type];
  const perfConfig = getPerformanceConfig();
  const maxParticles = propMaxParticles ?? perfConfig.maxParticles;
  const colorsKeyProp = colorsKey(colors);
  const particleColors = React.useMemo(
    () => resolveWeatherColors({ type, colors, leafColorPreset, configColors: config.colors }),
    [type, leafColorPreset, colorsKeyProp]
  );

  // Don't render if disabled or reduced motion
  const shouldRender = enabled && !reducedMotion && perfConfig.tier !== 'minimal';
  const useCinematicCanvas = shouldRender && stylePreset === 'cinematic' && perfConfig.useShaders && (type === 'snow' || type === 'leaves');

  // Animation loop — must be called unconditionally (rules of hooks)
  React.useEffect(() => {
    if (useCinematicCanvas || !shouldRender || !containerRef.current) {
      setParticles([]);
      return;
    }

    lastTimeRef.current = 0;
    const container = containerRef.current;
    const bounds = {
      width: container.offsetWidth,
      height: container.offsetHeight,
    };

    const particleCount = getParticleCount(type, intensity, maxParticles, stylePreset);

    // Initialize particles
    const initialParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      let p = createParticle(particleIdRef.current++, type, config, wind, bounds, stylePreset, particleColors);
      // Spread particles initially across the viewport
      p.y = Math.random() * bounds.height;
      p.x = Math.random() * bounds.width;
      p.life = Math.random() * p.maxLife * 0.7;
      p = updateParticle(p, config, 0);
      initialParticles.push(p);
    }
    setParticles(initialParticles);

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = Math.min(time - lastTimeRef.current, 50);
      lastTimeRef.current = time;

      setParticles(prev => {
        const updated: Particle[] = [];
        const currentBounds = {
          width: container.offsetWidth,
          height: container.offsetHeight,
        };

        for (const p of prev) {
          const newP = updateParticle(p, config, deltaTime);

          // Check if particle is still alive and in bounds
          if (
            newP.life < newP.maxLife &&
            newP.y > -50 &&
            newP.y < currentBounds.height + 50 &&
            newP.x > -50 &&
            newP.x < currentBounds.width + 50
          ) {
            updated.push(newP);
          }
        }

        // Spawn new particles to maintain count
        const targetCount = getParticleCount(type, intensity, maxParticles, stylePreset);
        while (updated.length < targetCount) {
          updated.push(
            createParticle(particleIdRef.current++, type, config, wind, currentBounds, stylePreset, particleColors)
          );
        }

        return updated;
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [useCinematicCanvas, shouldRender, type, intensity, stylePreset, wind.x, wind.y, maxParticles, config, leafColorPreset, colorsKeyProp]);

  if (useCinematicCanvas) {
    return (
      <WeatherLayerCinematicCanvas
        type={type}
        intensity={intensity}
        stylePreset={stylePreset}
        wind={wind}
        color={color}
        colors={colors}
        leafColorPreset={leafColorPreset}
        opacity={opacity}
        blur={blur}
        maxParticles={maxParticles}
        enabled={enabled}
        className={className}
        style={style}
      />
    );
  }

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      style={{
        opacity,
        filter: blur ? 'blur(1px)' : undefined,
        ...style,
      }}
      aria-hidden="true"
    >
      {particles.map(p => (
        <ParticleRenderer
          key={p.id}
          particle={p}
          config={config}
          colorOverride={color}
        />
      ))}
    </div>
  );
}

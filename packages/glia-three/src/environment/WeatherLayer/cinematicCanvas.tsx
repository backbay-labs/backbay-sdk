"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { getPerformanceConfig } from "../shared/performance";
import type { EnvironmentStylePreset } from "../shared/types";
import type { WeatherLayerProps, WeatherConfig, WeatherType } from "./types";
import { WEATHER_CONFIGS } from "./types";
import { getParticleCount } from "./particles";
import { colorsKey, resolveWeatherColors } from "./colors";

type Rgb = { r: number; g: number; b: number };

function clamp(min: number, value: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function parseHexColor(color: string): Rgb | null {
  const hex = color.trim();
  if (!hex.startsWith("#")) return null;
  const raw = hex.slice(1);
  if (raw.length === 3) {
    const r = Number.parseInt(raw[0] + raw[0], 16);
    const g = Number.parseInt(raw[1] + raw[1], 16);
    const b = Number.parseInt(raw[2] + raw[2], 16);
    return { r, g, b };
  }
  if (raw.length === 6) {
    const r = Number.parseInt(raw.slice(0, 2), 16);
    const g = Number.parseInt(raw.slice(2, 4), 16);
    const b = Number.parseInt(raw.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const tt = clamp(0, t, 1);
  return {
    r: Math.round(a.r + (b.r - a.r) * tt),
    g: Math.round(a.g + (b.g - a.g) * tt),
    b: Math.round(a.b + (b.b - a.b) * tt),
  };
}

function rgba(c: Rgb, a: number) {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${clamp(0, a, 1)})`;
}

function getSeededNoise(t: number, phase: number) {
  // Deterministic "noise-ish" turbulence (cheap and good enough for UI).
  return (
    Math.sin(t * 0.0007 + phase) * 0.6 +
    Math.sin(t * 0.0013 + phase * 1.7) * 0.3 +
    Math.sin(t * 0.0021 + phase * 2.3) * 0.1
  );
}

type SnowParticle = {
  x: number;
  y: number;
  z: number; // 0 near → 1 far
  speed: number; // px/s
  driftAmp: number; // px
  driftFreq: number;
  phase: number;
  spriteColor: string;
  spriteIndex: number;
  alpha: number;
  size: number; // px
};

type LeafParticle = {
  x: number;
  y: number;
  z: number; // 0 near → 1 far
  speed: number; // px/s
  windScale: number;
  phase: number;
  rotation: number;
  rotationSpeed: number;
  flutterPhase: number;
  flutterSpeed: number;
  spriteColor: string;
  spriteIndex: number;
  alpha: number;
  size: number; // px
};

type SpriteCache = Map<string, HTMLCanvasElement>;

const SNOW_SPRITE_VARIANTS = 4;
const LEAF_SPRITE_VARIANTS = 11;

function makeSnowSprite(color: string, variant: number): HTMLCanvasElement {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, size, size);

  const v = ((variant % SNOW_SPRITE_VARIANTS) + SNOW_SPRITE_VARIANTS) % SNOW_SPRITE_VARIANTS;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46;

  const highlightX = cx - r * (0.16 + v * 0.04);
  const highlightY = cy - r * (0.18 - v * 0.03);
  const softness = v === 3 ? 0.62 : v === 2 ? 0.56 : v === 1 ? 0.5 : 0.46;

  const g = ctx.createRadialGradient(cx - r * 0.1, cy - r * 0.1, 0, cx, cy, r);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.45, `rgba(255,255,255,${0.38 + v * 0.02})`);
  g.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Subtle specular "sparkle" highlight.
  const h = ctx.createRadialGradient(highlightX, highlightY, 0, highlightX, highlightY, r * softness);
  h.addColorStop(0, `rgba(255,255,255,${0.26 + v * 0.05})`);
  h.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = h;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Tint (works with any CSS color string).
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "source-over";

  // Re-add a tiny white specular so tinted snow still reads as "ice".
  const s = ctx.createRadialGradient(highlightX, highlightY, 0, highlightX, highlightY, r * 0.34);
  s.addColorStop(0, `rgba(255,255,255,${0.18 + v * 0.04})`);
  s.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = s;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

function makeLeafSprite(color: string, variant: number): HTMLCanvasElement {
  const size = 160;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, size, size);

  const base = parseHexColor(color) ?? { r: 180, g: 120, b: 70 };
  const dark = mix(base, { r: 0, g: 0, b: 0 }, 0.35);
  const light = mix(base, { r: 255, g: 255, b: 255 }, 0.25);
  const rim = mix(base, { r: 0, g: 0, b: 0 }, 0.2);

  const cx = size / 2;
  const cy = size / 2 - 4;

  const shape = ((variant % LEAF_SPRITE_VARIANTS) + LEAF_SPRITE_VARIANTS) % LEAF_SPRITE_VARIANTS;

  const drawRadialPath = (radii: number[], rx: number, ry: number) => {
    const pts = radii.map((r, i) => {
      const a = -Math.PI / 2 + (i / radii.length) * Math.PI * 2;
      return {
        x: cx + Math.cos(a) * rx * r,
        y: cy + Math.sin(a) * ry * r,
      };
    });

    const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    });

    ctx.beginPath();
    const start = mid(pts[pts.length - 1], pts[0]);
    ctx.moveTo(start.x, start.y);
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[i];
      const p1 = pts[(i + 1) % pts.length];
      const m = mid(p0, p1);
      ctx.quadraticCurveTo(p0.x, p0.y, m.x, m.y);
    }
    ctx.closePath();
  };

  type LeafDrawKind = "ovate" | "radial" | "ginkgo" | "heart" | "willow" | "deltoid";

  let w = 56;
  let h = 78;
  let skew = 0;
  let veinStyle: "midrib" | "fan" = "midrib";
  let carveNotch = false;
  let drawKind: LeafDrawKind = "ovate";
  let radialRadii: number[] | null = null;

  switch (shape) {
    case 0:
      // Ovate leaf
      w = 52;
      h = 78;
      skew = -0.04;
      drawKind = "ovate";
      break;
    case 1:
      // Maple-like lobes (spikier)
      w = 66;
      h = 74;
      drawKind = "radial";
      radialRadii = [1, 0.58, 0.96, 0.52, 0.92, 0.6, 0.86, 0.62, 0.96, 0.58];
      break;
    case 2:
      // Oak-like rounded lobes (smoother)
      w = 60;
      h = 80;
      drawKind = "radial";
      radialRadii = [1, 0.82, 0.95, 0.84, 0.92, 0.86, 0.9, 0.86, 0.92, 0.84, 0.95, 0.82];
      break;
    case 3:
      // Ginkgo fan
      w = 74;
      h = 70;
      veinStyle = "fan";
      carveNotch = true;
      drawKind = "ginkgo";
      break;
    case 4:
      // Heart/aspen
      w = 60;
      h = 78;
      drawKind = "heart";
      break;
    case 5:
      // Willow (long and narrow)
      w = 34;
      h = 80;
      skew = 0.08;
      drawKind = "willow";
      break;
    case 6:
      // Birch / poplar-ish (triangular)
      w = 54;
      h = 76;
      drawKind = "deltoid";
      break;
    case 7:
      // Plane tree / sycamore (broad 5-lobe, smoother than maple)
      w = 74;
      h = 78;
      drawKind = "radial";
      radialRadii = [1, 0.74, 0.96, 0.72, 0.92, 0.72, 0.96, 0.74, 1, 0.74];
      break;
    case 8:
      // Beech (smooth oval)
      w = 50;
      h = 74;
      skew = 0.02;
      drawKind = "ovate";
      break;
    case 9:
      // Linden (rounder heart)
      w = 66;
      h = 74;
      drawKind = "heart";
      break;
    case 10:
      // Serrated / elm-like (subtle teeth)
      w = 56;
      h = 80;
      drawKind = "radial";
      radialRadii = [1, 0.92, 0.99, 0.91, 0.98, 0.9, 0.97, 0.9, 0.98, 0.91, 0.99, 0.92];
      break;
    default:
      w = 52;
      h = 78;
      skew = -0.04;
      drawKind = "ovate";
      break;
  }

  const drawLeafPath = () => {
    switch (drawKind) {
      case "ovate":
        ctx.beginPath();
        ctx.moveTo(cx, cy - h);
        ctx.bezierCurveTo(cx + w, cy - h * 0.55, cx + w * (1 - skew), cy + h * 0.55, cx, cy + h);
        ctx.bezierCurveTo(cx - w * (1 + skew), cy + h * 0.55, cx - w, cy - h * 0.55, cx, cy - h);
        ctx.closePath();
        return;
      case "radial":
        drawRadialPath(radialRadii!, w, h);
        return;
      case "ginkgo":
        ctx.beginPath();
        ctx.moveTo(cx, cy + h * 0.78);
        ctx.bezierCurveTo(
          cx + w * 0.55,
          cy + h * 0.55,
          cx + w * 1.05,
          cy + h * 0.1,
          cx + w * 0.92,
          cy - h * 0.12
        );
        ctx.quadraticCurveTo(cx + w * 0.5, cy - h * 1.02, cx, cy - h * 0.88);
        ctx.quadraticCurveTo(cx - w * 0.5, cy - h * 1.02, cx - w * 0.92, cy - h * 0.12);
        ctx.bezierCurveTo(
          cx - w * 1.05,
          cy + h * 0.1,
          cx - w * 0.55,
          cy + h * 0.55,
          cx,
          cy + h * 0.78
        );
        ctx.closePath();
        return;
      case "heart":
        ctx.beginPath();
        ctx.moveTo(cx, cy + h);
        ctx.bezierCurveTo(cx + w * 0.95, cy + h * 0.45, cx + w, cy + h * 0.05, cx + w * 0.62, cy - h * 0.38);
        ctx.bezierCurveTo(cx + w * 0.25, cy - h * 0.78, cx, cy - h * 0.62, cx, cy - h * 0.48);
        ctx.bezierCurveTo(cx, cy - h * 0.62, cx - w * 0.25, cy - h * 0.78, cx - w * 0.62, cy - h * 0.38);
        ctx.bezierCurveTo(cx - w, cy + h * 0.05, cx - w * 0.95, cy + h * 0.45, cx, cy + h);
        ctx.closePath();
        return;
      case "deltoid":
        ctx.beginPath();
        ctx.moveTo(cx, cy - h);
        ctx.quadraticCurveTo(cx + w * 1.05, cy - h * 0.15, cx + w * 0.36, cy + h);
        ctx.quadraticCurveTo(cx, cy + h * 0.78, cx - w * 0.36, cy + h);
        ctx.quadraticCurveTo(cx - w * 1.05, cy - h * 0.15, cx, cy - h);
        ctx.closePath();
        return;
      case "willow":
        ctx.beginPath();
        ctx.moveTo(cx, cy - h);
        ctx.bezierCurveTo(cx + w, cy - h * 0.35, cx + w * (1 - skew), cy + h * 0.55, cx, cy + h);
        ctx.bezierCurveTo(cx - w * (1 + skew), cy + h * 0.55, cx - w, cy - h * 0.35, cx, cy - h);
        ctx.closePath();
        return;
    }
  };

  // Soft shadow (baked).
  ctx.save();
  ctx.translate(2, 4);
  drawLeafPath();
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fill();
  ctx.restore();

  // Fill with lighting gradient.
  drawLeafPath();
  const grad = ctx.createLinearGradient(cx - w, cy - h, cx + w, cy + h);
  grad.addColorStop(0, rgba(dark, 0.95));
  grad.addColorStop(0.45, rgba(base, 0.95));
  grad.addColorStop(1, rgba(light, 0.95));
  ctx.fillStyle = grad;
  ctx.fill();

  // Rim darkening.
  drawLeafPath();
  ctx.strokeStyle = rgba(rim, 0.55);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Stem (adds a lot of realism for very little cost).
  ctx.save();
  ctx.strokeStyle = rgba(dark, 0.5);
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy + h * 0.95);
  ctx.quadraticCurveTo(cx + w * 0.18, cy + h * 1.08, cx + w * 0.1, cy + h * 1.22);
  ctx.stroke();
  ctx.restore();

  // Texture + veins (subtle but helps "photoreal").
  ctx.save();
  drawLeafPath();
  ctx.clip();

  // Tiny speckles / spots.
  ctx.fillStyle = rgba(mix(dark, { r: 0, g: 0, b: 0 }, 0.1), 0.18);
  for (let i = 0; i < 14; i++) {
    const px = cx + (Math.random() - 0.5) * w * 1.5;
    const py = cy + (Math.random() - 0.25) * h * 1.4;
    const pr = 1.2 + Math.random() * 3.8;
    ctx.globalAlpha = 0.06 + Math.random() * 0.08;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = rgba(mix(base, { r: 255, g: 255, b: 255 }, 0.6), 0.55);
  ctx.lineWidth = 1.15;

  if (veinStyle === "fan") {
    const y0 = cy + h * 0.55;
    for (let i = -7; i <= 7; i++) {
      const t = i / 7;
      const x1 = cx + t * w * 0.82;
      const y1 = cy - h * 0.86 + Math.abs(t) * h * 0.18;
      ctx.globalAlpha = 0.1 + (1 - Math.abs(t)) * 0.12;
      ctx.beginPath();
      ctx.moveTo(cx, y0);
      ctx.quadraticCurveTo(cx + t * w * 0.25, cy - h * 0.1, x1, y1);
      ctx.stroke();
    }
  } else {
    ctx.globalAlpha = 0.34;
    ctx.beginPath();
    ctx.moveTo(cx, cy + h * 0.9);
    ctx.quadraticCurveTo(cx + w * 0.05, cy, cx, cy - h * 0.9);
    ctx.stroke();

    const veinCount = shape === 5 ? 4 : 6;
    for (let i = 0; i < veinCount; i++) {
      const t = (i + 1) / (veinCount + 1);
      const y = cy + h * 0.78 - t * h * 1.35;
      const veinW = w * (0.12 + t * 0.6);
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.quadraticCurveTo(cx + veinW, y + h * 0.08, cx + veinW * 0.9, y + h * 0.22);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.quadraticCurveTo(cx - veinW, y + h * 0.08, cx - veinW * 0.9, y + h * 0.22);
      ctx.stroke();
    }
  }
  ctx.restore();

  if (carveNotch) {
    // Carve last so it also removes veins/texture inside the notch.
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(cx, cy - h * 0.78, w * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  return canvas;
}

function getSprite(cache: SpriteCache, key: string, build: () => HTMLCanvasElement) {
  const existing = cache.get(key);
  if (existing) return existing;
  const created = build();
  cache.set(key, created);
  return created;
}

function createSnowParticles(
  count: number,
  config: WeatherConfig,
  bounds: { width: number; height: number },
  options?: { colorsOverride?: readonly string[]; colorOverride?: string }
): SnowParticle[] {
  const particles: SnowParticle[] = [];
  const palette =
    options?.colorsOverride && options.colorsOverride.length > 0 ? options.colorsOverride : config.colors;
  for (let i = 0; i < count; i++) {
    const z = Math.pow(Math.random(), 0.55); // bias toward far
    let size = 1.1 + (1 - z) * 4.4 + Math.random() * 0.8;
    const speed = 16 + (1 - z) * 68 + Math.random() * 12;
    const driftAmp = 6 + (1 - z) * 24 + Math.random() * 10;
    const driftFreq = 0.7 + Math.random() * 1.6;
    const alpha = 0.24 + (1 - z) * 0.56 + Math.random() * 0.1;
    const spriteIndex = Math.floor(Math.random() * SNOW_SPRITE_VARIANTS);

    // Rare large "bokeh" flakes near camera.
    if (z < 0.22 && Math.random() < 0.06) {
      size *= 1.8;
    }
    const spriteColor =
      options?.colorOverride ??
      (palette.length > 0 ? palette[Math.floor(Math.random() * palette.length)] : "#ffffff");
    particles.push({
      x: Math.random() * bounds.width,
      y: Math.random() * bounds.height,
      z,
      speed,
      driftAmp,
      driftFreq,
      phase: Math.random() * Math.PI * 2,
      spriteColor,
      spriteIndex,
      alpha,
      size,
    });
  }
  return particles;
}

function createLeafParticles(
  count: number,
  config: WeatherConfig,
  bounds: { width: number; height: number },
  options?: { colorsOverride?: readonly string[]; colorOverride?: string }
): LeafParticle[] {
  const particles: LeafParticle[] = [];
  const palette =
    options?.colorsOverride && options.colorsOverride.length > 0 ? options.colorsOverride : config.colors;
  for (let i = 0; i < count; i++) {
    const z = Math.pow(Math.random(), 0.6); // bias toward far
    const size = 6.5 + (1 - z) * 13.5 + Math.random() * 2.2;
    const speed = 18 + (1 - z) * 48 + Math.random() * 9;
    const alpha = 0.55 + (1 - z) * 0.35;
    const rotation = Math.random() * Math.PI * 2;
    const rotationSpeed = (Math.random() * 0.9 + 0.4) * (Math.random() > 0.5 ? 1 : -1);
    const flutterSpeed = 1.2 + Math.random() * 1.6;
    const windScale = 0.4 + Math.random() * 0.9;
    const spriteColor =
      options?.colorOverride ??
      (palette.length > 0 ? palette[Math.floor(Math.random() * palette.length)] : "#d4a373");
    const spriteIndex = Math.floor(Math.random() * LEAF_SPRITE_VARIANTS);

    particles.push({
      x: Math.random() * bounds.width,
      y: Math.random() * bounds.height,
      z,
      speed,
      windScale,
      phase: Math.random() * Math.PI * 2,
      rotation,
      rotationSpeed,
      flutterPhase: Math.random() * Math.PI * 2,
      flutterSpeed,
      spriteColor,
      spriteIndex,
      alpha,
      size,
    });
  }
  return particles;
}

function updateSnow(
  particles: SnowParticle[],
  dtSec: number,
  tMs: number,
  bounds: { width: number; height: number },
  wind: { x: number; y: number }
) {
  const margin = 50;
  for (const p of particles) {
    const turb = getSeededNoise(tMs, p.phase);
    const vx = wind.x * (20 + (1 - p.z) * 35) + turb * p.driftAmp * 0.9;
    const vy = p.speed + wind.y * 10 + turb * 8;

    p.x += vx * dtSec;
    p.y += vy * dtSec;

    // gentle horizontal oscillation
    p.x += Math.sin(tMs * 0.001 * p.driftFreq + p.phase) * p.driftAmp * dtSec * 1.2;

    if (p.y > bounds.height + margin) {
      p.y = -margin - Math.random() * 40;
      p.x = Math.random() * bounds.width;
    }
    if (p.x < -margin) p.x = bounds.width + margin;
    if (p.x > bounds.width + margin) p.x = -margin;
  }
}

function updateLeaves(
  particles: LeafParticle[],
  dtSec: number,
  tMs: number,
  bounds: { width: number; height: number },
  wind: { x: number; y: number }
) {
  const margin = 80;
  for (const p of particles) {
    const turb = getSeededNoise(tMs, p.phase);
    const sway = Math.sin(tMs * 0.0012 + p.phase) * (14 + p.z * 18);

    const vx = wind.x * (28 + (1 - p.z) * 40) * p.windScale + turb * 22 + sway;
    const vy = p.speed + wind.y * 10 + Math.cos(tMs * 0.001 + p.phase) * 10;

    p.x += vx * dtSec;
    p.y += vy * dtSec;

    p.rotation += (p.rotationSpeed + turb * 0.6) * dtSec;

    if (p.y > bounds.height + margin) {
      p.y = -margin - Math.random() * 80;
      p.x = Math.random() * bounds.width;
    }
    if (p.x < -margin) p.x = bounds.width + margin;
    if (p.x > bounds.width + margin) p.x = -margin;
  }
}

function drawSnow(
  ctx: CanvasRenderingContext2D,
  particles: SnowParticle[],
  opacity: number,
  spriteCache: SpriteCache
) {
  for (const p of particles) {
    const sprite = getSprite(
      spriteCache,
      `snow:${p.spriteColor}:${p.spriteIndex}`,
      () => makeSnowSprite(p.spriteColor, p.spriteIndex)
    );

    const alpha = clamp(0, p.alpha * opacity, 1);
    ctx.globalAlpha = alpha;

    // Slightly soften near flakes.
    const s = p.size;
    const baseX = p.x - s / 2;
    const baseY = p.y - s / 2;
    ctx.drawImage(sprite, baseX, baseY, s, s);

    if (p.z < 0.2 && s > 6) {
      // Soft bokeh halo for very near flakes.
      ctx.globalAlpha = alpha * 0.14;
      ctx.drawImage(sprite, baseX - s * 0.25, baseY - s * 0.25, s * 1.5, s * 1.5);
    }

    if (p.z < 0.25 && s > 3.2) {
      // Tiny motion trail for near flakes (cinematic depth).
      ctx.globalAlpha = alpha * 0.28;
      ctx.drawImage(sprite, baseX, baseY - s * 0.35, s, s);
    }
  }
}

function drawLeaves(
  ctx: CanvasRenderingContext2D,
  particles: LeafParticle[],
  opacity: number,
  tMs: number,
  config: WeatherConfig,
  spriteCache: SpriteCache
) {
  for (const p of particles) {
    const leafColor = p.spriteColor || config.colors[0] || "#d4a373";
    const key = `leaf:${leafColor}:${p.spriteIndex}`;
    const sprite = getSprite(spriteCache, key, () => makeLeafSprite(leafColor, p.spriteIndex));

    const alpha = clamp(0, p.alpha * opacity, 1);
    const flutter = Math.sin(tMs * 0.001 * p.flutterSpeed + p.flutterPhase);
    const tilt = flutter * 0.35;

    const scale = (p.size / 52) * (0.78 + (1 - p.z) * 0.34);
    const squash = 0.75 + Math.abs(flutter) * 0.25;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation + tilt);
    ctx.scale(scale, scale * squash);
    ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
    ctx.restore();
  }
}

function getCinematicCount(type: WeatherType, intensity: number, maxParticles: number) {
  // getParticleCount already has cinematic multipliers for snow/leaves.
  return getParticleCount(type, intensity, maxParticles, "cinematic");
}

export function WeatherLayerCinematicCanvas({
  type,
  intensity = 0.5,
  stylePreset = "cinematic",
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
}: WeatherLayerProps & { stylePreset?: EnvironmentStylePreset }) {
  const perfConfig = getPerformanceConfig();
  const maxParticles = propMaxParticles ?? perfConfig.maxParticles;
  const colorsKeyProp = colorsKey(colors);
  const config = WEATHER_CONFIGS[type];
  const particleColors = React.useMemo(
    () => resolveWeatherColors({ type, colors, leafColorPreset, configColors: config.colors }),
    [type, leafColorPreset, colorsKeyProp, config]
  );

  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const frameRef = React.useRef<number>(0);
  const lastRef = React.useRef<number>(0);
  const boundsRef = React.useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const snowRef = React.useRef<SnowParticle[]>([]);
  const leafRef = React.useRef<LeafParticle[]>([]);
  const spriteCacheRef = React.useRef<SpriteCache>(new Map());

  React.useEffect(() => {
    if (stylePreset !== "cinematic" || !enabled) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    lastRef.current = 0;

    const dpr = clamp(1, window.devicePixelRatio ?? 1, 2);

    const resize = () => {
      const width = Math.max(1, Math.floor(container.clientWidth));
      const height = Math.max(1, Math.floor(container.clientHeight));
      boundsRef.current = { width, height };
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(resize);
      ro.observe(container);
    } else {
      window.addEventListener("resize", resize);
    }

    const bounds = boundsRef.current;
    const count = getCinematicCount(type, intensity, maxParticles);
    if (type === "snow") {
      snowRef.current = createSnowParticles(count, config, bounds, { colorsOverride: particleColors, colorOverride: color });
      leafRef.current = [];
    } else if (type === "leaves") {
      leafRef.current = createLeafParticles(count, config, bounds, { colorsOverride: particleColors, colorOverride: color });
      snowRef.current = [];
    } else {
      snowRef.current = [];
      leafRef.current = [];
    }

    const animate = (tMs: number) => {
      if (!lastRef.current) lastRef.current = tMs;
      const dtMs = Math.min(tMs - lastRef.current, 40);
      lastRef.current = tMs;
      const dtSec = dtMs / 1000;

      const b = boundsRef.current;

      if (type === "snow") {
        updateSnow(snowRef.current, dtSec, tMs, b, wind);
      } else if (type === "leaves") {
        updateLeaves(leafRef.current, dtSec, tMs, b, wind);
      }

      ctx.clearRect(0, 0, b.width, b.height);
      ctx.globalCompositeOperation = "source-over";

      if (type === "snow") {
        drawSnow(ctx, snowRef.current, opacity, spriteCacheRef.current);
      } else if (type === "leaves") {
        drawLeaves(ctx, leafRef.current, opacity, tMs, WEATHER_CONFIGS[type], spriteCacheRef.current);
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", resize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [type, intensity, wind.x, wind.y, color, opacity, maxParticles, enabled, stylePreset, leafColorPreset, colorsKeyProp]);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{
        opacity: 1,
        filter: blur ? "blur(0.8px)" : undefined,
        ...style,
      }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />
    </div>
  );
}

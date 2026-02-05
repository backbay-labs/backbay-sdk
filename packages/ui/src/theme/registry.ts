/**
 * Theme Registry
 *
 * Central registry of all available UI themes.
 * Provides lookup and utility functions for theme management.
 */

import { nebulaTheme } from "./nebula";
import { solarpunkTheme } from "./solarpunk";
import type { ThemeCssVariables, UiTheme, UiThemeId } from "./types";

// ============================================================================
// THEME REGISTRY
// ============================================================================

export const THEMES: Record<UiThemeId, UiTheme> = {
  nebula: nebulaTheme,
  solarpunk: solarpunkTheme,
};

export const DEFAULT_THEME_ID: UiThemeId = "nebula";

export function getTheme(id: UiThemeId): UiTheme {
  return THEMES[id] ?? THEMES[DEFAULT_THEME_ID];
}

export function getThemeIds(): UiThemeId[] {
  return Object.keys(THEMES) as UiThemeId[];
}

// ============================================================================
// CSS VARIABLE GENERATION
// ============================================================================

type RgbColor = { r: number; g: number; b: number };

function clampByte(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(255, Math.max(0, value));
}

function parseHexColor(hex: string): RgbColor | null {
  const value = hex.trim();
  if (!value.startsWith("#")) return null;

  const raw = value.slice(1);
  if (raw.length === 3) {
    const r = Number.parseInt(raw[0] + raw[0], 16);
    const g = Number.parseInt(raw[1] + raw[1], 16);
    const b = Number.parseInt(raw[2] + raw[2], 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }

  if (raw.length === 6) {
    const r = Number.parseInt(raw.slice(0, 2), 16);
    const g = Number.parseInt(raw.slice(2, 4), 16);
    const b = Number.parseInt(raw.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }

  return null;
}

function parseRgbFunction(color: string): RgbColor | null {
  const match = color
    .trim()
    .match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)$/i);
  if (!match) return null;

  const r = clampByte(Number.parseFloat(match[1]));
  const g = clampByte(Number.parseFloat(match[2]));
  const b = clampByte(Number.parseFloat(match[3]));
  return { r, g, b };
}

function parseColorToRgb(color: string): RgbColor | null {
  return parseHexColor(color) ?? parseRgbFunction(color);
}

function rgbToHslComponents(rgb: RgbColor): string {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      default:
        h = (r - g) / delta + 4;
        break;
    }

    h /= 6;
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);
  return `${hDeg} ${sPct}% ${lPct}%`;
}

function colorToHslComponents(color: string): string | null {
  const rgb = parseColorToRgb(color);
  if (!rgb) return null;
  return rgbToHslComponents(rgb);
}

/**
 * Converts a theme object to CSS custom properties
 */
export function themeToCssVariables(theme: UiTheme): ThemeCssVariables {
  return {
    // Colors
    "--theme-bg-body": theme.color.bg.body,
    "--theme-bg-panel": theme.color.bg.panel,
    "--theme-bg-elevated": theme.color.bg.elevated,
    "--theme-bg-horizon": theme.color.bg.horizon,
    "--theme-text-primary": theme.color.text.primary,
    "--theme-text-muted": theme.color.text.muted,
    "--theme-text-soft": theme.color.text.soft,
    "--theme-accent-primary": theme.color.accent.primary,
    "--theme-accent-secondary": theme.color.accent.secondary,
    "--theme-accent-positive": theme.color.accent.positive,
    "--theme-accent-warning": theme.color.accent.warning,
    "--theme-accent-destructive": theme.color.accent.destructive,
    "--theme-border": theme.color.border,
    "--theme-ring": theme.color.ring,

    // Glass
    "--theme-glass-panel-bg": theme.glass.panelBg,
    "--theme-glass-panel-border": theme.glass.panelBorder,
    "--theme-glass-panel-blur": theme.glass.panelBlur,
    "--theme-glass-header-gradient": theme.glass.headerGradient,
    "--theme-glass-card-bg": theme.glass.cardBg,
    "--theme-glass-card-border": theme.glass.cardBorder,
    "--theme-glass-hover-bg": theme.glass.hoverBg,
    "--theme-glass-active-border": theme.glass.activeBorder,
    "--theme-glass-active-shadow": theme.glass.activeShadow,

    // Elevation
    "--theme-shadow-soft": theme.elevation.softDrop,
    "--theme-shadow-hud-panel": theme.elevation.hudPanel,
    "--theme-shadow-hud-rail": theme.elevation.hudRail,
    "--theme-shadow-modal": theme.elevation.modal,
    "--theme-shadow-glow": theme.elevation.glow,

    // Ambient
    "--theme-ambient-horizon": theme.ambient.horizonGradient,
    "--theme-ambient-ripple-primary": theme.ambient.rippleColorPrimary,
    "--theme-ambient-ripple-secondary": theme.ambient.rippleColorSecondary,
    "--theme-ambient-glow-intensity": String(theme.ambient.glowIntensity),

    // Controls
    "--theme-switch-track-on": theme.controls.switch.track.bg.on,
    "--theme-switch-track-off": theme.controls.switch.track.bg.off,
    "--theme-switch-thumb-on": theme.controls.switch.thumb.bg.on,
    "--theme-switch-thumb-off": theme.controls.switch.thumb.bg.off,
    "--theme-button-glow-hover-bg": theme.controls.buttonGlow.hoverBg,
    "--theme-button-glow-hover-text": theme.controls.buttonGlow.hoverText,
    "--theme-button-glow-hover-shadow": theme.controls.buttonGlow.hoverShadow,
  };
}

const TAILWIND_CSS_VARIABLE_KEYS = [
  "--cyan-neon",
  "--magenta-neon",
  "--emerald-neon",
  "--violet-neon",
  "--yellow-warning",
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--primary",
  "--primary-foreground",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--destructive",
  "--destructive-foreground",
  "--border",
  "--input",
  "--ring",
] as const;

type TailwindCssVariables = Partial<Record<(typeof TAILWIND_CSS_VARIABLE_KEYS)[number], string>>;

function themeToTailwindCssVariables(theme: UiTheme): TailwindCssVariables {
  const bg = colorToHslComponents(theme.color.bg.body);
  const fg = colorToHslComponents(theme.color.text.primary);
  const panel = colorToHslComponents(theme.color.bg.panel);
  const elevated = colorToHslComponents(theme.color.bg.elevated);
  const primary = colorToHslComponents(theme.color.accent.primary);
  const secondary = colorToHslComponents(theme.color.accent.secondary);
  const positive = colorToHslComponents(theme.color.accent.positive);
  const warning = colorToHslComponents(theme.color.accent.warning);
  const destructive = colorToHslComponents(theme.color.accent.destructive);
  const border = colorToHslComponents(theme.color.border);
  const ring = colorToHslComponents(theme.color.ring);
  const mutedFg = colorToHslComponents(theme.color.text.muted);

  const violetFallback =
    theme.id === "nebula"
      ? colorToHslComponents("#8B5CF6")
      : colorToHslComponents(theme.color.accent.secondary);

  return {
    "--cyan-neon": primary ?? undefined,
    "--magenta-neon": secondary ?? undefined,
    "--emerald-neon": positive ?? undefined,
    "--violet-neon": violetFallback ?? undefined,
    "--yellow-warning": warning ?? undefined,

    "--background": bg ?? undefined,
    "--foreground": fg ?? undefined,

    "--card": panel ?? undefined,
    "--card-foreground": fg ?? undefined,

    "--popover": elevated ?? undefined,
    "--popover-foreground": fg ?? undefined,

    "--primary": primary ?? undefined,
    "--primary-foreground": bg ?? undefined,

    "--secondary": secondary ?? undefined,
    "--secondary-foreground": fg ?? undefined,

    "--muted": elevated ?? undefined,
    "--muted-foreground": mutedFg ?? undefined,

    "--accent": panel ?? undefined,
    "--accent-foreground": primary ?? undefined,

    "--destructive": destructive ?? undefined,
    "--destructive-foreground": fg ?? undefined,

    "--border": border ?? undefined,
    "--input": elevated ?? undefined,
    "--ring": ring ?? undefined,
  };
}

/**
 * Applies theme CSS variables to a target element
 */
export function applyThemeCssVariables(
  theme: UiTheme,
  target: HTMLElement = document.documentElement
): void {
  const variables = themeToCssVariables(theme);
  const tailwindVariables = themeToTailwindCssVariables(theme);

  for (const [key, value] of Object.entries(variables)) {
    target.style.setProperty(key, value);
  }

  for (const [key, value] of Object.entries(tailwindVariables)) {
    if (!value) continue;
    target.style.setProperty(key, value);
  }

  // Set data attribute for CSS selectors
  target.dataset.uiTheme = theme.id;
}

/**
 * Removes theme CSS variables from a target element
 */
export function removeThemeCssVariables(target: HTMLElement = document.documentElement): void {
  const variables = themeToCssVariables(THEMES.nebula);

  for (const key of Object.keys(variables)) {
    target.style.removeProperty(key);
  }

  for (const key of TAILWIND_CSS_VARIABLE_KEYS) {
    target.style.removeProperty(key);
  }

  delete target.dataset.uiTheme;
}

/**
 * Theme Bridge -- Maps UiTheme tokens to DesktopOSTheme tokens.
 *
 * Allows the desktop OS shell to be styled consistently with the
 * active UiTheme, creating a unified visual experience.
 *
 * @example
 * ```tsx
 * import { nebulaTheme } from '@backbay/glia/theme';
 * import { desktopThemeFromUiTheme } from '@backbay/glia/theme';
 *
 * const desktopTheme = desktopThemeFromUiTheme(nebulaTheme);
 * // Use with <DesktopOSProvider theme={desktopTheme}>
 * ```
 */

import type { UiTheme } from './types';
import type { DesktopOSTheme } from '../desktop/themes/types';

/**
 * Options for customizing the bridge mapping.
 */
export interface ThemeBridgeOptions {
  /** Override specific DesktopOSTheme values after mapping */
  overrides?: Partial<{
    colors: Partial<DesktopOSTheme['colors']>;
    fonts: Partial<DesktopOSTheme['fonts']>;
    radii: Partial<DesktopOSTheme['radii']>;
    shadows: Partial<DesktopOSTheme['shadows']>;
    spacing: Partial<DesktopOSTheme['spacing']>;
  }>;
  /** Custom font families (UiTheme doesn't include font tokens) */
  fonts?: {
    display?: string;
    body?: string;
    mono?: string;
  };
}

/**
 * Named easing presets used by framer-motion / UiTheme motion tokens.
 * Maps to CSS cubic-bezier equivalents.
 */
const EASING_MAP: Record<string, string> = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

/**
 * Convert a UiTheme motion ease value to a CSS easing string.
 *
 * Handles both named easings (e.g. "easeOut") and numeric arrays
 * (e.g. [0.4, 0, 0.2, 1]).
 */
function easeToCss(ease: string | number[]): string {
  if (Array.isArray(ease)) {
    return `cubic-bezier(${ease[0]}, ${ease[1]}, ${ease[2]}, ${ease[3]})`;
  }
  return EASING_MAP[ease] ?? 'cubic-bezier(0.4, 0, 0.2, 1)';
}

/**
 * Extract an rgba color from a CSS box-shadow string.
 *
 * Looks for `rgba(...)` or `rgb(...)` patterns and returns the first match.
 * Falls back to the provided fallback color if no match is found.
 */
function extractColorFromShadow(shadow: string, fallback: string): string {
  const rgbaMatch = shadow.match(/rgba?\([^)]+\)/);
  return rgbaMatch ? rgbaMatch[0] : fallback;
}

/**
 * Nudge the alpha channel of an rgba color string by a delta.
 *
 * If the input isn't a valid rgba() string, returns it unchanged.
 */
function nudgeAlpha(color: string, delta: number): string {
  const match = color.match(
    /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/,
  );
  if (!match) return color;
  const [, r, g, b, a] = match;
  const newAlpha = Math.min(1, Math.max(0, parseFloat(a) + delta));
  return `rgba(${r}, ${g}, ${b}, ${newAlpha})`;
}

/**
 * Derive a complete DesktopOSTheme from a UiTheme.
 *
 * This is the core bridge function. It is pure (no side effects, no DOM
 * access) and produces a full DesktopOSTheme ready for use with the
 * desktop shell's ThemeProvider.
 */
export function desktopThemeFromUiTheme(
  uiTheme: UiTheme,
  options: ThemeBridgeOptions = {},
): DesktopOSTheme {
  const { overrides, fonts: fontOverrides } = options;

  // --- Colors ---
  const colors: DesktopOSTheme['colors'] = {
    windowBg: uiTheme.color.bg.panel,
    windowBorder: uiTheme.color.border,
    windowBorderFocused: uiTheme.glass.activeBorder,
    titlebarBg: nudgeAlpha(uiTheme.color.bg.panel, 0.02),
    titlebarText: uiTheme.color.text.primary,
    accent: uiTheme.color.accent.primary,
    accentMuted: uiTheme.glass.hoverBg,
    accentGlow: extractColorFromShadow(
      uiTheme.glass.activeShadow,
      uiTheme.color.accent.primary,
    ),
    taskbarBg: uiTheme.glass.panelBg,
    taskbarText: uiTheme.color.text.muted,
    startMenuBg: uiTheme.color.bg.elevated,
    contextMenuBg: uiTheme.color.bg.elevated,
    contextMenuHover: uiTheme.glass.hoverBg,
    desktopBg: uiTheme.color.bg.body,
    iconText: uiTheme.color.text.muted,
    iconSelected: uiTheme.glass.hoverBg,
    destructive: uiTheme.color.accent.destructive,
    success: uiTheme.color.accent.positive,
    warning: uiTheme.color.accent.warning,
    textPrimary: uiTheme.color.text.primary,
    textSecondary: uiTheme.color.text.muted,
    textMuted: uiTheme.color.text.soft,
    ...overrides?.colors,
  };

  // --- Fonts ---
  const fonts: DesktopOSTheme['fonts'] = {
    display: fontOverrides?.display ?? uiTheme.fonts.display,
    body: fontOverrides?.body ?? uiTheme.fonts.body,
    mono: fontOverrides?.mono ?? uiTheme.fonts.mono,
    ...overrides?.fonts,
  };

  // --- Radii ---
  const radii: DesktopOSTheme['radii'] = {
    window: uiTheme.radii.lg,
    button: uiTheme.radii.sm,
    menu: uiTheme.radii.md,
    input: uiTheme.radii.sm,
    ...overrides?.radii,
  };

  // --- Shadows ---
  const shadows: DesktopOSTheme['shadows'] = {
    window: uiTheme.elevation.hudPanel,
    windowFocused: uiTheme.elevation.modal,
    menu: uiTheme.elevation.hudPanel,
    tooltip: uiTheme.elevation.softDrop,
    ...overrides?.shadows,
  };

  // --- Spacing ---
  const spacing: DesktopOSTheme['spacing'] = {
    windowPadding: uiTheme.spacing.windowPadding,
    taskbarHeight: uiTheme.spacing.taskbarHeight,
    iconSize: uiTheme.spacing.iconSize,
    iconGap: uiTheme.spacing.iconGap,
    titlebarHeight: uiTheme.spacing.titlebarHeight,
    windowBorderWidth: uiTheme.spacing.windowBorderWidth,
    ...overrides?.spacing,
  };

  // --- Animation ---
  const fastMs = Math.round(uiTheme.motion.fast.duration * 1000);
  const normalMs = Math.round(uiTheme.motion.normal.duration * 1000);
  const slowMs = Math.round(uiTheme.motion.normal.duration * 1500);

  const animation: DesktopOSTheme['animation'] = {
    duration: {
      fast: `${fastMs}ms`,
      normal: `${normalMs}ms`,
      slow: `${slowMs}ms`,
    },
    easing: {
      default: easeToCss(uiTheme.motion.normal.ease),
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  };

  // --- Blur ---
  const blur: DesktopOSTheme['blur'] = {
    backdrop: `blur(${uiTheme.glass.panelBlur})`,
  };

  return {
    id: `bridged-${uiTheme.id}`,
    name: `${uiTheme.name} (Bridged)`,
    colors,
    fonts,
    radii,
    shadows,
    spacing,
    animation,
    blur,
  };
}

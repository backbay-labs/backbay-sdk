"use client";

import * as React from "react";
import {
  getTheme,
  DEFAULT_THEME_ID,
  applyThemeCssVariables,
  colorToHslComponents,
} from "./registry";
import type { UiTheme, UiThemeId } from "./types";

// SSR-safe useLayoutEffect
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

// ============================================================================
// GLIA CSS VARIABLE GENERATION
// ============================================================================

/**
 * Convert a UiTheme motion ease value to a CSS easing string.
 */
function easeToCss(ease: string | number[]): string {
  if (Array.isArray(ease)) {
    return `cubic-bezier(${ease[0]}, ${ease[1]}, ${ease[2]}, ${ease[3]})`;
  }
  const map: Record<string, string> = {
    linear: "linear",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  };
  return map[ease] ?? "cubic-bezier(0.4, 0, 0.2, 1)";
}

/**
 * Build all --glia-* CSS variables from a UiTheme.
 * Also produces backward-compatible --theme-* and --bb-* aliases.
 */
export function buildGliaCssVariables(theme: UiTheme): Record<string, string> {
  const vars: Record<string, string> = {};

  // ---- Colors ----
  vars["--glia-color-bg-body"] = theme.color.bg.body;
  vars["--glia-color-bg-panel"] = theme.color.bg.panel;
  vars["--glia-color-bg-elevated"] = theme.color.bg.elevated;
  vars["--glia-color-bg-horizon"] = theme.color.bg.horizon;
  vars["--glia-color-text-primary"] = theme.color.text.primary;
  vars["--glia-color-text-muted"] = theme.color.text.muted;
  vars["--glia-color-text-soft"] = theme.color.text.soft;
  vars["--glia-color-accent"] = theme.color.accent.primary;
  vars["--glia-color-accent-secondary"] = theme.color.accent.secondary;
  vars["--glia-color-accent-positive"] = theme.color.accent.positive;
  vars["--glia-color-accent-warning"] = theme.color.accent.warning;
  vars["--glia-color-accent-destructive"] = theme.color.accent.destructive;
  vars["--glia-color-border"] = theme.color.border;
  vars["--glia-color-ring"] = theme.color.ring;

  // ---- Glass ----
  vars["--glia-glass-panel-bg"] = theme.glass.panelBg;
  vars["--glia-glass-panel-border"] = theme.glass.panelBorder;
  vars["--glia-glass-panel-blur"] = theme.glass.panelBlur;
  vars["--glia-glass-header-gradient"] = theme.glass.headerGradient;
  vars["--glia-glass-card-bg"] = theme.glass.cardBg;
  vars["--glia-glass-card-border"] = theme.glass.cardBorder;
  vars["--glia-glass-hover-bg"] = theme.glass.hoverBg;
  vars["--glia-glass-active-border"] = theme.glass.activeBorder;
  vars["--glia-glass-active-shadow"] = theme.glass.activeShadow;

  // ---- Elevation ----
  vars["--glia-shadow-soft"] = theme.elevation.softDrop;
  vars["--glia-shadow-hud-panel"] = theme.elevation.hudPanel;
  vars["--glia-shadow-hud-rail"] = theme.elevation.hudRail;
  vars["--glia-shadow-modal"] = theme.elevation.modal;
  vars["--glia-shadow-glow"] = theme.elevation.glow;

  // ---- Ambient ----
  vars["--glia-ambient-horizon"] = theme.ambient.horizonGradient;
  vars["--glia-ambient-ripple-primary"] = theme.ambient.rippleColorPrimary;
  vars["--glia-ambient-ripple-secondary"] = theme.ambient.rippleColorSecondary;
  vars["--glia-ambient-glow-intensity"] = String(theme.ambient.glowIntensity);

  // ---- Controls ----
  vars["--glia-switch-track-on"] = theme.controls.switch.track.bg.on;
  vars["--glia-switch-track-off"] = theme.controls.switch.track.bg.off;
  vars["--glia-switch-thumb-on"] = theme.controls.switch.thumb.bg.on;
  vars["--glia-switch-thumb-off"] = theme.controls.switch.thumb.bg.off;
  vars["--glia-button-glow-hover-bg"] = theme.controls.buttonGlow.hoverBg;
  vars["--glia-button-glow-hover-text"] = theme.controls.buttonGlow.hoverText;
  vars["--glia-button-glow-hover-shadow"] = theme.controls.buttonGlow.hoverShadow;

  // ---- Fonts ----
  vars["--glia-font-display"] = theme.fonts.display;
  vars["--glia-font-body"] = theme.fonts.body;
  vars["--glia-font-mono"] = theme.fonts.mono;

  // ---- Radii ----
  vars["--glia-radius-sm"] = theme.radii.sm;
  vars["--glia-radius-md"] = theme.radii.md;
  vars["--glia-radius-lg"] = theme.radii.lg;

  // ---- Spacing ----
  vars["--glia-spacing-taskbar-height"] = theme.spacing.taskbarHeight;
  vars["--glia-spacing-titlebar-height"] = theme.spacing.titlebarHeight;
  vars["--glia-spacing-window-padding"] = theme.spacing.windowPadding;
  vars["--glia-spacing-icon-size"] = theme.spacing.iconSize;
  vars["--glia-spacing-icon-gap"] = theme.spacing.iconGap;
  vars["--glia-spacing-window-border-width"] = theme.spacing.windowBorderWidth;

  // ---- Motion / Animation ----
  const fastMs = Math.round(theme.motion.fast.duration * 1000);
  const normalMs = Math.round(theme.motion.normal.duration * 1000);
  const slowMs = Math.round(theme.motion.normal.duration * 1500);
  vars["--glia-duration-fast"] = `${fastMs}ms`;
  vars["--glia-duration-normal"] = `${normalMs}ms`;
  vars["--glia-duration-slow"] = `${slowMs}ms`;
  vars["--glia-easing-default"] = easeToCss(theme.motion.normal.ease);
  vars["--glia-easing-spring"] = "cubic-bezier(0.34, 1.56, 0.64, 1)";
  vars["--glia-easing-bounce"] = "cubic-bezier(0.68, -0.55, 0.265, 1.55)";

  // ---- Blur ----
  vars["--glia-blur-backdrop"] = `blur(${theme.glass.panelBlur})`;

  // ---- Tailwind HSL component variables (--glia-tw-*) ----
  const twMap: Record<string, string> = {
    "background": theme.color.bg.body,
    "foreground": theme.color.text.primary,
    "card": theme.color.bg.panel,
    "card-foreground": theme.color.text.primary,
    "popover": theme.color.bg.elevated,
    "popover-foreground": theme.color.text.primary,
    "primary": theme.color.accent.primary,
    "primary-foreground": theme.color.bg.body,
    "secondary": theme.color.accent.secondary,
    "secondary-foreground": theme.color.text.primary,
    "muted": theme.color.bg.elevated,
    "muted-foreground": theme.color.text.muted,
    "accent": theme.color.bg.panel,
    "accent-foreground": theme.color.accent.primary,
    "destructive": theme.color.accent.destructive,
    "destructive-foreground": theme.color.text.primary,
    "border": theme.color.border,
    "input": theme.color.bg.elevated,
    "ring": theme.color.ring,
  };
  for (const [name, color] of Object.entries(twMap)) {
    const hsl = colorToHslComponents(color);
    if (hsl) {
      vars[`--glia-tw-${name}`] = hsl;
    }
  }

  // Neon accents for Tailwind
  const neonMap: Record<string, string> = {
    "cyan-neon": theme.color.accent.primary,
    "magenta-neon": theme.color.accent.secondary,
    "emerald-neon": theme.color.accent.positive,
    "yellow-warning": theme.color.accent.warning,
  };
  const violetFallback =
    theme.id === "nebula" ? "#8B5CF6" : theme.color.accent.secondary;
  neonMap["violet-neon"] = violetFallback;
  for (const [name, color] of Object.entries(neonMap)) {
    const hsl = colorToHslComponents(color);
    if (hsl) {
      vars[`--glia-tw-${name}`] = hsl;
    }
  }

  // ============================================================================
  // BACKWARD-COMPATIBLE ALIASES: --theme-* -> var(--glia-*)
  // ============================================================================
  vars["--theme-bg-body"] = "var(--glia-color-bg-body)";
  vars["--theme-bg-panel"] = "var(--glia-color-bg-panel)";
  vars["--theme-bg-elevated"] = "var(--glia-color-bg-elevated)";
  vars["--theme-bg-horizon"] = "var(--glia-color-bg-horizon)";
  vars["--theme-text-primary"] = "var(--glia-color-text-primary)";
  vars["--theme-text-muted"] = "var(--glia-color-text-muted)";
  vars["--theme-text-soft"] = "var(--glia-color-text-soft)";
  vars["--theme-accent-primary"] = "var(--glia-color-accent)";
  vars["--theme-accent-secondary"] = "var(--glia-color-accent-secondary)";
  vars["--theme-accent-positive"] = "var(--glia-color-accent-positive)";
  vars["--theme-accent-warning"] = "var(--glia-color-accent-warning)";
  vars["--theme-accent-destructive"] = "var(--glia-color-accent-destructive)";
  vars["--theme-border"] = "var(--glia-color-border)";
  vars["--theme-ring"] = "var(--glia-color-ring)";
  vars["--theme-glass-panel-bg"] = "var(--glia-glass-panel-bg)";
  vars["--theme-glass-panel-border"] = "var(--glia-glass-panel-border)";
  vars["--theme-glass-panel-blur"] = "var(--glia-glass-panel-blur)";
  vars["--theme-glass-header-gradient"] = "var(--glia-glass-header-gradient)";
  vars["--theme-glass-card-bg"] = "var(--glia-glass-card-bg)";
  vars["--theme-glass-card-border"] = "var(--glia-glass-card-border)";
  vars["--theme-glass-hover-bg"] = "var(--glia-glass-hover-bg)";
  vars["--theme-glass-active-border"] = "var(--glia-glass-active-border)";
  vars["--theme-glass-active-shadow"] = "var(--glia-glass-active-shadow)";
  vars["--theme-shadow-soft"] = "var(--glia-shadow-soft)";
  vars["--theme-shadow-hud-panel"] = "var(--glia-shadow-hud-panel)";
  vars["--theme-shadow-hud-rail"] = "var(--glia-shadow-hud-rail)";
  vars["--theme-shadow-modal"] = "var(--glia-shadow-modal)";
  vars["--theme-shadow-glow"] = "var(--glia-shadow-glow)";
  vars["--theme-ambient-horizon"] = "var(--glia-ambient-horizon)";
  vars["--theme-ambient-ripple-primary"] = "var(--glia-ambient-ripple-primary)";
  vars["--theme-ambient-ripple-secondary"] = "var(--glia-ambient-ripple-secondary)";
  vars["--theme-ambient-glow-intensity"] = "var(--glia-ambient-glow-intensity)";
  vars["--theme-switch-track-on"] = "var(--glia-switch-track-on)";
  vars["--theme-switch-track-off"] = "var(--glia-switch-track-off)";
  vars["--theme-switch-thumb-on"] = "var(--glia-switch-thumb-on)";
  vars["--theme-switch-thumb-off"] = "var(--glia-switch-thumb-off)";
  vars["--theme-button-glow-hover-bg"] = "var(--glia-button-glow-hover-bg)";
  vars["--theme-button-glow-hover-text"] = "var(--glia-button-glow-hover-text)";
  vars["--theme-button-glow-hover-shadow"] = "var(--glia-button-glow-hover-shadow)";

  // ============================================================================
  // BACKWARD-COMPATIBLE ALIASES: --bb-* -> var(--glia-*)
  // ============================================================================
  // Colors
  vars["--bb-color-window-bg"] = "var(--glia-color-bg-panel)";
  vars["--bb-color-window-border"] = "var(--glia-color-border)";
  vars["--bb-color-window-border-focused"] = "var(--glia-glass-active-border)";
  vars["--bb-color-titlebar-bg"] = "var(--glia-color-bg-panel)";
  vars["--bb-color-titlebar-text"] = "var(--glia-color-text-primary)";
  vars["--bb-color-accent"] = "var(--glia-color-accent)";
  vars["--bb-color-accent-muted"] = "var(--glia-glass-hover-bg)";
  vars["--bb-color-accent-glow"] = "var(--glia-glass-active-shadow)";
  vars["--bb-color-taskbar-bg"] = "var(--glia-glass-panel-bg)";
  vars["--bb-color-taskbar-text"] = "var(--glia-color-text-muted)";
  vars["--bb-color-start-menu-bg"] = "var(--glia-color-bg-elevated)";
  vars["--bb-color-context-menu-bg"] = "var(--glia-color-bg-elevated)";
  vars["--bb-color-context-menu-hover"] = "var(--glia-glass-hover-bg)";
  vars["--bb-color-desktop-bg"] = "var(--glia-color-bg-body)";
  vars["--bb-color-icon-text"] = "var(--glia-color-text-muted)";
  vars["--bb-color-icon-selected"] = "var(--glia-glass-hover-bg)";
  vars["--bb-color-destructive"] = "var(--glia-color-accent-destructive)";
  vars["--bb-color-success"] = "var(--glia-color-accent-positive)";
  vars["--bb-color-warning"] = "var(--glia-color-accent-warning)";
  vars["--bb-color-text-primary"] = "var(--glia-color-text-primary)";
  vars["--bb-color-text-secondary"] = "var(--glia-color-text-muted)";
  vars["--bb-color-text-muted"] = "var(--glia-color-text-soft)";
  // Fonts
  vars["--bb-font-display"] = "var(--glia-font-display)";
  vars["--bb-font-body"] = "var(--glia-font-body)";
  vars["--bb-font-mono"] = "var(--glia-font-mono)";
  // Radii
  vars["--bb-radius-window"] = "var(--glia-radius-lg)";
  vars["--bb-radius-button"] = "var(--glia-radius-sm)";
  vars["--bb-radius-menu"] = "var(--glia-radius-md)";
  vars["--bb-radius-input"] = "var(--glia-radius-sm)";
  // Shadows
  vars["--bb-shadow-window"] = "var(--glia-shadow-hud-panel)";
  vars["--bb-shadow-window-focused"] = "var(--glia-shadow-modal)";
  vars["--bb-shadow-menu"] = "var(--glia-shadow-hud-panel)";
  vars["--bb-shadow-tooltip"] = "var(--glia-shadow-soft)";
  // Spacing
  vars["--bb-spacing-window-padding"] = "var(--glia-spacing-window-padding)";
  vars["--bb-spacing-taskbar-height"] = "var(--glia-spacing-taskbar-height)";
  vars["--bb-spacing-icon-size"] = "var(--glia-spacing-icon-size)";
  vars["--bb-spacing-icon-gap"] = "var(--glia-spacing-icon-gap)";
  vars["--bb-spacing-titlebar-height"] = "var(--glia-spacing-titlebar-height)";
  vars["--bb-spacing-window-border-width"] = "var(--glia-spacing-window-border-width)";
  // Animation
  vars["--bb-duration-fast"] = "var(--glia-duration-fast)";
  vars["--bb-duration-normal"] = "var(--glia-duration-normal)";
  vars["--bb-duration-slow"] = "var(--glia-duration-slow)";
  vars["--bb-easing-default"] = "var(--glia-easing-default)";
  vars["--bb-easing-spring"] = "var(--glia-easing-spring)";
  vars["--bb-easing-bounce"] = "var(--glia-easing-bounce)";
  // Blur
  vars["--bb-blur-backdrop"] = "var(--glia-blur-backdrop)";

  return vars;
}

/**
 * Apply all --glia-* CSS variables (plus backward-compat aliases) to an element.
 * Also sets Tailwind-compatible variables via the existing registry machinery.
 */
export function applyGliaCssVariables(
  theme: UiTheme,
  target: HTMLElement = document.documentElement,
): void {
  const vars = buildGliaCssVariables(theme);
  for (const [key, value] of Object.entries(vars)) {
    target.style.setProperty(key, value);
  }

  // Apply legacy --theme-* and Tailwind vars with real values
  // (applyThemeCssVariables sets --theme-* + bare --background, etc.)
  applyThemeCssVariables(theme, target);

  target.dataset.gliaTheme = theme.id;
}

// ============================================================================
// CONTEXT
// ============================================================================

export interface GliaThemeContextValue {
  theme: UiTheme;
  themeId: UiThemeId;
  setThemeId: (id: UiThemeId) => void;
}

const GliaThemeContext = React.createContext<GliaThemeContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export interface GliaThemeProviderProps {
  children: React.ReactNode;
  /** Theme ID (default: 'nebula') */
  themeId?: UiThemeId;
  /** Deep partial overrides merged on top of the resolved theme */
  overrides?: Partial<UiTheme>;
  /** Storage key for persisting theme preference */
  storageKey?: string;
}

const STORAGE_KEY = "glia-theme";

export function GliaThemeProvider({
  children,
  themeId: controlledThemeId,
  overrides,
  storageKey = STORAGE_KEY,
}: GliaThemeProviderProps) {
  const [internalThemeId, setInternalThemeId] = React.useState<UiThemeId>(
    controlledThemeId ?? DEFAULT_THEME_ID,
  );

  const activeThemeId = controlledThemeId ?? internalThemeId;

  const theme = React.useMemo(() => {
    const base = getTheme(activeThemeId);
    if (!overrides) return base;
    return { ...base, ...overrides } as UiTheme;
  }, [activeThemeId, overrides]);

  // Load persisted theme on mount (uncontrolled mode only)
  React.useEffect(() => {
    if (controlledThemeId !== undefined) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && (stored === "nebula" || stored === "solarpunk")) {
        setInternalThemeId(stored as UiThemeId);
      }
    } catch {
      // localStorage not available
    }
  }, [controlledThemeId, storageKey]);

  // Inject CSS variables
  useIsomorphicLayoutEffect(() => {
    applyGliaCssVariables(theme);
    return () => {
      // Cleanup handled by next theme application
    };
  }, [theme]);

  const setThemeId = React.useCallback(
    (id: UiThemeId) => {
      if (controlledThemeId === undefined) {
        setInternalThemeId(id);
        try {
          localStorage.setItem(storageKey, id);
        } catch {
          // localStorage not available
        }
      }
    },
    [controlledThemeId, storageKey],
  );

  const contextValue = React.useMemo<GliaThemeContextValue>(
    () => ({ theme, themeId: activeThemeId, setThemeId }),
    [theme, activeThemeId, setThemeId],
  );

  return (
    <GliaThemeContext.Provider value={contextValue}>
      {children}
    </GliaThemeContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useGliaTheme(): GliaThemeContextValue {
  const context = React.useContext(GliaThemeContext);
  if (!context) {
    throw new Error("useGliaTheme must be used within a GliaThemeProvider");
  }
  return context;
}

export function useFontTokens() {
  const { theme } = useGliaTheme();
  return theme.fonts;
}

export function useRadiiTokens() {
  const { theme } = useGliaTheme();
  return theme.radii;
}

export function useSpacingTokens() {
  const { theme } = useGliaTheme();
  return theme.spacing;
}

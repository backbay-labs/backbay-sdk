/**
 * @backbay/glia Desktop OS - Theme Types
 *
 * The theme system uses CSS variables for styling. Themes define the values,
 * and the ThemeProvider injects them as CSS custom properties.
 *
 * CSS variable naming convention: --bb-{category}-{name}
 * Example: --bb-color-accent, --bb-font-display, --bb-radius-window
 */

/**
 * Desktop OS theme definition.
 */
export interface DesktopOSTheme {
  /** Theme identifier */
  id: string;
  /** Display name */
  name: string;

  /** Color tokens */
  colors: {
    /** Window background */
    windowBg: string;
    /** Window border */
    windowBorder: string;
    /** Window border when focused */
    windowBorderFocused: string;
    /** Titlebar background */
    titlebarBg: string;
    /** Titlebar text */
    titlebarText: string;
    /** Primary accent color */
    accent: string;
    /** Muted accent (for backgrounds) */
    accentMuted: string;
    /** Glowing accent (for active states) */
    accentGlow: string;
    /** Taskbar background */
    taskbarBg: string;
    /** Taskbar text */
    taskbarText: string;
    /** Start menu background */
    startMenuBg: string;
    /** Context menu background */
    contextMenuBg: string;
    /** Context menu hover */
    contextMenuHover: string;
    /** Desktop background */
    desktopBg: string;
    /** Icon text color */
    iconText: string;
    /** Selected icon background */
    iconSelected: string;
    /** Destructive action color (close buttons, delete) */
    destructive: string;
    /** Success color */
    success: string;
    /** Warning color */
    warning: string;
    /** Text colors */
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
  };

  /** Font families */
  fonts: {
    /** Display font (headings, titles) */
    display: string;
    /** Body font (content) */
    body: string;
    /** Monospace font (code) */
    mono: string;
  };

  /** Border radii */
  radii: {
    /** Window border radius */
    window: string;
    /** Button border radius */
    button: string;
    /** Menu border radius */
    menu: string;
    /** Input border radius */
    input: string;
  };

  /** Shadow definitions */
  shadows: {
    /** Window shadow (unfocused) */
    window: string;
    /** Window shadow (focused) */
    windowFocused: string;
    /** Menu shadow */
    menu: string;
    /** Tooltip shadow */
    tooltip: string;
  };

  /** Spacing values */
  spacing: {
    /** Window content padding */
    windowPadding: string;
    /** Taskbar height */
    taskbarHeight: string;
    /** Desktop icon size */
    iconSize: string;
    /** Desktop icon grid gap */
    iconGap: string;
    /** Titlebar height */
    titlebarHeight: string;
    /** Window border width */
    windowBorderWidth: string;
  };

  /** Animation settings */
  animation: {
    /** Duration presets */
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    /** Easing presets */
    easing: {
      default: string;
      spring: string;
      bounce: string;
    };
  };

  /** Blur settings */
  blur: {
    /** Backdrop blur for glass effects */
    backdrop: string;
  };
}

/**
 * Partial theme for overriding specific values.
 */
export type PartialDesktopOSTheme = {
  [K in keyof DesktopOSTheme]?: K extends 'colors' | 'fonts' | 'radii' | 'shadows' | 'spacing'
    ? Partial<DesktopOSTheme[K]>
    : K extends 'animation'
      ? {
          duration?: Partial<DesktopOSTheme['animation']['duration']>;
          easing?: Partial<DesktopOSTheme['animation']['easing']>;
        }
      : K extends 'blur'
        ? Partial<DesktopOSTheme['blur']>
        : DesktopOSTheme[K];
};

/**
 * Convert a theme object to CSS custom properties.
 */
export function themeToCssVariables(theme: DesktopOSTheme): Record<string, string> {
  const vars: Record<string, string> = {};

  // Colors
  for (const [key, value] of Object.entries(theme.colors)) {
    vars[`--bb-color-${kebabCase(key)}`] = value;
  }

  // Fonts
  for (const [key, value] of Object.entries(theme.fonts)) {
    vars[`--bb-font-${key}`] = value;
  }

  // Radii
  for (const [key, value] of Object.entries(theme.radii)) {
    vars[`--bb-radius-${key}`] = value;
  }

  // Shadows
  for (const [key, value] of Object.entries(theme.shadows)) {
    vars[`--bb-shadow-${kebabCase(key)}`] = value;
  }

  // Spacing
  for (const [key, value] of Object.entries(theme.spacing)) {
    vars[`--bb-spacing-${kebabCase(key)}`] = value;
  }

  // Animation durations
  for (const [key, value] of Object.entries(theme.animation.duration)) {
    vars[`--bb-duration-${key}`] = value;
  }

  // Animation easing
  for (const [key, value] of Object.entries(theme.animation.easing)) {
    vars[`--bb-easing-${key}`] = value;
  }

  // Blur
  vars['--bb-blur-backdrop'] = theme.blur.backdrop;

  return vars;
}

/**
 * Merge a partial theme into a base theme.
 */
export function mergeTheme(
  base: DesktopOSTheme,
  partial: PartialDesktopOSTheme
): DesktopOSTheme {
  return {
    id: partial.id ?? base.id,
    name: partial.name ?? base.name,
    colors: { ...base.colors, ...partial.colors },
    fonts: { ...base.fonts, ...partial.fonts },
    radii: { ...base.radii, ...partial.radii },
    shadows: { ...base.shadows, ...partial.shadows },
    spacing: { ...base.spacing, ...partial.spacing },
    animation: {
      duration: { ...base.animation.duration, ...partial.animation?.duration },
      easing: { ...base.animation.easing, ...partial.animation?.easing },
    },
    blur: { ...base.blur, ...partial.blur },
  };
}

/**
 * Convert camelCase to kebab-case.
 */
function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

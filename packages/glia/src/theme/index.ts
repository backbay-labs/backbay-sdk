/**
 * Theme System Exports
 *
 * Central export point for the Out-of-Scope UI theme system.
 */

// Types
export type {
  AmbientType,
  MotionConfig,
  ThemeCssVariables,
  UiAmbientTokens,
  UiColorTokens,
  UiControlTokens,
  UiElevationTokens,
  UiFontTokens,
  UiGlassTokens,
  UiMotionTokens,
  UiRadiiTokens,
  UiSpacingTokens,
  UiTheme,
  UiThemeContextValue,
  UiThemeId,
} from "./types";

// Theme definitions
export { nebulaTheme } from "./nebula";
export { solarpunkTheme } from "./solarpunk";

// Registry
export {
  applyThemeCssVariables,
  DEFAULT_THEME_ID,
  getTheme,
  getThemeIds,
  removeThemeCssVariables,
  themeToCssVariables,
  THEMES,
} from "./registry";

// Provider & Hooks
export {
  UiThemeProvider,
  useAmbientTokens,
  useColorTokens,
  useControlTokens,
  useElevationTokens,
  useGlassTokens,
  useIsNebula,
  useIsSolarpunk,
  useMotionTokens,
  useThemeTokens,
  useUiTheme,
} from "./UiThemeProvider";
export type { UiThemeProviderProps } from "./UiThemeProvider";

// Unified Provider & Hooks
export {
  GliaThemeProvider,
  useGliaTheme,
  useFontTokens,
  useRadiiTokens,
  useSpacingTokens,
  applyGliaCssVariables,
  buildGliaCssVariables,
} from "./GliaThemeProvider";
export type { GliaThemeProviderProps, GliaThemeContextValue } from "./GliaThemeProvider";

// Bridge
export { desktopThemeFromUiTheme, type ThemeBridgeOptions } from "./bridge";

// Materials
export {
  GLASS_MATERIALS,
  getGlassMaterial,
  buildBackdropFilter,
  getReducedTransparencyStyles,
  type GlassMaterial,
  type GlassMaterialId,
} from "./materials";

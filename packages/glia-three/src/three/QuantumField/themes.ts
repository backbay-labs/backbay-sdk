/**
 * QuantumField Theme Presets
 *
 * Pre-configured theme settings for different visual aesthetics.
 * Includes Techno-Gothic themes designed for the Backbay design system.
 */

import type { FieldConfig, PaletteMode } from "./types";
import { DEFAULT_FIELD_CONFIG } from "./types";

// -----------------------------------------------------------------------------
// Theme Preset Type
// -----------------------------------------------------------------------------

export interface FieldThemePreset {
  name: string;
  description: string;
  config: Partial<FieldConfig>;
}

// -----------------------------------------------------------------------------
// Utility to apply theme
// -----------------------------------------------------------------------------

export function applyTheme(preset: FieldThemePreset): FieldConfig {
  return { ...DEFAULT_FIELD_CONFIG, ...preset.config };
}

// -----------------------------------------------------------------------------
// Techno-Gothic Theme Presets
// -----------------------------------------------------------------------------

/**
 * Gothic Cathedral - Stained glass aesthetics with ecclesiastical purple and sacred gold.
 * Inspired by medieval rose windows and cathedral architecture.
 */
export const THEME_GOTHIC_CATHEDRAL: FieldThemePreset = {
  name: "Gothic Cathedral",
  description: "Stained glass aesthetics with ecclesiastical purple and sacred gold",
  config: {
    style: "pcb",
    paletteMode: "gothic-cathedral" as PaletteMode,
    latticeMode: "hex", // Hexagonal lattice like rose window geometry
    accentIntensity: 1.3,
    iridescenceStrength: 0.5, // Strong iridescence like light through stained glass
    iridescenceScale: 18,
    exposure: 0.9,
    filmic: 0.9,
    grainStrength: 0.025, // Subtle grain for aged glass texture
    crtStrength: 0.15,
    copperStrength: 0.25,
    baseVisibility: 0.08,
    revealStrength: 1.2,
    microGrid1: 48,
    microGrid2: 144,
    microWarp: 0.02,
  },
};

/**
 * Gothic Void - Abyssal darkness with arterial red accents.
 * Inspired by gothic horror, the abyss, and blood rituals.
 */
export const THEME_GOTHIC_VOID: FieldThemePreset = {
  name: "Gothic Void",
  description: "Abyssal darkness with arterial red accents",
  config: {
    style: "pcb",
    paletteMode: "gothic-void" as PaletteMode,
    latticeMode: "tri", // Triangular for sharp, aggressive geometry
    accentIntensity: 1.5,
    iridescenceStrength: 0.2, // Minimal iridescence - raw and stark
    iridescenceScale: 8,
    exposure: 0.75, // Darker exposure
    filmic: 0.95,
    grainStrength: 0.04, // Heavy grain for gritty texture
    crtStrength: 0.3, // Strong CRT for decay/corruption effect
    copperStrength: 0.35,
    baseVisibility: 0.03, // Very dark base
    revealStrength: 1.4,
    microGrid1: 72,
    microGrid2: 220,
    microWarp: 0.03, // More warp for organic corruption
  },
};

/**
 * Gothic Sanctum - Oxidized bronze cathedral with verdigris patina.
 * Inspired by ancient bronze doors, oxidized metal, and sacred spaces.
 */
export const THEME_GOTHIC_SANCTUM: FieldThemePreset = {
  name: "Gothic Sanctum",
  description: "Oxidized bronze cathedral with verdigris patina",
  config: {
    style: "pcb",
    paletteMode: "gothic-sanctum" as PaletteMode,
    latticeMode: "rect", // Rectangular like door panels and ribbed vaults
    accentIntensity: 1.1,
    iridescenceStrength: 0.4, // Moderate iridescence for patina shimmer
    iridescenceScale: 12,
    exposure: 0.95,
    filmic: 0.85,
    grainStrength: 0.02,
    crtStrength: 0.2,
    copperStrength: 0.45, // Strong copper for bronze effect
    baseVisibility: 0.06,
    revealStrength: 1.0,
    microGrid1: 56,
    microGrid2: 168,
    microWarp: 0.018,
  },
};

/**
 * Gothic Rose - Deep crimson with gilded gold tracery.
 * Inspired by rose windows, blood roses, and medieval illumination.
 */
export const THEME_GOTHIC_ROSE: FieldThemePreset = {
  name: "Gothic Rose",
  description: "Deep crimson with gilded gold tracery",
  config: {
    style: "pcb",
    paletteMode: "gothic-rose" as PaletteMode,
    latticeMode: "hex", // Hexagonal for rose petal geometry
    accentIntensity: 1.4,
    iridescenceStrength: 0.45,
    iridescenceScale: 16,
    exposure: 0.85,
    filmic: 0.9,
    grainStrength: 0.02,
    crtStrength: 0.18,
    copperStrength: 0.3,
    baseVisibility: 0.07,
    revealStrength: 1.3,
    microGrid1: 52,
    microGrid2: 156,
    microWarp: 0.022,
    // Lens settings for dramatic cursor effect
    lensEnabled: true,
    lensRadius: 0.15,
    lensChromatic: 0.45,
  },
};

// -----------------------------------------------------------------------------
// Water Style Gothic Themes (for WaterField)
// -----------------------------------------------------------------------------

/**
 * Gothic Pool - Dark sanctum pool with bioluminescent ripples.
 * Like candlelight reflecting on dark sacred waters.
 */
export const THEME_GOTHIC_POOL: FieldThemePreset = {
  name: "Gothic Pool",
  description: "Dark sanctum pool with bioluminescent ripples",
  config: {
    style: "water",
    // Water style doesn't use paletteMode, but we can set related params
    exposure: 0.7,
    filmic: 0.95,
    grainStrength: 0.015,
  },
};

// -----------------------------------------------------------------------------
// Constellation Style Gothic Themes (for ConstellationField)
// -----------------------------------------------------------------------------

/**
 * Gothic Stars - Fractured constellation like shattered stained glass.
 */
export const THEME_GOTHIC_STARS: FieldThemePreset = {
  name: "Gothic Stars",
  description: "Fractured constellation like shattered stained glass",
  config: {
    style: "constellation",
    pointsCount: 8000, // Dense star field
    exposure: 0.8,
    filmic: 0.9,
    grainStrength: 0.02,
  },
};

// -----------------------------------------------------------------------------
// All Gothic Themes
// -----------------------------------------------------------------------------

export const GOTHIC_THEMES = {
  cathedral: THEME_GOTHIC_CATHEDRAL,
  void: THEME_GOTHIC_VOID,
  sanctum: THEME_GOTHIC_SANCTUM,
  rose: THEME_GOTHIC_ROSE,
  pool: THEME_GOTHIC_POOL,
  stars: THEME_GOTHIC_STARS,
} as const;

export type GothicThemeName = keyof typeof GOTHIC_THEMES;

/**
 * Get a gothic theme preset by name
 */
export function getGothicTheme(name: GothicThemeName): FieldThemePreset {
  return GOTHIC_THEMES[name];
}

/**
 * Get all available gothic theme names
 */
export function getGothicThemeNames(): GothicThemeName[] {
  return Object.keys(GOTHIC_THEMES) as GothicThemeName[];
}

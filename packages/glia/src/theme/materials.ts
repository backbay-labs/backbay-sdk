/**
 * Glass Materials -- Predefined glassmorphism material combinations.
 *
 * Materials define the visual "substance" of glass surfaces:
 * backdrop-filter settings, background opacity overrides,
 * border treatment, and noise overlay configuration.
 *
 * @example
 * ```tsx
 * <GlassPanel material="frosted">
 *   Content behind frosted glass
 * </GlassPanel>
 * ```
 */

import type { NoisePreset } from "../lib/noise";

export interface GlassMaterial {
  /** Material identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Backdrop filter value (blur + optional saturate/brightness) */
  backdropFilter: string;
  /** Background opacity multiplier (0-1, applied to panelBg alpha) */
  bgOpacity: number;
  /** Border opacity multiplier (0-1, applied to panelBorder alpha) */
  borderOpacity: number;
  /** Whether to show noise overlay */
  showNoise: boolean;
  /** Noise preset to use (if showNoise is true) */
  noisePreset: NoisePreset;
  /** Noise opacity override */
  noiseOpacity: number;
  /** Additional saturate filter (percentage). 100 = normal. */
  saturate: number;
  /** Additional brightness filter (percentage). 100 = normal. */
  brightness: number;
}

/**
 * Predefined glass materials.
 */
export const GLASS_MATERIALS: Record<string, GlassMaterial> = {
  /**
   * Standard frosted glass -- the default material.
   * Medium blur, full opacity, subtle noise grain.
   */
  frosted: {
    id: "frosted",
    name: "Frosted Glass",
    backdropFilter: "blur(24px)",
    bgOpacity: 1.0,
    borderOpacity: 1.0,
    showNoise: true,
    noisePreset: "glass",
    noiseOpacity: 0.03,
    saturate: 180,
    brightness: 110,
  },

  /**
   * Thin/clear glass -- minimal blur, very transparent.
   * For subtle layering where content behind should remain visible.
   */
  thin: {
    id: "thin",
    name: "Thin Glass",
    backdropFilter: "blur(8px)",
    bgOpacity: 0.4,
    borderOpacity: 0.6,
    showNoise: false,
    noisePreset: "fine",
    noiseOpacity: 0.02,
    saturate: 120,
    brightness: 105,
  },

  /**
   * Thick/dense glass -- heavy blur, opaque, strong borders.
   * For modals, dialogs, and high-contrast surfaces.
   */
  thick: {
    id: "thick",
    name: "Thick Glass",
    backdropFilter: "blur(40px)",
    bgOpacity: 1.2,
    borderOpacity: 1.5,
    showNoise: true,
    noisePreset: "card",
    noiseOpacity: 0.05,
    saturate: 200,
    brightness: 100,
  },

  /**
   * Clear glass -- no blur, just tinted transparency.
   * For overlays that should be visible but not obscured.
   */
  clear: {
    id: "clear",
    name: "Clear Glass",
    backdropFilter: "blur(0px)",
    bgOpacity: 0.3,
    borderOpacity: 0.4,
    showNoise: false,
    noisePreset: "glass",
    noiseOpacity: 0,
    saturate: 100,
    brightness: 100,
  },

  /**
   * Holographic glass -- saturated, vibrant, with heavy noise.
   * For decorative/accent panels with a sci-fi feel.
   */
  holographic: {
    id: "holographic",
    name: "Holographic Glass",
    backdropFilter: "blur(20px)",
    bgOpacity: 0.8,
    borderOpacity: 1.0,
    showNoise: true,
    noisePreset: "heavy",
    noiseOpacity: 0.08,
    saturate: 250,
    brightness: 120,
  },
};

export type GlassMaterialId = keyof typeof GLASS_MATERIALS;

/**
 * Get a glass material by ID, with fallback to 'frosted'.
 */
export function getGlassMaterial(id: GlassMaterialId | string): GlassMaterial {
  return GLASS_MATERIALS[id] ?? GLASS_MATERIALS.frosted;
}

/**
 * Build the complete backdrop-filter CSS value for a material.
 * Combines blur with saturate and brightness.
 */
export function buildBackdropFilter(material: GlassMaterial): string {
  const parts = [material.backdropFilter];
  if (material.saturate !== 100) {
    parts.push(`saturate(${material.saturate}%)`);
  }
  if (material.brightness !== 100) {
    parts.push(`brightness(${material.brightness}%)`);
  }
  return parts.join(" ");
}

/**
 * Compute the "reduced transparency" fallback for a material.
 * When the user prefers reduced transparency, we replace
 * backdrop-filter with a solid background and remove noise.
 */
export function getReducedTransparencyStyles(material: GlassMaterial): {
  backdropFilter: string;
  bgOpacity: number;
  showNoise: boolean;
} {
  return {
    backdropFilter: "none",
    bgOpacity: Math.min(material.bgOpacity * 2.5, 1.0),
    showNoise: false,
  };
}

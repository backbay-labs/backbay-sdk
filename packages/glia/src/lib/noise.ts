/**
 * Noise texture utilities for glassmorphism effects.
 *
 * Generates SVG-based noise textures as data URLs for use
 * as background overlays on glass surfaces.
 */

export interface NoiseConfig {
  /** Base frequency for fractal noise (0.1-2.0). Higher = finer grain. Default: 0.8 */
  baseFrequency?: number;
  /** Number of octaves (1-5). More octaves = more detail. Default: 3 */
  numOctaves?: number;
  /** Noise opacity (0-1). Default: 0.04 */
  opacity?: number;
  /** Tile size in pixels. Default: 200 */
  size?: number;
  /** Random seed. Default: 2 */
  seed?: number;
}

const DEFAULTS: Required<NoiseConfig> = {
  baseFrequency: 0.8,
  numOctaves: 3,
  opacity: 0.04,
  size: 200,
  seed: 2,
};

/**
 * Generate a noise texture SVG data URL with the given config.
 */
export function generateNoiseDataUrl(config?: NoiseConfig): string {
  const {
    baseFrequency,
    numOctaves,
    opacity,
    size,
    seed,
  } = { ...DEFAULTS, ...config };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="${baseFrequency}" numOctaves="${numOctaves}" seed="${seed}" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="${size}" height="${size}" filter="url(#n)" opacity="${opacity}"/></svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Pre-generated noise textures for common use cases */
export const NOISE_PRESETS = {
  /** Subtle grain for glass panels. opacity: 0.03, freq: 0.8 */
  glass: generateNoiseDataUrl({ opacity: 0.03, baseFrequency: 0.8 }),
  /** Medium grain for cards/sections. opacity: 0.05, freq: 0.7 */
  card: generateNoiseDataUrl({ opacity: 0.05, baseFrequency: 0.7 }),
  /** Heavy grain for film/retro effects. opacity: 0.12, freq: 0.9 */
  heavy: generateNoiseDataUrl({ opacity: 0.12, baseFrequency: 0.9 }),
  /** Fine grain for subtle texture. opacity: 0.02, freq: 1.2 */
  fine: generateNoiseDataUrl({ opacity: 0.02, baseFrequency: 1.2 }),
} as const;

export type NoisePreset = keyof typeof NOISE_PRESETS;

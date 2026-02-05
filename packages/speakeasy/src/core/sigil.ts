/**
 * Sigil Derivation
 *
 * Maps Ed25519 public key fingerprints to sigils for visual identity.
 * Uses the same sigil set as SpeakeasyDirectory.
 */

import type { SpeakeasySigil } from './types';

// =============================================================================
// Sigil Set
// =============================================================================

/**
 * Available sigils (matches SpeakeasyDirectory)
 */
export const SIGILS: readonly SpeakeasySigil[] = [
  'diamond',
  'eye',
  'wave',
  'crown',
  'spiral',
  'key',
  'star',
  'moon',
] as const;

/**
 * Sigil metadata for display
 */
export const SIGIL_METADATA: Record<SpeakeasySigil, SigilMetadata> = {
  diamond: {
    name: 'Diamond',
    description: 'Clarity and precision',
    unicode: '\u25C7', // ◇
  },
  eye: {
    name: 'Eye',
    description: 'Awareness and insight',
    unicode: '\u25CE', // ◎
  },
  wave: {
    name: 'Wave',
    description: 'Flow and adaptability',
    unicode: '\u223F', // ∿
  },
  crown: {
    name: 'Crown',
    description: 'Authority and leadership',
    unicode: '\u2655', // ♕
  },
  spiral: {
    name: 'Spiral',
    description: 'Growth and transformation',
    unicode: '\u058D', // ֍
  },
  key: {
    name: 'Key',
    description: 'Access and secrets',
    unicode: '\u26BF', // ⚿
  },
  star: {
    name: 'Star',
    description: 'Guidance and aspiration',
    unicode: '\u2606', // ☆
  },
  moon: {
    name: 'Moon',
    description: 'Mystery and intuition',
    unicode: '\u263E', // ☾
  },
};

export interface SigilMetadata {
  name: string;
  description: string;
  unicode: string;
}

// =============================================================================
// Derivation
// =============================================================================

/**
 * Derive sigil from fingerprint
 *
 * Uses first 2 hex characters of fingerprint to deterministically
 * select one of 8 sigils.
 *
 * @param fingerprint - 16-character hex fingerprint
 * @returns Sigil type
 */
export function deriveSigil(fingerprint: string): SpeakeasySigil {
  // Parse first byte (2 hex chars) as number
  const index = parseInt(fingerprint.slice(0, 2), 16) % SIGILS.length;
  return SIGILS[index];
}

/**
 * Get sigil metadata
 */
export function getSigilMetadata(sigil: SpeakeasySigil): SigilMetadata {
  return SIGIL_METADATA[sigil];
}

/**
 * Get sigil unicode character for text display
 */
export function getSigilUnicode(sigil: SpeakeasySigil): string {
  return SIGIL_METADATA[sigil].unicode;
}

// =============================================================================
// Color Derivation
// =============================================================================

/**
 * Derive a consistent color from fingerprint
 *
 * Uses HSL color space with fixed saturation and lightness for
 * consistent appearance, varying only hue based on fingerprint.
 *
 * @param fingerprint - 16-character hex fingerprint
 * @returns HSL color string
 */
export function deriveColor(fingerprint: string): string {
  // Use bytes 2-3 (chars 4-7) for hue
  const hue = parseInt(fingerprint.slice(4, 8), 16) % 360;
  // Fixed saturation and lightness for consistency
  return `hsl(${hue}, 60%, 50%)`;
}

/**
 * Derive a muted color variant (for backgrounds)
 */
export function deriveMutedColor(fingerprint: string): string {
  const hue = parseInt(fingerprint.slice(4, 8), 16) % 360;
  return `hsl(${hue}, 30%, 20%)`;
}

/**
 * Derive accent color (for highlights)
 */
export function deriveAccentColor(fingerprint: string): string {
  const hue = parseInt(fingerprint.slice(4, 8), 16) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Check if string is a valid sigil type
 */
export function isValidSigil(value: string): value is SpeakeasySigil {
  return SIGILS.includes(value as SpeakeasySigil);
}

import type { AnchorState, AVO, LegacyGlyphState, VisualState } from "../../../emotion/types";

export type GlyphState = LegacyGlyphState;

export type GlyphVariant = "sentinel" | "console" | "graph" | "minimal";

export type GlyphOneShot = Extract<LegacyGlyphState, "responding" | "success" | "error">;

export interface GlyphObjectProps {
  /** Legacy state (maps to baked animation + AVO transition) */
  state?: GlyphState;
  /** Named AVO anchor state (overrides `state`) */
  anchor?: AnchorState;
  /** Direct AVO dimensions (overrides `anchor` + `state`) */
  dimensions?: AVO;
  /** Pre-computed visual state (overrides everything) */
  visualState?: VisualState;
  /** Scale factor */
  scale?: number;
  /** Position in 3D space */
  position?: [number, number, number];
  /** Visual variant (material intensity + optional particles) */
  variant?: GlyphVariant;
  /** Custom model URL (defaults to `/models/glyph.glb`) */
  modelUrl?: string;
  /** Enable AVO-based animation blending (weights multiple baked animations by proximity) */
  enableBlending?: boolean;
  /** Trigger a one-shot baked animation clip (responding/success/error) */
  oneShot?: GlyphOneShot;
  /** Change this value to retrigger `oneShot` even if it stays the same */
  oneShotNonce?: number;
  /** Enable particle system around the glyph (default: true for `sentinel`) */
  enableParticles?: boolean;
  /** Click handler */
  onClick?: () => void;
}

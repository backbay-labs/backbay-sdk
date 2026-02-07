"use client";

import { useEffect, useMemo } from "react";
import { ANCHOR_STATES, computeVisualState, LEGACY_STATE_MAP, useEmotion } from "@backbay/glia-agent/emotion";
import type { AnchorState, AVO, LegacyGlyphState, VisualState } from "@backbay/glia-agent/emotion";

export interface UseGlyphEmotionOptions {
  /** Legacy state */
  state?: LegacyGlyphState;
  /** Named AVO anchor state (overrides `state`) */
  anchor?: AnchorState;
  /** Direct AVO dimensions (overrides `anchor` + `state`) */
  dimensions?: AVO;
  /** Pre-computed visual state (overrides everything) */
  visualState?: VisualState;
}

export interface UseGlyphEmotionResult {
  dimensions: AVO;
  visualState: VisualState;
}

/**
 * Hook that bridges Glyph state/anchor inputs to animated AVO + VisualState.
 *
 * Priority order:
 * 1. If `visualState` provided, use it directly
 * 2. If `dimensions` provided, compute visual state from them
 * 3. If `anchor` provided, drive useEmotion() toward that anchor
 * 4. If legacy `state` provided, convert via LEGACY_STATE_MAP and drive useEmotion()
 */
export function useGlyphEmotion(options: UseGlyphEmotionOptions): UseGlyphEmotionResult {
  const { state, anchor, dimensions: directDimensions, visualState: directVisualState } = options;

  const targetAnchor: AnchorState = anchor ?? (state ? LEGACY_STATE_MAP[state] : "idle");
  const shouldAutoTick = !directDimensions && !directVisualState;

  const { goTo, dimensions, visualState } = useEmotion({
    initialAnchor: targetAnchor,
    microExpressions: true,
    autoTick: shouldAutoTick,
  });

  // Transition when legacy state / anchor changes (only when controller is active).
  useEffect(() => {
    if (!shouldAutoTick) return;
    goTo(targetAnchor);
  }, [targetAnchor, shouldAutoTick, goTo]);

  const result = useMemo((): UseGlyphEmotionResult => {
    if (directVisualState) {
      return {
        dimensions: directDimensions ?? ANCHOR_STATES.idle,
        visualState: directVisualState,
      };
    }

    if (directDimensions) {
      return {
        dimensions: directDimensions,
        visualState: computeVisualState(directDimensions),
      };
    }

    return { dimensions, visualState };
  }, [directVisualState, directDimensions, dimensions, visualState]);

  return result;
}


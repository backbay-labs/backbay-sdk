/**
 * useOrganismEmotion
 *
 * Bridges OrganismState to the AVO emotion system.
 * Similar to useGlyphEmotion but for CrystallineOrganism.
 */

import { useEffect, useMemo } from "react";
import { useEmotion, ANCHOR_STATES, computeVisualState } from "../../../emotion";
import type { AVO, VisualState, AnchorState } from "../../../emotion/types";
import type { OrganismState } from "./types";
import { ORGANISM_STATE_MAP } from "./constants";

interface UseOrganismEmotionOptions {
  /** Legacy state (will be converted to AVO) */
  state?: OrganismState;
  /** Direct AVO dimensions (overrides state) */
  dimensions?: AVO;
  /** Pre-computed visual state (overrides dimensions) */
  visualState?: VisualState;
}

interface UseOrganismEmotionResult {
  dimensions: AVO;
  visualState: VisualState;
}

/**
 * Hook that bridges OrganismState, AVO dimensions, and VisualState.
 *
 * Priority order:
 * 1. If visualState provided, use it directly
 * 2. If dimensions provided, compute visual state from them
 * 3. If state provided, convert to anchor and use useEmotion hook
 */
export function useOrganismEmotion(options: UseOrganismEmotionOptions): UseOrganismEmotionResult {
  const { state, dimensions: directDimensions, visualState: directVisualState } = options;

  // Determine initial anchor from organism state (or default to 'idle')
  const initialAnchor: AnchorState = state ? ORGANISM_STATE_MAP[state] : "idle";

  // Always call useEmotion to satisfy React rules of hooks
  const { goTo, dimensions, visualState } = useEmotion({
    initialAnchor,
    microExpressions: true,
    autoTick: true,
  });

  // Transition when state changes
  useEffect(() => {
    // Only transition if we're using state mode (no direct dimensions/visualState)
    if (state && !directDimensions && !directVisualState) {
      const anchor = ORGANISM_STATE_MAP[state];
      goTo(anchor);
    }
  }, [state, directDimensions, directVisualState, goTo]);

  // Compute the result based on priority
  const result = useMemo((): UseOrganismEmotionResult => {
    // Priority 1: If visual state provided directly, use it
    if (directVisualState) {
      return {
        dimensions: directDimensions ?? ANCHOR_STATES.idle,
        visualState: directVisualState,
      };
    }

    // Priority 2: If dimensions provided directly, compute visual state
    if (directDimensions) {
      return {
        dimensions: directDimensions,
        visualState: computeVisualState(directDimensions),
      };
    }

    // Priority 3: Use the emotion hook's reactive state
    return {
      dimensions,
      visualState,
    };
  }, [directVisualState, directDimensions, dimensions, visualState]);

  return result;
}

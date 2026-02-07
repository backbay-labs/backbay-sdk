import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getAnimationWeights } from "@backbay/glia-agent/emotion";
import type { AVO, LegacyGlyphState } from "@backbay/glia-agent/emotion";
import type { GlyphOneShot } from "./types";

type ActionsMap = Record<string, THREE.AnimationAction | undefined>;

const LOOP_STATES: LegacyGlyphState[] = ["idle", "listening", "thinking", "sleep"];
const ONE_SHOT_STATES: GlyphOneShot[] = ["responding", "success", "error"];

// TimeScale modulation constants
const BASE_TIME_SCALE = 1.0;
const AROUSAL_INFLUENCE = 0.5; // Arousal 0..1 => timeScale ~0.75..1.25

function isOneShotState(state: LegacyGlyphState): state is GlyphOneShot {
  return ONE_SHOT_STATES.includes(state as GlyphOneShot);
}

function getPrefixForState(state: LegacyGlyphState): string {
  const capitalized = state.charAt(0).toUpperCase() + state.slice(1);
  return `Glyph_${capitalized}_`;
}

function getActionsForState(state: LegacyGlyphState, actions: ActionsMap): THREE.AnimationAction[] {
  const prefix = getPrefixForState(state);
  return Object.entries(actions)
    .filter(([name]) => name.startsWith(prefix))
    .map(([, action]) => action)
    .filter((a): a is THREE.AnimationAction => !!a);
}

function calculateTimeScale(arousal: number): number {
  return BASE_TIME_SCALE + (arousal - 0.5) * AROUSAL_INFLUENCE;
}

export interface UseGlyphControllerOptions {
  /** Arousal value for timeScale modulation (0-1) */
  arousal?: number;
  /** Current AVO dimensions for proximity-based blending */
  dimensions?: AVO;
  /** Enable blending mode (default: false for backward compatibility) */
  enableBlending?: boolean;
  /** Trigger a one-shot clip (responding/success/error) */
  oneShot?: GlyphOneShot;
  /** Change this value to retrigger `oneShot` even if it stays the same */
  oneShotNonce?: number;
}

/**
 * Controls glyph baked animations, supporting either:
 * 1) Legacy mode: hard transitions between states based on LegacyGlyphState
 * 2) Blending mode: weighted blending of multiple animations based on AVO proximity
 */
export function useGlyphController(
  state: LegacyGlyphState,
  actions: ActionsMap,
  options: UseGlyphControllerOptions = {}
) {
  const { arousal, dimensions, enableBlending = false, oneShot, oneShotNonce } = options;

  const actionsSignature = useMemo(() => Object.keys(actions).sort().join("|"), [actions]);

  // Track whether we've initialized play() for blending mode.
  const initializedRef = useRef(false);
  const lastSignatureRef = useRef<string | null>(null);

  const overlayActiveRef = useRef(false);
  const overlayEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlayStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearOverlayTimers = () => {
    if (overlayEndTimeoutRef.current) clearTimeout(overlayEndTimeoutRef.current);
    if (overlayStopTimeoutRef.current) clearTimeout(overlayStopTimeoutRef.current);
    overlayEndTimeoutRef.current = null;
    overlayStopTimeoutRef.current = null;
  };

  // Reset initialization if the underlying actions set changes (e.g., modelUrl swap).
  if (lastSignatureRef.current !== actionsSignature) {
    lastSignatureRef.current = actionsSignature;
    initializedRef.current = false;
    overlayActiveRef.current = false;
    clearOverlayTimers();
  }

  // Blending mode: weight multiple animations by AVO proximity.
  useEffect(() => {
    if (!enableBlending || !dimensions) return;

    const weights = getAnimationWeights(dimensions);
    const timeScale = calculateTimeScale(dimensions.arousal);
    const loopTotal = LOOP_STATES.reduce((sum, loopState) => sum + (weights[loopState] ?? 0), 0);
    const loopAttenuation = overlayActiveRef.current ? 0.15 : 1;

    // Initialize all animations on first run.
    if (!initializedRef.current) {
      LOOP_STATES.forEach((loopState) => {
        const stateActions = getActionsForState(loopState, actions);
        stateActions.forEach((action) => {
          action.reset();
          action.setEffectiveTimeScale(timeScale);
          action.setEffectiveWeight(0);
          action.loop = THREE.LoopRepeat;
          action.clampWhenFinished = false;
          action.play();
        });
      });

      initializedRef.current = true;
    }

    // Apply weights + timeScale to loop animations only.
    LOOP_STATES.forEach((loopState) => {
      const stateActions = getActionsForState(loopState, actions);
      const weight = loopTotal > 0 ? (weights[loopState] ?? 0) / loopTotal : loopState === "idle" ? 1 : 0;

      stateActions.forEach((action) => {
        action.setEffectiveWeight(weight * loopAttenuation);
        action.setEffectiveTimeScale(timeScale);
      });
    });
  }, [actions, dimensions, enableBlending, oneShotNonce]);

  // One-shot clips: play once on request (either explicit oneShot or when state is a one-shot).
  useEffect(() => {
    if (!enableBlending) return;

    const requestedOneShot: GlyphOneShot | null =
      oneShot ?? (isOneShotState(state) ? state : null);

    if (!requestedOneShot) return;

    clearOverlayTimers();

    const timeScale = calculateTimeScale(dimensions?.arousal ?? arousal ?? 0.5);
    const targetActions = getActionsForState(requestedOneShot, actions);
    if (targetActions.length === 0) return;

    // Fade/stop any currently running one-shot actions.
    ONE_SHOT_STATES.forEach((oneShotState) => {
      if (oneShotState === requestedOneShot) return;
      const running = getActionsForState(oneShotState, actions);
      running.forEach((action) => {
        if (!action.isRunning()) return;
        action.fadeOut(0.12);
        action.stop();
        action.reset();
        action.setEffectiveWeight(0);
      });
    });

    // Start the new one-shot.
    targetActions.forEach((action) => {
      action.reset();
      action.setEffectiveTimeScale(timeScale);
      action.setEffectiveWeight(1);
      action.loop = THREE.LoopOnce;
      action.clampWhenFinished = true;
      action.fadeIn(0.12).play();
    });

    overlayActiveRef.current = true;

    const maxDurationSec = targetActions.reduce((max, action) => Math.max(max, action.getClip().duration), 0);
    const durationMs = Math.max(1, Math.floor((maxDurationSec * 1000) / Math.max(0.001, timeScale)));

    overlayEndTimeoutRef.current = setTimeout(() => {
      targetActions.forEach((action) => action.fadeOut(0.18));
      overlayActiveRef.current = false;

      overlayStopTimeoutRef.current = setTimeout(() => {
        targetActions.forEach((action) => {
          action.stop();
          action.reset();
          action.setEffectiveWeight(0);
        });
      }, 220);
    }, durationMs);

    return () => {
      clearOverlayTimers();
    };
  }, [actionsSignature, state, oneShot, oneShotNonce, enableBlending, dimensions, arousal]);

  // Legacy mode: hard transitions between states.
  useEffect(() => {
    if (enableBlending && dimensions) return;

    const prefix = getPrefixForState(state);
    const loop = LOOP_STATES.includes(state);

    const targetActions = Object.entries(actions)
      .filter(([name]) => name.startsWith(prefix))
      .map(([, action]) => action)
      .filter((a): a is THREE.AnimationAction => !!a);

    if (targetActions.length === 0) return;

    Object.values(actions).forEach((action) => {
      if (!action || !action.isRunning()) return;
      action.fadeOut(0.3);
    });

    const timeScale = calculateTimeScale(arousal ?? 0.5);

    targetActions.forEach((action) => {
      action.reset();
      action.setEffectiveTimeScale(timeScale);
      action.setEffectiveWeight(1);
      action.clampWhenFinished = !loop;
      action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
      action.fadeIn(0.3).play();
    });

    initializedRef.current = false; // reset for potential switch to blending mode
  }, [state, actions, arousal, enableBlending, dimensions]);

  // Continuous timeScale modulation based on arousal (legacy mode only).
  useEffect(() => {
    if (enableBlending && dimensions) return;
    if (arousal === undefined) return;

    const timeScale = calculateTimeScale(arousal);

    Object.values(actions).forEach((action) => {
      if (!action?.isRunning()) return;
      action.setEffectiveTimeScale(timeScale);
    });
  }, [arousal, actions, enableBlending, dimensions]);
}

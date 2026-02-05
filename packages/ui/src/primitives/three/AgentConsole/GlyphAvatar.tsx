"use client";

/**
 * GlyphAvatar - 3D animated agent avatar
 *
 * GLB-backed Glyph with emotion-driven baked animations.
 */

import { useEffect, useRef, useState } from "react";
import type { GlyphAvatarProps } from "./types";
import type { GlyphVariant } from "../Glyph";
import type { GlyphOneShot } from "../Glyph";
import { GlyphObject } from "../Glyph";
import { LEGACY_STATE_MAP, useEmotion, type EmotionEvent } from "../../../emotion";
import type { LegacyGlyphState } from "../../../emotion/types";

export function GlyphAvatar({
  state,
  mode = "conversational",
  trustTier: _trustTier = "bronze",
  scale = 1,
  position = [0, 0, 0],
  onClick,
}: GlyphAvatarProps) {
  const variant: GlyphVariant =
    mode === "monitoring" ? "minimal" : mode === "focused" || mode === "commanding" ? "sentinel" : "console";

  const initialAnchor = LEGACY_STATE_MAP[state as LegacyGlyphState];

  const { dimensions, visualState, emit } = useEmotion({
    initialAnchor,
    microExpressions: true,
    autoTick: true,
  });

  const prevStateRef = useRef<GlyphAvatarProps["state"] | null>(null);
  const idleAfterSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [oneShot, setOneShot] = useState<GlyphOneShot | undefined>(undefined);
  const [oneShotNonce, setOneShotNonce] = useState(0);

  const triggerOneShot = (clip: GlyphOneShot) => {
    setOneShot(clip);
    setOneShotNonce((n) => n + 1);
  };

  const emitEvent = (event: EmotionEvent) => {
    emit(event);
  };

  useEffect(() => {
    const prevState = prevStateRef.current;
    prevStateRef.current = state;

    if (idleAfterSuccessTimeoutRef.current) {
      clearTimeout(idleAfterSuccessTimeoutRef.current);
      idleAfterSuccessTimeoutRef.current = null;
    }

    if (prevState === state) return;

    // Map coarse AgentState into the EmotionEvent stream.
    switch (state) {
      case "listening":
        emitEvent({ type: "input_received", intensity: 0.5 });
        break;
      case "thinking":
        emitEvent({ type: "processing_start", intensity: 0.6 });
        break;
      case "responding":
        emitEvent({ type: "processing_complete", intensity: 0.6 });
        triggerOneShot("responding");
        break;
      case "error":
        emitEvent({ type: "error_occurred", intensity: 0.85 });
        triggerOneShot("error");
        break;
      case "idle":
      default: {
        // If we just finished responding, give a short success flourish before returning to idle.
        if (prevState === "responding") {
          emitEvent({ type: "success", intensity: 0.65 });
          triggerOneShot("success");
          idleAfterSuccessTimeoutRef.current = setTimeout(() => {
            emitEvent({ type: "user_idle", intensity: 0.5 });
          }, 1400);
        } else {
          emitEvent({ type: "user_idle", intensity: 0.5 });
        }
        break;
      }
    }
  }, [state, emit]);

  useEffect(() => {
    return () => {
      if (idleAfterSuccessTimeoutRef.current) {
        clearTimeout(idleAfterSuccessTimeoutRef.current);
      }
    };
  }, []);

  return (
    <GlyphObject
      state={state}
      position={position}
      scale={scale}
      variant={variant}
      enableBlending={true}
      dimensions={dimensions}
      visualState={visualState}
      oneShot={oneShot}
      oneShotNonce={oneShotNonce}
      onClick={onClick}
    />
  );
}

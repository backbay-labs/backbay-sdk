/**
 * SpeakeasyOrb (MVP)
 *
 * Minimal orb UI that:
 * - detects a public "knock" (triple tap) to request a challenge
 * - captures a short gesture sequence while challenged
 */

import { motion } from 'motion/react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { useSpeakeasy } from '../SpeakeasyProvider.js';
import { useGestureRecognizer } from '../hooks/useGestureRecognizer.js';
import type { DoormanState, OrbState, OrbVisualConfig } from '../types.js';
import { DEFAULT_ORB_CONFIG } from '../types.js';

export interface SpeakeasyOrbProps {
  config?: Partial<OrbVisualConfig>;
}

export function SpeakeasyOrb({ config: partialConfig }: SpeakeasyOrbProps) {
  const config = useMemo(() => {
    const merged: OrbVisualConfig = {
      ...DEFAULT_ORB_CONFIG,
      ...partialConfig,
      glowIntensity: { ...DEFAULT_ORB_CONFIG.glowIntensity, ...partialConfig?.glowIntensity },
      pulseSpeed: { ...DEFAULT_ORB_CONFIG.pulseSpeed, ...partialConfig?.pulseSpeed },
      colors: { ...DEFAULT_ORB_CONFIG.colors, ...partialConfig?.colors },
    };
    return merged;
  }, [partialConfig]);

  const { state, knock, submitGesture, isAdmitted, timeRemaining } = useSpeakeasy();

  const orbRef = useRef<HTMLDivElement>(null);
  const finalizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const knockTapCountRef = useRef(0);
  const knockTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { handlers, startCapture, endCapture, reset } = useGestureRecognizer({
    centerRef: orbRef,
    onGestureStep: () => {
      if (finalizeTimeoutRef.current) clearTimeout(finalizeTimeoutRef.current);
      finalizeTimeoutRef.current = setTimeout(async () => {
        const sequence = await endCapture();
        if (sequence) {
          await submitGesture(sequence);
        }
      }, 350);
    },
  });

  // Start/stop capture based on doorman state.
  useEffect(() => {
    if (state === 'CHALLENGED') {
      startCapture();
      return;
    }
    reset();
    if (finalizeTimeoutRef.current) {
      clearTimeout(finalizeTimeoutRef.current);
      finalizeTimeoutRef.current = null;
    }
  }, [state, startCapture, reset]);

  const handleKnockTap = useCallback(() => {
    // Triple tap within a short window.
    knockTapCountRef.current += 1;

    if (knockTapTimeoutRef.current) clearTimeout(knockTapTimeoutRef.current);

    if (knockTapCountRef.current >= 3) {
      knockTapCountRef.current = 0;
      knock();
      return;
    }

    knockTapTimeoutRef.current = setTimeout(() => {
      knockTapCountRef.current = 0;
    }, 500);
  }, [knock]);

  // Map doorman state to orb visual state
  const ORB_STATE_MAP: Record<DoormanState, OrbState> = {
    IDLE: 'idle',
    CHALLENGED: 'challenged',
    VERIFYING: 'verifying',
    ADMITTED: 'admitted',
    DECOY: 'decoy',
    COOLDOWN: 'idle',
    LOCKED: 'locked',
  };
  const orbState = ORB_STATE_MAP[state] ?? 'idle';

  const glow = config.glowIntensity[orbState];
  const color = config.colors[orbState];
  const pulseMs = config.pulseSpeed[orbState];

  // Accessible labels for each state
  const ARIA_LABELS: Record<DoormanState, string> = {
    IDLE: 'Speakeasy: triple-tap to knock',
    CHALLENGED: 'Speakeasy: perform gesture now',
    VERIFYING: 'Speakeasy: verifying your gesture',
    ADMITTED: 'Speakeasy: access granted',
    DECOY: 'Speakeasy: decoy mode active',
    COOLDOWN: 'Speakeasy: please wait before retrying',
    LOCKED: 'Speakeasy: temporarily locked',
  };
  const ariaLabel = ARIA_LABELS[state] ?? 'Speakeasy';

  return (
    <motion.div
      ref={orbRef}
      role="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={(e) => {
        handlers.onPointerUp(e);
        if (state === 'IDLE') {
          handleKnockTap();
        }
      }}
      onPointerCancel={handlers.onPointerCancel}
      animate={pulseMs > 0 ? { opacity: [0.9, 1, 0.9] } : { opacity: 1 }}
      transition={pulseMs > 0 ? { duration: pulseMs / 1000, repeat: Infinity, ease: 'easeInOut' } : undefined}
      style={{
        position: 'relative',
        width: config.size,
        height: config.size,
        borderRadius: '50%',
        border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
        background:
          'linear-gradient(160deg, rgba(0, 0, 0, 0.55), rgba(8, 8, 10, 0.85))',
        boxShadow: `0 0 ${24 + glow * 36}px color-mix(in srgb, ${color} ${20 + glow * 40}%, transparent), 0 6px 26px rgba(0, 0, 0, 0.45)`,
        display: 'grid',
        placeItems: 'center',
        userSelect: 'none',
        touchAction: 'none',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: config.size * 0.35,
          height: config.size * 0.35,
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${color} 60%, white), color-mix(in srgb, ${color} 35%, transparent) 55%, transparent 70%)`,
          opacity: isAdmitted ? 1 : 0.9,
        }}
      />
      {typeof timeRemaining === 'number' && state !== 'IDLE' && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            top: config.size + 8,
            fontSize: 12,
            color: 'var(--text-muted, rgba(255,255,255,0.72))',
            fontFamily: 'ui-sans-serif, system-ui',
            textAlign: 'center',
            width: 140,
          }}
        >
          <span aria-label={`${state.toLowerCase()}, ${Math.ceil(timeRemaining / 1000)} seconds remaining`}>
            {state.toLowerCase()} · {Math.ceil(timeRemaining / 1000)}s
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default SpeakeasyOrb;

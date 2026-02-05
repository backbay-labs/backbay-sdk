/**
 * SpeakeasyRitualPad
 *
 * Generic capture surface for gesture rituals.
 */

import React, { useEffect, useMemo, useRef } from 'react';

import { useGestureRecognizer } from '../hooks/useGestureRecognizer.js';
import type { GestureSequence, GestureStep } from '../types.js';

export interface SpeakeasyRitualPadProps {
  disabled?: boolean;
  autoStart?: boolean;
  onComplete: (sequence: GestureSequence) => void | Promise<void>;
  onStep?: (step: GestureStep) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function SpeakeasyRitualPad({
  disabled = false,
  autoStart = true,
  onComplete,
  onStep,
  className,
  style,
}: SpeakeasyRitualPadProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const finalizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { handlers, startCapture, endCapture, reset } = useGestureRecognizer({
    centerRef: padRef,
    onGestureStep: (step) => {
      onStep?.(step);
      if (finalizeTimeoutRef.current) clearTimeout(finalizeTimeoutRef.current);
      finalizeTimeoutRef.current = setTimeout(async () => {
        const sequence = await endCapture();
        if (sequence) {
          await onComplete(sequence);
        }
      }, 350);
    },
  });

  useEffect(() => {
    if (!autoStart || disabled) return;
    startCapture();
    return () => reset();
  }, [autoStart, disabled, startCapture, reset]);

  const mergedStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'relative',
      width: 240,
      height: 240,
      borderRadius: 24,
      border: '1px solid rgba(255,255,255,0.10)',
      background:
        'radial-gradient(circle at 35% 30%, rgba(212,168,75,0.18), rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.55) 100%)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      touchAction: 'none',
      userSelect: 'none',
      opacity: disabled ? 0.55 : 1,
      ...style,
    }),
    [disabled, style]
  );

  return (
    <div
      ref={padRef}
      className={className}
      style={mergedStyle}
      aria-disabled={disabled}
      onPointerDown={disabled ? undefined : handlers.onPointerDown}
      onPointerMove={disabled ? undefined : handlers.onPointerMove}
      onPointerUp={disabled ? undefined : handlers.onPointerUp}
      onPointerCancel={disabled ? undefined : handlers.onPointerCancel}
    >
      <div
        style={{
          position: 'absolute',
          inset: 14,
          borderRadius: 18,
          border: '1px dashed rgba(255,255,255,0.18)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 12,
          right: 12,
          fontSize: 12,
          color: 'rgba(255,255,255,0.72)',
          fontFamily: 'ui-sans-serif, system-ui',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        Tap · hold · radial drag · flick
      </div>
    </div>
  );
}

export default SpeakeasyRitualPad;


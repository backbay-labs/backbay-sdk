import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../primitives/ui/dialog';
import { Button } from '../../primitives/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../primitives/ui/alert-dialog';

import { fingerprintGestureSequence } from '../auth/SpeakeasyAuth.js';
import { useSpeakeasy } from '../SpeakeasyProvider.js';
import type { GestureSequence, GestureStep } from '../types.js';
import { SpeakeasyRitualPad } from './SpeakeasyRitualPad.js';

type RegistrationPhase = 'idle' | 'record' | 'confirm' | 'success';

function describeStep(step: GestureStep): string {
  switch (step.type) {
    case 'tap':
      return `tap ×${step.count} (${step.region})`;
    case 'hold':
      return `hold ${Math.round(step.durationMs)}ms (${step.region})`;
    case 'radial_drag':
      return `radial drag ${Math.round(step.fromAngle)}°→${Math.round(step.toAngle)}° (notches ${step.notches})`;
    case 'flick':
      return `flick ${step.direction} (${step.velocity.toFixed(2)}px/ms)`;
  }
}

export interface SpeakeasyRegistrationDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SpeakeasyRegistrationDialog({
  trigger,
  open: openProp,
  onOpenChange,
}: SpeakeasyRegistrationDialogProps) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;

  const { isRegistered, register, clearRegistration } = useSpeakeasy();

  const [phase, setPhase] = useState<RegistrationPhase>('idle');
  const [first, setFirst] = useState<GestureSequence | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPhase('idle');
      setFirst(null);
      setError(null);
    }
  }, [open]);

  const stepsSummary = useMemo(() => {
    if (!first) return null;
    return first.steps.map(describeStep);
  }, [first]);

  const start = useCallback(() => {
    setError(null);
    setFirst(null);
    setPhase('record');
  }, []);

  const handleFirst = useCallback(async (sequence: GestureSequence) => {
    setError(null);
    setFirst(sequence);
    setPhase('confirm');
  }, []);

  const handleConfirm = useCallback(
    async (sequence: GestureSequence) => {
      if (!first) return;
      const a = fingerprintGestureSequence(first);
      const b = fingerprintGestureSequence(sequence);
      if (a !== b) {
        setError('That didn’t match. Try again.');
        setPhase('record');
        setFirst(null);
        return;
      }

      await register(first);
      setError(null);
      setPhase('success');
    },
    [first, register]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Speakeasy ritual</DialogTitle>
          <DialogDescription>
            Register a short gesture sequence (3–5 steps). You’ll need to repeat it to confirm.
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: 'grid', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ display: 'grid', gap: 2 }}>
              <div style={{ fontWeight: 600 }}>
                Status: {isRegistered ? 'registered' : 'not registered'}
              </div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                Stored secret is a verifier output (not raw gestures).
              </div>
            </div>

            {isRegistered ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">Clear</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear ritual?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes the registered verifier from storage. You’ll need to register again to enter.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        await clearRegistration();
                        setPhase('idle');
                        setFirst(null);
                      }}
                    >
                      Clear
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>

          {error ? (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid rgba(239,68,68,0.35)',
                background: 'rgba(239,68,68,0.10)',
                color: 'rgba(255,255,255,0.92)',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          ) : null}

          {phase === 'idle' ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ fontSize: 13, opacity: 0.85 }}>
                Tip: Use rhythmic taps, a short hold, and a notch-like radial drag.
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button onClick={start}>{isRegistered ? 'Replace ritual' : 'Register ritual'}</Button>
              </div>
            </div>
          ) : null}

          {phase === 'record' ? (
            <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>Step 1: Record your ritual</div>
              <SpeakeasyRitualPad onComplete={handleFirst} />
              <div style={{ fontSize: 13, opacity: 0.8, textAlign: 'center' }}>
                Perform your gesture. It will auto-finish after a brief pause.
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                <Button variant="outline" onClick={() => setPhase('idle')}>Cancel</Button>
              </div>
            </div>
          ) : null}

          {phase === 'confirm' ? (
            <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>Step 2: Repeat to confirm</div>
              <SpeakeasyRitualPad onComplete={handleConfirm} />
              {stepsSummary ? (
                <div style={{ fontSize: 12, opacity: 0.75, width: '100%' }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Recorded</div>
                  <ol style={{ margin: 0, paddingLeft: 18 }}>
                    {stepsSummary.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ol>
                </div>
              ) : null}
              <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', gap: 8 }}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFirst(null);
                    setPhase('record');
                    setError(null);
                  }}
                >
                  Redo
                </Button>
                <Button variant="outline" onClick={() => setPhase('idle')}>Cancel</Button>
              </div>
            </div>
          ) : null}

          {phase === 'success' ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ fontWeight: 600 }}>Ritual registered.</div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>
                You can now triple-tap to knock and perform your gesture to enter.
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
            }}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SpeakeasyRegistrationDialog;


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

import { SpeakeasyAuth, type SpeakeasyAuthOptions } from '../auth/SpeakeasyAuth.js';
import { SpeakeasyNotReadyError } from '../SpeakeasyProvider.js';
import { createCapabilityToken } from '../auth/CapabilityIssuer.js';
import { randomHex } from '../auth/crypto.js';
import {
  createDefaultDeviceSecretProvider,
  type SpeakeasyDeviceSecretProvider,
} from '../auth/deviceSecret.js';
import { isPanicGesture } from '../doorman/panic.js';
import type { CapabilityToken, Challenge, GestureSequence } from '../types.js';
import { SpeakeasyRitualPad } from './SpeakeasyRitualPad.js';

export interface SpeakeasyConsentRequest {
  requester: string;
  purpose: string;
  scopes: string[];
}

export interface SpeakeasyConsentDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  request: SpeakeasyConsentRequest;
  authOptions?: SpeakeasyAuthOptions;
  deviceSecret?: SpeakeasyAuthOptions['deviceSecret'];
  deviceSecretProvider?: SpeakeasyDeviceSecretProvider;
  issuer?: string;
  ttlMs?: number;
  onGranted: (token: CapabilityToken) => void;
}

type ConsentPhase = 'idle' | 'challenged' | 'locked';

const DEFAULTS = {
  challengeWindowMs: 30_000,
  maxFailures: 3,
  cooldownBaseMs: 1_000,
  lockDurationMs: 300_000,
};

export function SpeakeasyConsentDialog({
  trigger,
  open: openProp,
  onOpenChange,
  request,
  authOptions,
  deviceSecret,
  deviceSecretProvider,
  issuer = 'bb-ui:speakeasy:consent',
  ttlMs = 300_000,
  onGranted,
}: SpeakeasyConsentDialogProps) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;

  const [resolvedDeviceSecret, setResolvedDeviceSecret] = useState<
    SpeakeasyAuthOptions['deviceSecret'] | undefined
  >(deviceSecret);

  useEffect(() => {
    let cancelled = false;
    if (deviceSecret !== undefined) {
      setResolvedDeviceSecret(deviceSecret);
      return;
    }

    const provider = deviceSecretProvider ?? createDefaultDeviceSecretProvider();
    provider.getOrCreateDeviceSecret().then((secret) => {
      if (!cancelled) setResolvedDeviceSecret(secret);
    });

    return () => {
      cancelled = true;
    };
  }, [deviceSecret, deviceSecretProvider]);

  // Auth is only created once deviceSecret is resolved (prevents race condition)
  const auth = useMemo(() => {
    if (resolvedDeviceSecret === undefined) {
      return null; // Not ready yet
    }
    return new SpeakeasyAuth({
      ...authOptions,
      deviceSecret: resolvedDeviceSecret,
    });
  }, [authOptions, resolvedDeviceSecret]);

  const [phase, setPhase] = useState<ConsentPhase>('idle');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failures, setFailures] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [lockUntil, setLockUntil] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setPhase('idle');
      setChallenge(null);
      setError(null);
      setFailures(0);
      setCooldownUntil(null);
      setLockUntil(null);
    }
  }, [open]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const remaining = cooldownUntil - Date.now();
    if (remaining <= 0) {
      setCooldownUntil(null);
      return;
    }
    const id = setTimeout(() => setCooldownUntil(null), remaining);
    return () => clearTimeout(id);
  }, [cooldownUntil]);

  useEffect(() => {
    if (!lockUntil) return;
    const remaining = lockUntil - Date.now();
    if (remaining <= 0) {
      setLockUntil(null);
      setPhase('idle');
      return;
    }
    const id = setTimeout(() => {
      setLockUntil(null);
      setPhase('idle');
    }, remaining);
    return () => clearTimeout(id);
  }, [lockUntil]);

  const begin = useCallback(async () => {
    setError(null);

    if (!auth) {
      // User-friendly message for UI (matches SpeakeasyNotReadyError semantics)
      setError('Initializing secure storage. Please wait a moment.');
      return;
    }

    if (!(await auth.isRegistered())) {
      setError('No ritual is registered on this device yet.');
      return;
    }

    if (lockUntil && Date.now() < lockUntil) {
      setPhase('locked');
      return;
    }

    const now = Date.now();
    const next: Challenge = {
      nonce: randomHex(32),
      salt: randomHex(16),
      issuedAt: now,
      expiresAt: now + DEFAULTS.challengeWindowMs,
    };
    setChallenge(next);
    setPhase('challenged');
  }, [auth, lockUntil]);

  const onRitualComplete = useCallback(
    async (sequence: GestureSequence) => {
      if (!challenge || !auth) return;

      if (Date.now() > challenge.expiresAt) {
        setError('Challenge expired. Try again.');
        setPhase('idle');
        setChallenge(null);
        return;
      }

      // Panic ritual always locks in consent flows.
      if (isPanicGesture(sequence)) {
        const now = Date.now();
        setLockUntil(now + DEFAULTS.lockDurationMs);
        setPhase('locked');
        setChallenge(null);
        setError('Locked (panic).');
        return;
      }

      const result = await auth.verifyGesture(sequence, challenge);
      if (!result.ok) {
        const nextFailures = failures + 1;
        setFailures(nextFailures);

        if (nextFailures >= DEFAULTS.maxFailures) {
          const now = Date.now();
          setLockUntil(now + DEFAULTS.lockDurationMs);
          setPhase('locked');
          setChallenge(null);
          setError('Too many attempts. Locked.');
          return;
        }

        const cooldownMs = DEFAULTS.cooldownBaseMs * Math.pow(2, nextFailures - 1);
        setCooldownUntil(Date.now() + cooldownMs);
        setError('Incorrect ritual.');
        setPhase('idle');
        setChallenge(null);
        return;
      }

      const verifier = await auth.getVerifier();
      if (!verifier) {
        setError('No ritual is registered on this device yet.');
        setPhase('idle');
        setChallenge(null);
        return;
      }

      const token = await createCapabilityToken({
        verifierKeyHex: verifier.hash,
        issuer,
        scopes: request.scopes,
        ttlMs,
        constraints: { maxUses: 1, allowedOrigins: [verifier.domain] },
      });

      onGranted(token);
      setOpen(false);
    },
    [auth, challenge, failures, issuer, request.scopes, ttlMs, onGranted, setOpen]
  );

  const remainingLockSeconds = lockUntil ? Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000)) : 0;
  const remainingCooldownMs = cooldownUntil ? Math.max(0, cooldownUntil - Date.now()) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Consent gate</DialogTitle>
          <DialogDescription>
            {request.requester} requests speakeasy access for: {request.purpose}
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: 'grid', gap: 12 }}>
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

          {phase === 'locked' ? (
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              Locked. Try again in {remainingLockSeconds}s.
            </div>
          ) : null}

          {phase === 'challenged' ? (
            <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>Perform ritual</div>
              <SpeakeasyRitualPad onComplete={onRitualComplete} />
            </div>
          ) : null}

          {phase === 'idle' ? (
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ fontSize: 13, opacity: 0.85 }}>
                Scopes: <code>{request.scopes.join(', ')}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Deny
                </Button>
                <Button onClick={begin} disabled={remainingCooldownMs > 0}>
                  {remainingCooldownMs > 0
                    ? `Cooldown (${Math.ceil(remainingCooldownMs / 1000)}s)`
                    : 'Perform ritual'}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SpeakeasyConsentDialog;

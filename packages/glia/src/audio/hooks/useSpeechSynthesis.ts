import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AVO } from '../../emotion/types.js';
import { planSpeech, type AudioPlannerSignals } from '../planner.js';
import { validateAudioProof } from '../schema.js';
import type {
  AudioPolicy,
  AudioProof,
  AudioVerifier,
  SpeechSynthesisProvider,
  SpeechSynthesisRequest,
  SpeechSynthesisResult,
  VoiceCatalog,
} from '../types.js';
import { useAudioPlayer } from './useAudioPlayer.js';
import { useBargeIn } from './useBargeIn.js';

// =============================================================================
// Types
// =============================================================================

export interface UseSpeechSynthesisOptions {
  provider: SpeechSynthesisProvider;
  verifier?: AudioVerifier;

  voices: VoiceCatalog;
  policy: AudioPolicy;

  signals?: AudioPlannerSignals;
  defaults?: {
    voiceId?: string;
    groundedVoiceTag?: string;
    defaultVoiceTag?: string;
    temperature?: number;
  };

  /**
   * If provided, enables barge-in (user speech cancels synthesis and playback).
   */
  bargeIn?: {
    stream: MediaStream | null;
    threshold?: number;
    hangoverMs?: number;
  };

  /**
   * Playback volume 0..1
   */
  volume?: number;

  /**
   * Controls when verification happens.
   *
   * - "before_playback": verify first; only play if verified (best for high-trust lanes)
   * - "after_playback": play immediately; verify in background (best UX when trust allows)
   * - "never": do not verify (not recommended)
   *
   * Default: derived from policy (`requireProofBeforePlayback`).
   */
  verificationMode?: 'before_playback' | 'after_playback' | 'never';

  onProof?: (proof: AudioProof) => void;
  onBargeIn?: () => void;
  onError?: (error: Error) => void;
}

export interface SpeakOptions {
  runId?: string;
  language?: string;
  targetAffect?: AVO;
}

export interface UseSpeechSynthesisReturn {
  isSynthesizing: boolean;
  isSpeaking: boolean;
  error: string | null;

  lastRequest: SpeechSynthesisRequest | null;
  lastResult: SpeechSynthesisResult | null;
  lastProof: AudioProof | null;

  speak: (text: string, options?: SpeakOptions) => Promise<void>;
  cancel: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions): UseSpeechSynthesisReturn {
  const {
    provider,
    verifier,
    voices,
    policy,
    signals,
    defaults,
    bargeIn,
    volume = 1,
    verificationMode,
    onProof,
    onBargeIn,
    onError,
  } = options;

  const effectiveVerificationMode = useMemo(() => {
    if (verificationMode) return verificationMode;
    if (policy.requireProofBeforePlayback) return 'before_playback';
    if (verifier) return 'after_playback';
    return 'never';
  }, [verificationMode, policy.requireProofBeforePlayback, verifier]);

  const abortRef = useRef<AbortController | null>(null);

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lastRequest, setLastRequest] = useState<SpeechSynthesisRequest | null>(null);
  const [lastResult, setLastResult] = useState<SpeechSynthesisResult | null>(null);
  const [lastProof, setLastProof] = useState<AudioProof | null>(null);

  const player = useAudioPlayer({
    volume,
    onError: (err) => {
      setError(err.message);
      onError?.(err);
    },
  });

  const bargeInState = useBargeIn({
    stream: bargeIn?.stream ?? null,
    enabled: !!bargeIn?.stream,
    threshold: bargeIn?.threshold,
    hangoverMs: bargeIn?.hangoverMs,
    onBargeIn: () => {
      onBargeIn?.();
    },
  });

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsSynthesizing(false);
    player.stop();
  }, [player]);

  useEffect(() => {
    if (!bargeIn?.stream) return;
    if (!bargeInState.isUserSpeaking) return;

    cancel();
  }, [bargeIn?.stream, bargeInState.isUserSpeaking, cancel]);

  const speak = useCallback(
    async (text: string, speakOptions?: SpeakOptions) => {
      cancel();
      setError(null);
      setIsSynthesizing(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const request = planSpeech({
          text,
          language: speakOptions?.language,
          runId: speakOptions?.runId,
          targetAffect: speakOptions?.targetAffect,
          policy,
          voices,
          signals,
          defaults,
        });

        setLastRequest(request);

        const result = await provider.synthesizeSpeech(request, { signal: controller.signal });
        setLastResult(result);

        // If provider included proof, validate it before trusting it.
        let proof: AudioProof | undefined = result.proof;
        if (proof) {
          const parsed = validateAudioProof(proof);
          if (!parsed.success) {
            throw new Error('Provider returned invalid AudioProof');
          }
          proof = parsed.data as AudioProof;
        }

        const verifyNow =
          effectiveVerificationMode === 'before_playback' &&
          (!proof || !proof.verdict?.passed) &&
          !!verifier;

        if (verifyNow && verifier) {
          proof = await verifier.verifySpeech({ request, result, policy });
          const parsed = validateAudioProof(proof);
          if (!parsed.success) {
            throw new Error('Verifier returned invalid AudioProof');
          }
          proof = parsed.data as AudioProof;
        }

        if (policy.requireProofBeforePlayback && (!proof || proof.verdict.passed !== true)) {
          throw new Error('Playback blocked by policy: missing or failing AudioProof');
        }

        // Playback
        await player.play(result.audio);

        // Background verification (if allowed).
        if (effectiveVerificationMode === 'after_playback' && verifier && !proof) {
          void (async () => {
            try {
              const p = await verifier.verifySpeech({ request, result, policy });
              const parsed = validateAudioProof(p);
              if (!parsed.success) return;
              setLastProof(parsed.data as AudioProof);
              onProof?.(parsed.data as AudioProof);
            } catch {
              // Ignore background verification errors.
            }
          })();
        }

        if (proof) {
          setLastProof(proof);
          onProof?.(proof);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Speech synthesis failed';
        setError(message);
        onError?.(err instanceof Error ? err : new Error(message));
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setIsSynthesizing(false);
        abortRef.current = null;
      }
    },
    [
      cancel,
      policy,
      voices,
      signals,
      defaults,
      provider,
      verifier,
      effectiveVerificationMode,
      player,
      onProof,
      onError,
    ]
  );

  return {
    isSynthesizing,
    isSpeaking: player.isPlaying,
    error,

    lastRequest,
    lastResult,
    lastProof,

    speak,
    cancel,
  };
}


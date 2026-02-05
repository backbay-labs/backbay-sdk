'use client';

import { useCallback } from 'react';
import type { AVO } from '../../emotion/types.js';
import type { CognitionState, CognitionEvent } from '../../cognition/types.js';
import { useCognition, type UseCognitionOptions } from '../../cognition/hooks/useCognition.js';
import type { EmotionTarget } from '../../cognition/controller.js';
import { planSpeechFromCognition } from '../planner.js';
import type {
  AudioPolicy,
  AudioProof,
  AudioVerifier,
  SpeechSynthesisProvider,
  SpeechSynthesisRequest,
  SpeechSynthesisResult,
  VoiceCatalog,
} from '../types.js';
import { useSpeechSynthesis, type UseSpeechSynthesisOptions } from './useSpeechSynthesis.js';

// =============================================================================
// Types
// =============================================================================

export interface UseCognitionSpeechOptions {
  // Speech synthesis options
  provider: SpeechSynthesisProvider;
  verifier?: AudioVerifier;
  voices: VoiceCatalog;
  policy: AudioPolicy;
  volume?: number;
  verificationMode?: 'before_playback' | 'after_playback' | 'never';

  // Cognition options
  initialCognition?: Partial<CognitionState>;
  autoTick?: boolean;
  onCognitionChange?: (state: CognitionState) => void;

  // Barge-in
  bargeIn?: {
    stream: MediaStream | null;
    threshold?: number;
    hangoverMs?: number;
  };

  // Voice defaults
  defaults?: {
    voiceId?: string;
    groundedVoiceTag?: string;
    defaultVoiceTag?: string;
    temperature?: number;
  };

  // Callbacks
  onProof?: (proof: AudioProof) => void;
  onBargeIn?: () => void;
  onError?: (error: Error) => void;
}

export interface SpeakWithCognitionOptions {
  runId?: string;
  language?: string;
  targetAffect?: AVO;
}

export interface UseCognitionSpeechReturn {
  // Cognition
  cognition: CognitionState;
  emotion: EmotionTarget;
  handleCognition: (event: CognitionEvent) => void;
  /** @deprecated Use handleCognition instead */
  emitCognition: (event: CognitionEvent) => void;
  tickCognition: (deltaMs: number) => void;

  // Speech
  isSynthesizing: boolean;
  isSpeaking: boolean;
  error: string | null;
  lastRequest: SpeechSynthesisRequest | null;
  lastResult: SpeechSynthesisResult | null;
  lastProof: AudioProof | null;

  speak: (text: string, options?: SpeakWithCognitionOptions) => Promise<void>;
  cancel: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useCognitionSpeech(
  options: UseCognitionSpeechOptions
): UseCognitionSpeechReturn {
  const {
    provider,
    verifier,
    voices,
    policy,
    volume,
    verificationMode,
    initialCognition,
    autoTick = true,
    onCognitionChange,
    bargeIn,
    defaults,
    onProof,
    onBargeIn,
    onError,
  } = options;

  // Cognition state
  const cognitionResult = useCognition({
    initial: initialCognition,
    autoTick,
    onChange: onCognitionChange,
  });

  // Speech synthesis - uses signals derived from cognition
  const speechResult = useSpeechSynthesis({
    provider,
    verifier,
    voices,
    policy,
    volume,
    verificationMode,
    signals: {
      mode: cognitionResult.state.mode,
      personaDriftRisk: cognitionResult.state.personaDriftRisk,
      confidence: cognitionResult.state.confidence,
      risk: cognitionResult.state.risk,
    },
    defaults,
    bargeIn,
    onProof,
    onBargeIn: () => {
      // On barge-in, emit interrupt to cognition
      cognitionResult.handleEvent({ type: 'ui.interrupt' });
      onBargeIn?.();
    },
    onError,
  });

  // Speak using full cognition state
  const speak = useCallback(
    async (text: string, speakOptions?: SpeakWithCognitionOptions) => {
      // Plan using full cognition state
      const request = planSpeechFromCognition({
        text,
        language: speakOptions?.language,
        runId: speakOptions?.runId,
        targetAffect: speakOptions?.targetAffect,
        cognition: cognitionResult.state,
        policy,
        voices,
        defaults,
      });

      // Synthesize and play
      await speechResult.speak(text, {
        ...speakOptions,
        targetAffect: request.targetAffect,
      });
    },
    [cognitionResult.state, policy, voices, defaults, speechResult]
  );

  return {
    // Cognition
    cognition: cognitionResult.state,
    emotion: cognitionResult.emotion,
    handleCognition: cognitionResult.handleEvent,
    emitCognition: cognitionResult.handleEvent, // deprecated alias
    tickCognition: cognitionResult.tick,

    // Speech
    isSynthesizing: speechResult.isSynthesizing,
    isSpeaking: speechResult.isSpeaking,
    error: speechResult.error,
    lastRequest: speechResult.lastRequest,
    lastResult: speechResult.lastResult,
    lastProof: speechResult.lastProof,

    speak,
    cancel: speechResult.cancel,
  };
}

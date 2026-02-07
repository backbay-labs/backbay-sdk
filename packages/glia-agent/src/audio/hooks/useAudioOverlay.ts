import { useCallback, useMemo, useRef } from 'react';
import type { AVO } from '../../emotion/types.js';
import type { AudioPlannerSignals } from '../planner.js';
import { pickOverlayPhrase, type OverlayPhraseLibrary, type OverlayToken } from '../overlay.js';
import type {
  AudioPolicy,
  AudioProof,
  AudioVerifier,
  SpeechSynthesisProvider,
  VoiceCatalog,
} from '../types.js';
import { useSpeechSynthesis, type SpeakOptions } from './useSpeechSynthesis.js';

// =============================================================================
// Types
// =============================================================================

export interface UseAudioOverlayOptions {
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

  phrases?: Partial<OverlayPhraseLibrary>;

  bargeIn?: {
    stream: MediaStream | null;
    threshold?: number;
    hangoverMs?: number;
  };

  volume?: number;
  verificationMode?: 'before_playback' | 'after_playback' | 'never';

  onProof?: (proof: AudioProof) => void;
  onBargeIn?: () => void;
  onError?: (error: Error) => void;
}

export interface OverlaySpeakOptions extends SpeakOptions {
  targetAffect?: AVO;
}

export interface UseAudioOverlayReturn {
  isSynthesizing: boolean;
  isSpeaking: boolean;
  error: string | null;

  lastProof: AudioProof | null;

  speakToken: (token: OverlayToken, options?: OverlaySpeakOptions) => Promise<void>;
  speakText: (text: string, options?: OverlaySpeakOptions) => Promise<void>;
  cancel: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useAudioOverlay(options: UseAudioOverlayOptions): UseAudioOverlayReturn {
  const {
    provider,
    verifier,
    voices,
    policy,
    signals,
    defaults,
    phrases,
    bargeIn,
    volume,
    verificationMode,
    onProof,
    onBargeIn,
    onError,
  } = options;

  const phraseIndexRef = useRef(0);

  const overlayDefaults = useMemo(() => {
    return {
      ...defaults,
      // Default to low temperature so overlay cues are stable and “assistant-like”.
      temperature: defaults?.temperature ?? 0.2,
    };
  }, [defaults]);

  const speech = useSpeechSynthesis({
    provider,
    verifier,
    voices,
    policy,
    signals,
    defaults: overlayDefaults,
    bargeIn,
    volume,
    verificationMode,
    onProof,
    onBargeIn,
    onError,
  });

  const speakToken = useCallback(
    async (token: OverlayToken, overlaySpeakOptions?: OverlaySpeakOptions) => {
      const idx = phraseIndexRef.current++;
      const text = pickOverlayPhrase({ token, library: phrases, index: idx });
      await speech.speak(text, overlaySpeakOptions);
    },
    [speech, phrases]
  );

  const speakText = useCallback(
    async (text: string, overlaySpeakOptions?: OverlaySpeakOptions) => {
      await speech.speak(text, overlaySpeakOptions);
    },
    [speech]
  );

  return {
    isSynthesizing: speech.isSynthesizing,
    isSpeaking: speech.isSpeaking,
    error: speech.error,
    lastProof: speech.lastProof,
    speakToken,
    speakText,
    cancel: speech.cancel,
  };
}


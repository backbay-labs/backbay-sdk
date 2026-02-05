import { useCallback, useEffect } from 'react';
import type { UseSpeechSynthesisOptions, UseSpeechSynthesisReturn, SpeakOptions } from './useSpeechSynthesis.js';
import { useSpeechSynthesis } from './useSpeechSynthesis.js';
import type { UseAudioOverlayOptions, UseAudioOverlayReturn } from './useAudioOverlay.js';
import { useAudioOverlay } from './useAudioOverlay.js';

// =============================================================================
// Types
// =============================================================================

export interface UseHybridSpeechOptions {
  main: UseSpeechSynthesisOptions;
  overlay: UseAudioOverlayOptions & { enabled?: boolean };

  /**
   * If true, automatically stops overlay playback when main speech starts.
   */
  stopOverlayOnMainSpeak?: boolean;
}

export interface UseHybridSpeechReturn {
  main: UseSpeechSynthesisReturn;
  overlay: UseAudioOverlayReturn;

  /**
   * Convenience: play a quick acknowledgement (overlay) while synthesizing main speech.
   * Overlay is best-effort and will not block main speech if it fails.
   */
  speakWithAck: (text: string, options?: SpeakOptions) => Promise<void>;

  cancelAll: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useHybridSpeech(options: UseHybridSpeechOptions): UseHybridSpeechReturn {
  const { main: mainOptions, overlay: overlayOptions, stopOverlayOnMainSpeak = true } = options;

  const main = useSpeechSynthesis(mainOptions);

  const overlayEnabled = overlayOptions.enabled !== false;
  const overlay = useAudioOverlay(overlayOptions);

  useEffect(() => {
    if (!stopOverlayOnMainSpeak) return;
    if (!overlayEnabled) return;
    if (!main.isSpeaking) return;

    overlay.cancel();
  }, [stopOverlayOnMainSpeak, overlayEnabled, main.isSpeaking, overlay]);

  const speakWithAck = useCallback(
    async (text: string, speakOptions?: SpeakOptions) => {
      if (overlayEnabled) {
        void overlay.speakToken('ack', speakOptions).catch(() => {});
      }

      try {
        await main.speak(text, speakOptions);
      } catch (err) {
        if (overlayEnabled) overlay.cancel();
        throw err;
      }
    },
    [overlayEnabled, overlay, main]
  );

  const cancelAll = useCallback(() => {
    main.cancel();
    if (overlayEnabled) overlay.cancel();
  }, [main, overlayEnabled, overlay]);

  return { main, overlay, speakWithAck, cancelAll };
}


import { useEffect, useRef, useState } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface UseBargeInOptions {
  /**
   * Microphone or remote user stream.
   * You must request user consent in the host app (getUserMedia) and pass it in.
   */
  stream: MediaStream | null;

  enabled?: boolean;

  /**
   * RMS threshold in 0..1.
   * Typical values are small; start around 0.02 and calibrate per environment.
   */
  threshold?: number;

  /**
   * Keep "speaking" true for this long after signal drops below threshold.
   */
  hangoverMs?: number;

  /**
   * Called on the rising edge (silence -> speaking).
   */
  onBargeIn?: () => void;
}

export interface UseBargeInReturn {
  isUserSpeaking: boolean;
  levelRms: number;
}

// =============================================================================
// Hook
// =============================================================================

export function useBargeIn(options: UseBargeInOptions): UseBargeInReturn {
  const { stream, enabled = true, threshold = 0.02, hangoverMs = 250, onBargeIn } = options;

  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [levelRms, setLevelRms] = useState(0);

  const rafRef = useRef<number | null>(null);
  const lastAboveRef = useRef<number>(0);
  const prevSpeakingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !stream) {
      setIsUserSpeaking(false);
      setLevelRms(0);
      return;
    }

    if (typeof AudioContext === 'undefined') {
      // Cannot compute RMS without Web Audio; degrade gracefully.
      return;
    }

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    const buffer = new Float32Array(analyser.fftSize);

    const tick = () => {
      analyser.getFloatTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        const x = buffer[i];
        sum += x * x;
      }
      const rms = Math.sqrt(sum / buffer.length);
      setLevelRms(rms);

      const now = performance.now();

      if (rms >= threshold) {
        lastAboveRef.current = now;
      }

      const speaking = rms >= threshold || now - lastAboveRef.current <= hangoverMs;
      setIsUserSpeaking(speaking);

      if (!prevSpeakingRef.current && speaking) {
        onBargeIn?.();
      }
      prevSpeakingRef.current = speaking;

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      try {
        source.disconnect();
        analyser.disconnect();
      } catch {
        // Ignore.
      }
      audioContext.close().catch(() => {});
    };
  }, [stream, enabled, threshold, hangoverMs, onBargeIn]);

  return { isUserSpeaking, levelRms };
}


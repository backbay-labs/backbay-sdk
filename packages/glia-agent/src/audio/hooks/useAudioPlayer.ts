import { useCallback, useEffect, useRef, useState } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface UseAudioPlayerOptions {
  volume?: number;
  onEnded?: () => void;
  onError?: (error: Error) => void;
}

export interface UseAudioPlayerReturn {
  isPlaying: boolean;
  error: string | null;
  play: (source: Blob | string) => Promise<void>;
  stop: () => void;
  audioElement: HTMLAudioElement | null;
}

// =============================================================================
// Hook
// =============================================================================

export function useAudioPlayer(options: UseAudioPlayerOptions = {}): UseAudioPlayerReturn {
  const { volume = 1, onEnded, onError } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure we have an audio element.
  if (!audioRef.current && typeof Audio !== 'undefined') {
    audioRef.current = new Audio();
  }

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // Ignore.
    } finally {
      setIsPlaying(false);
    }
  }, []);

  const play = useCallback(
    async (source: Blob | string) => {
      const audio = audioRef.current;
      if (!audio) {
        throw new Error('Audio playback not supported in this environment');
      }

      setError(null);

      // Clean up previous object URL.
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      const src = typeof source === 'string' ? source : URL.createObjectURL(source);
      if (typeof source !== 'string') {
        objectUrlRef.current = src;
      }

      audio.volume = volume;
      audio.src = src;

      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to play audio';
        setIsPlaying(false);
        setError(message);
        onError?.(err instanceof Error ? err : new Error(message));
        throw err instanceof Error ? err : new Error(message);
      }
    },
    [volume, onError]
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleError = () => {
      setIsPlaying(false);
      const message = 'Audio element error';
      setError(message);
      onError?.(new Error(message));
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [onEnded, onError]);

  useEffect(() => {
    return () => {
      stop();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [stop]);

  return {
    isPlaying,
    error,
    play,
    stop,
    audioElement: audioRef.current,
  };
}


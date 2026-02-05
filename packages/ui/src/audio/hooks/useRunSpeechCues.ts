import { useEffect, useRef } from 'react';
import { useRunStream } from '../../hooks/useRunStream.js';
import type { RunStatus } from '../../protocol/types.js';
import type { OverlayToken } from '../overlay.js';

// =============================================================================
// Types
// =============================================================================

export interface RunSpeechCueMap {
  onStart?: OverlayToken;
  onComplete?: OverlayToken;
  onFail?: OverlayToken;
  onCancel?: OverlayToken;
}

export interface UseRunSpeechCuesOptions {
  runId: string | null;
  enabled?: boolean;

  /**
   * Called with the selected overlay token. Typical implementation calls
   * `overlay.speakToken(token, { runId })`.
   */
  emit: (token: OverlayToken, args: { runId: string; status: RunStatus }) => void | Promise<void>;

  cues?: RunSpeechCueMap;

  /**
   * Minimum time between cue emissions (prevents spam on flappy status updates).
   */
  cooldownMs?: number;
}

// =============================================================================
// Defaults
// =============================================================================

export const DEFAULT_RUN_SPEECH_CUES: Required<RunSpeechCueMap> = {
  onStart: 'hold',
  onComplete: 'done',
  onFail: 'error',
  onCancel: 'warning',
};

// =============================================================================
// Hook
// =============================================================================

export function useRunSpeechCues(options: UseRunSpeechCuesOptions): void {
  const { runId, enabled = true, emit, cues, cooldownMs = 800 } = options;

  const { status } = useRunStream(runId);

  const prevStatusRef = useRef<RunStatus | null>(null);
  const lastEmitAtRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    if (!runId) return;

    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (prev === status) return;

    const now = Date.now();
    if (now - lastEmitAtRef.current < cooldownMs) return;

    const cueMap = { ...DEFAULT_RUN_SPEECH_CUES, ...(cues ?? {}) };

    let token: OverlayToken | null = null;
    if (status === 'running') token = cueMap.onStart;
    if (status === 'completed') token = cueMap.onComplete;
    if (status === 'failed') token = cueMap.onFail;
    if (status === 'cancelled') token = cueMap.onCancel;

    if (!token) return;

    lastEmitAtRef.current = now;
    void emit(token, { runId, status });
  }, [enabled, runId, status, emit, cues, cooldownMs]);
}


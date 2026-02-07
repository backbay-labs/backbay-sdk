import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BBProvider } from '../components/BBProvider.js';
import { useBargeIn } from './hooks/useBargeIn.js';
import { useHybridSpeech } from './hooks/useHybridSpeech.js';
import { useRunSpeechCues } from './hooks/useRunSpeechCues.js';
import type { OverlayToken } from './overlay.js';
import { HttpSpeechSynthesisProvider } from './providers/httpSpeechSynthesisProvider.js';
import type { AudioPolicy, VoiceCatalog } from './types.js';

type Props = {
  mockMode: boolean;
  baseUrl: string;
  apiKey: string;
  voiceId: string;
  initialText: string;

  runId: string;
  enableRunCues: boolean;

  safetyMode: boolean;
  requireProofBeforePlayback: boolean;

  bargeInThreshold: number;
};

/**
 * Mock provider that simulates TTS without a real server.
 * Useful for Storybook demos and testing UI without a backend.
 */
function createMockProvider(): import('./types.js').SpeechSynthesisProvider {
  return {
    providerId: 'mock',
    synthesizeSpeech: async (request) => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200));

      // Create a silent audio blob (minimal WAV header + silence)
      const sampleRate = 22050;
      const duration = Math.min(request.text.length * 0.05, 3); // ~50ms per char, max 3s
      const numSamples = Math.floor(sampleRate * duration);
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);

      // WAV header
      const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      };
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + numSamples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, numSamples * 2, true);
      // Silence (zeros) for audio data

      const blob = new Blob([buffer], { type: 'audio/wav' });

      return {
        audio: blob,
        artifact: {
          id: `mock_${Date.now()}`,
          format: 'wav',
          sha256: 'mock_hash',
          durationMs: duration * 1000,
          sampleRateHz: sampleRate,
          channels: 1,
        },
      };
    },
  };
}

function createSingleVoiceCatalog(voiceId: string): VoiceCatalog {
  const entry = {
    voiceId,
    displayName: voiceId,
    language: 'en',
    tags: ['default', 'grounded'],
    licenseCategory: 'unknown' as const,
  };

  return {
    get: (id) => (id === voiceId ? entry : null),
    list: () => [entry],
  };
}

function HybridSpeechDemo(props: Props) {
  const {
    mockMode,
    baseUrl,
    apiKey,
    voiceId,
    initialText,
    runId,
    enableRunCues,
    safetyMode,
    requireProofBeforePlayback,
    bargeInThreshold,
  } = props;

  const [text, setText] = useState(initialText);
  const [runIdInput, setRunIdInput] = useState(runId);

  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const [prewarmStatus, setPrewarmStatus] = useState<string | null>(null);

  useEffect(() => setText(initialText), [initialText]);
  useEffect(() => setRunIdInput(runId), [runId]);

  const headers = useMemo(() => {
    if (!apiKey) return {};
    return { Authorization: `Bearer ${apiKey}` };
  }, [apiKey]);

  const provider = useMemo(() => {
    if (mockMode) {
      return createMockProvider();
    }
    return new HttpSpeechSynthesisProvider({
      baseUrl,
      headers,
    });
  }, [mockMode, baseUrl, headers]);

  const voices = useMemo(() => createSingleVoiceCatalog(voiceId), [voiceId]);

  const policy: AudioPolicy = useMemo(
    () => ({
      safetyMode,
      trustTier: 'dev',
      voiceCloningAllowed: false,
      requireProofBeforePlayback,
      allowedVoiceIds: [voiceId],
    }),
    [safetyMode, requireProofBeforePlayback, voiceId]
  );

  const startMic = useCallback(async () => {
    setMicError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicError('getUserMedia is not available in this environment');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);
    } catch (err) {
      setMicError(err instanceof Error ? err.message : 'Failed to start microphone');
    }
  }, []);

  const stopMic = useCallback(() => {
    setMicStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      micStream?.getTracks().forEach((t) => t.stop());
    };
  }, [micStream]);

  const bargeIn = useBargeIn({
    stream: micStream,
    enabled: !!micStream,
    threshold: bargeInThreshold,
  });

  const hybrid = useHybridSpeech({
    main: {
      provider,
      voices,
      policy,
      defaults: { voiceId, temperature: 0.65 },
      bargeIn: { stream: micStream, threshold: bargeInThreshold },
      verificationMode: requireProofBeforePlayback ? 'before_playback' : 'after_playback',
    },
    overlay: {
      provider,
      voices,
      policy,
      defaults: { voiceId },
      bargeIn: { stream: micStream, threshold: bargeInThreshold },
      verificationMode: requireProofBeforePlayback ? 'before_playback' : 'after_playback',
    },
  });

  const handlePrewarm = useCallback(async () => {
    if (mockMode) {
      setPrewarmStatus('mock mode - no prewarm needed');
      return;
    }

    setPrewarmStatus(null);

    const url = `${baseUrl.replace(/\/$/, '')}/v1/tts/prewarm`;
    try {
      setPrewarmStatus('warming…');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ voiceId }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`);
      }

      const payload = (await res.json()) as { warmed: number; requested: number };
      setPrewarmStatus(`warmed ${payload.warmed}/${payload.requested}`);
    } catch (err) {
      setPrewarmStatus(err instanceof Error ? err.message : 'prewarm failed');
    }
  }, [mockMode, baseUrl, headers, voiceId]);

  const speakOverlayToken = useCallback(
    async (token: OverlayToken) => {
      await hybrid.overlay.speakToken(token, { runId: runIdInput || undefined });
    },
    [hybrid.overlay, runIdInput]
  );

  const emitRunCue = useCallback(
    async (token: OverlayToken, args: { runId: string }) => {
      await hybrid.overlay.speakToken(token, { runId: args.runId });
    },
    [hybrid.overlay]
  );

  useRunSpeechCues({
    runId: enableRunCues && runIdInput.trim() ? runIdInput.trim() : null,
    enabled: enableRunCues,
    emit: (token, args) => emitRunCue(token, { runId: args.runId }),
  });

  const disabled = !mockMode && (!baseUrl || !voiceId);

  return (
    <div style={{ padding: 18, fontFamily: 'ui-sans-serif, system-ui', color: '#e7e7f0' }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 420px', minWidth: 360 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Hybrid Speech (Truth lane + Overlay lane)</h2>
          <p style={{ marginTop: 8, opacity: 0.8, lineHeight: 1.35 }}>
            Uses a self-hosted `POST /v1/tts` provider for both lanes. Overlay lane is meant for short cues (ack/hold/done).
          </p>
          {mockMode && (
            <div
              style={{
                marginTop: 8,
                padding: '8px 12px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 8,
                fontSize: 12,
                color: '#10b981',
              }}
            >
              <strong>Mock Mode:</strong> Using simulated TTS (no server required). Disable mock mode in controls to use a real TTS server.
            </div>
          )}

          <label style={{ display: 'block', marginTop: 12, fontSize: 13, opacity: 0.9 }}>
            Main text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              marginTop: 6,
              padding: 10,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: 'inherit',
            }}
          />

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
            <button
              disabled={disabled || hybrid.main.isSynthesizing}
              onClick={() => void hybrid.main.speak(text, { runId: runIdInput || undefined })}
            >
              Speak (main)
            </button>
            <button
              disabled={disabled || hybrid.main.isSynthesizing}
              onClick={() => void hybrid.speakWithAck(text, { runId: runIdInput || undefined })}
            >
              Speak with ack (overlay)
            </button>
            <button onClick={hybrid.cancelAll}>Cancel</button>
            <button disabled={disabled} onClick={() => void handlePrewarm()}>
              Prewarm overlay cache
            </button>
          </div>

          {prewarmStatus && (
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>Prewarm: {prewarmStatus}</div>
          )}

          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(['ack', 'hold', 'done', 'error', 'warning'] as const).map((token) => (
              <button key={token} disabled={disabled} onClick={() => void speakOverlayToken(token)}>
                Overlay: {token}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            flex: '0 0 360px',
            minWidth: 320,
            padding: 12,
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(0,0,0,0.25)',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15 }}>Barge-in + Run Cues</h3>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
            <button onClick={() => void startMic()} disabled={!!micStream}>
              Start mic
            </button>
            <button onClick={stopMic} disabled={!micStream}>
              Stop mic
            </button>
          </div>

          {micError && <div style={{ marginTop: 8, fontSize: 12, color: '#ffb4b4' }}>{micError}</div>}

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9 }}>
            Mic: {micStream ? 'on' : 'off'} · Speaking: {bargeIn.isUserSpeaking ? 'yes' : 'no'} · RMS:{' '}
            {bargeIn.levelRms.toFixed(4)}
          </div>

          <label style={{ display: 'block', marginTop: 14, fontSize: 12, opacity: 0.9 }}>
            Run ID (for `useRunSpeechCues`)
          </label>
          <input
            value={runIdInput}
            onChange={(e) => setRunIdInput(e.target.value)}
            placeholder="run_…"
            style={{
              width: '100%',
              marginTop: 6,
              padding: 10,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: 'inherit',
            }}
          />

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.85 }}>
            Main: {hybrid.main.isSynthesizing ? 'synthesizing' : hybrid.main.isSpeaking ? 'speaking' : 'idle'} · Overlay:{' '}
            {hybrid.overlay.isSynthesizing ? 'synthesizing' : hybrid.overlay.isSpeaking ? 'speaking' : 'idle'}
          </div>

          {(hybrid.main.error || hybrid.overlay.error) && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#ffb4b4' }}>
              Error: {hybrid.main.error ?? hybrid.overlay.error}
            </div>
          )}

          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: 'pointer', fontSize: 12, opacity: 0.9 }}>Last proofs</summary>
            <pre style={{ fontSize: 11, opacity: 0.85, overflowX: 'auto' }}>
              {JSON.stringify(
                {
                  main: hybrid.main.lastProof?.verdict,
                  overlay: hybrid.overlay.lastProof?.verdict,
                },
                null,
                2
              )}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}

const meta: Meta<typeof HybridSpeechDemo> = {
  title: 'Systems/Audio/HybridSpeech',
  component: HybridSpeechDemo,
  args: {
    mockMode: true,
    baseUrl: 'http://localhost:8080',
    apiKey: '',
    voiceId: 'default',
    initialText: 'Testing hybrid speech. You can interrupt me by speaking into the microphone.',
    runId: '',
    enableRunCues: false,
    safetyMode: true,
    requireProofBeforePlayback: true,
    bargeInThreshold: 0.02,
  },
  argTypes: {
    mockMode: {
      description: 'Use mock TTS provider (no server required)',
      control: { type: 'boolean' },
    },
    bargeInThreshold: {
      control: { type: 'range', min: 0.001, max: 0.12, step: 0.001 },
    },
  },
  decorators: [
    (Story, context) => {
      const baseUrl = String(context.args.baseUrl ?? '');
      const apiKey = String(context.args.apiKey ?? '');
      const trimmed = baseUrl.replace(/\/$/, '');

      return (
        <BBProvider
          config={{
            apiBaseUrl: `${trimmed}/api`,
            headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
          }}
        >
          <Story />
        </BBProvider>
      );
    },
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof HybridSpeechDemo>;

export const Demo: Story = {};

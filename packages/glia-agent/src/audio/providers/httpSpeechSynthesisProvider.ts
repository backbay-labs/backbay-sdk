import { validateAudioProof } from '../schema.js';
import type { AudioArtifact, AudioProof, SpeechSynthesisProvider, SpeechSynthesisRequest, SpeechSynthesisResult } from '../types.js';

// =============================================================================
// Types
// =============================================================================

export interface HttpSpeechSynthesisProviderOptions {
  baseUrl: string;
  headers?: Record<string, string>;

  /**
   * Endpoint path for synthesis.
   *
   * Expected behavior:
   * - Returns JSON containing:
   *   - `audioBase64` (optional) OR `audioUrl` (optional)
   *   - `artifact` (required): { id, format, sha256, durationMs, ... }
   *   - `proof` (optional): AudioProof (validated if present)
   */
  synthPath?: string;
}

export interface HttpSynthesisResponse {
  audioBase64?: string;
  audioUrl?: string;
  artifact: AudioArtifact;
  proof?: AudioProof;
}

// =============================================================================
// Provider
// =============================================================================

export class HttpSpeechSynthesisProvider implements SpeechSynthesisProvider {
  public readonly providerId = 'http';

  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly synthPath: string;

  constructor(options: HttpSpeechSynthesisProviderOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.headers = options.headers ?? {};
    this.synthPath = options.synthPath ?? '/v1/tts';
  }

  async synthesizeSpeech(
    request: SpeechSynthesisRequest,
    options?: { signal?: AbortSignal }
  ): Promise<SpeechSynthesisResult> {
    const response = await fetch(`${this.baseUrl}${this.synthPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body: JSON.stringify(request),
      signal: options?.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`TTS request failed: HTTP ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`);
    }

    const contentType = response.headers.get('content-type') ?? '';

    // Allow audio responses directly (e.g. audio/wav). Artifact/proof are then unknown.
    if (contentType.startsWith('audio/') || contentType === 'application/octet-stream') {
      throw new Error(
        'TTS endpoint returned raw audio bytes; bb-ui requires a JSON response with artifact metadata for verification-first operation'
      );
    }

    const payload = (await response.json()) as HttpSynthesisResponse;

    if (!payload?.artifact?.id || !payload?.artifact?.sha256 || !payload?.artifact?.durationMs) {
      throw new Error('TTS endpoint response missing required `artifact` fields');
    }

    const audio = await this.resolveAudio(payload);

    let proof: AudioProof | undefined = payload.proof;
    if (proof) {
      const parsed = validateAudioProof(proof);
      if (!parsed.success) {
        throw new Error('Invalid AudioProof from TTS endpoint');
      }
      proof = parsed.data as AudioProof;
    }

    return {
      audio,
      artifact: payload.artifact,
      proof,
    };
  }

  private async resolveAudio(payload: HttpSynthesisResponse): Promise<Blob> {
    if (payload.audioBase64) {
      const bytes =
        typeof atob !== 'undefined'
          ? (() => {
              const byteString = atob(payload.audioBase64 ?? '');
              const arr = new Uint8Array(byteString.length);
              for (let i = 0; i < byteString.length; i++) {
                arr[i] = byteString.charCodeAt(i);
              }
              return arr;
            })()
          : (() => {
              const BufferCtor = (globalThis as unknown as { Buffer?: { from: (s: string, enc: string) => Uint8Array } })
                .Buffer;
              if (!BufferCtor) {
                throw new Error('Base64 decoding is not supported in this environment');
              }
              return Uint8Array.from(BufferCtor.from(payload.audioBase64, 'base64'));
            })();
      return new Blob([bytes], { type: 'audio/wav' });
    }

    if (payload.audioUrl) {
      const res = await fetch(payload.audioUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch audioUrl: HTTP ${res.status}`);
      }
      return await res.blob();
    }

    throw new Error('TTS endpoint response missing `audioBase64` or `audioUrl`');
  }
}


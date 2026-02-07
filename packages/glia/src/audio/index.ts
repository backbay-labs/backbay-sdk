/**
 * Re-exports from @backbay/glia-agent/audio for backward compatibility.
 * The core audio system has been extracted to its own package.
 * New code should import directly from '@backbay/glia-agent/audio'.
 *
 * Hooks that depend on glia internals (useRunSpeechCues, useCognitionSpeech)
 * remain in this package.
 */
export * from "@backbay/glia-agent/audio";

// Hooks that depend on @backbay/glia internals remain here
export { useRunSpeechCues, DEFAULT_RUN_SPEECH_CUES } from './hooks/useRunSpeechCues.js';
export type { UseRunSpeechCuesOptions, RunSpeechCueMap } from './hooks/useRunSpeechCues.js';

export { useCognitionSpeech } from './hooks/useCognitionSpeech.js';
export type {
  UseCognitionSpeechOptions,
  SpeakWithCognitionOptions,
  UseCognitionSpeechReturn,
} from './hooks/useCognitionSpeech.js';

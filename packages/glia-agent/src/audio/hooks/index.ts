export { useAudioPlayer } from './useAudioPlayer.js';
export type { UseAudioPlayerOptions, UseAudioPlayerReturn } from './useAudioPlayer.js';

export { useBargeIn } from './useBargeIn.js';
export type { UseBargeInOptions, UseBargeInReturn } from './useBargeIn.js';

export { useSpeechSynthesis } from './useSpeechSynthesis.js';
export type { UseSpeechSynthesisOptions, UseSpeechSynthesisReturn, SpeakOptions } from './useSpeechSynthesis.js';

export { useAudioOverlay } from './useAudioOverlay.js';
export type { UseAudioOverlayOptions, UseAudioOverlayReturn, OverlaySpeakOptions } from './useAudioOverlay.js';

export { useHybridSpeech } from './useHybridSpeech.js';
export type { UseHybridSpeechOptions, UseHybridSpeechReturn } from './useHybridSpeech.js';

// useRunSpeechCues and useCognitionSpeech remain in @backbay/glia/audio
// because they depend on @backbay/glia/hooks and @backbay/glia/protocol,
// which would create a circular dependency.

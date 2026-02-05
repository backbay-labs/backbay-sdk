export type OverlayToken =
  | 'ack'
  | 'hold'
  | 'done'
  | 'error'
  | 'warning';

export type OverlayPhraseLibrary = Record<OverlayToken, string[]>;

export const DEFAULT_OVERLAY_PHRASES: OverlayPhraseLibrary = {
  ack: ['Got it.', 'Okay.', 'Understood.'],
  hold: ['One moment.', 'Give me a second.', 'Hang on.'],
  done: ['Done.', 'All set.', 'Finished.'],
  error: ['I hit an error.', 'Something went wrong.', 'I ran into a problem.'],
  warning: ['Careful.', 'Heads up.', 'Just a note.'],
};

export function pickOverlayPhrase(args: {
  token: OverlayToken;
  library?: Partial<OverlayPhraseLibrary>;
  index?: number;
}): string {
  const { token, library, index = 0 } = args;

  const phrases = library?.[token] ?? DEFAULT_OVERLAY_PHRASES[token];
  if (!phrases || phrases.length === 0) {
    return DEFAULT_OVERLAY_PHRASES[token][0];
  }

  return phrases[index % phrases.length] ?? phrases[0]!;
}


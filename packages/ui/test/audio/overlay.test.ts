/**
 * Tests for overlay phrase selection.
 */

import { describe, it, expect } from 'vitest';
import { pickOverlayPhrase, DEFAULT_OVERLAY_PHRASES } from '../../src/audio/overlay.js';

describe('pickOverlayPhrase', () => {
  it('cycles deterministically by index', () => {
    const phrases = DEFAULT_OVERLAY_PHRASES.ack;
    expect(pickOverlayPhrase({ token: 'ack', index: 0 })).toBe(phrases[0]);
    expect(pickOverlayPhrase({ token: 'ack', index: 1 })).toBe(phrases[1]);
    expect(pickOverlayPhrase({ token: 'ack', index: 2 })).toBe(phrases[2]);
    expect(pickOverlayPhrase({ token: 'ack', index: 3 })).toBe(phrases[0]);
  });

  it('uses custom library when provided', () => {
    expect(pickOverlayPhrase({ token: 'done', library: { done: ['Nice.'] }, index: 0 })).toBe('Nice.');
  });

  it('falls back to default when custom list is empty', () => {
    const fallback = DEFAULT_OVERLAY_PHRASES.warning[0];
    expect(pickOverlayPhrase({ token: 'warning', library: { warning: [] }, index: 0 })).toBe(fallback);
  });
});


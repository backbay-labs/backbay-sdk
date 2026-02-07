/**
 * Tests for SpeakeasyNotReadyError and auth readiness checks
 */

import { describe, it, expect } from 'vitest';
import { SpeakeasyNotReadyError } from '../SpeakeasyProvider.js';

describe('SpeakeasyNotReadyError', () => {
  it('has correct error name', () => {
    const error = new SpeakeasyNotReadyError('testOperation');
    expect(error.name).toBe('SpeakeasyNotReadyError');
  });

  it('includes operation in message', () => {
    const error = new SpeakeasyNotReadyError('register');
    expect(error.message).toBe('[Speakeasy] register: device secret not yet resolved');
  });

  it('is instanceof Error', () => {
    const error = new SpeakeasyNotReadyError('test');
    expect(error).toBeInstanceOf(Error);
  });

  it('can be caught by type', () => {
    let caughtError: SpeakeasyNotReadyError | null = null;

    try {
      throw new SpeakeasyNotReadyError('submitGesture');
    } catch (e) {
      if (e instanceof SpeakeasyNotReadyError) {
        caughtError = e;
      }
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toContain('submitGesture');
  });
});

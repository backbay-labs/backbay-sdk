import { describe, it, expect } from 'vitest';
import { CognitionSnapshotSchema, validateCognitionSnapshot } from '../schema.js';
import { createInitialCognitionState } from '../types.js';

describe('cognition/schema', () => {
  it('validates a correct snapshot', () => {
    const snapshot = {
      version: '1.0' as const,
      timestamp: Date.now(),
      state: createInitialCognitionState(),
    };
    const result = validateCognitionSnapshot(snapshot);
    expect(result.success).toBe(true);
  });

  it('rejects invalid version', () => {
    const snapshot = {
      version: '2.0',
      timestamp: Date.now(),
      state: createInitialCognitionState(),
    };
    const result = validateCognitionSnapshot(snapshot);
    expect(result.success).toBe(false);
  });

  it('rejects out-of-range signals', () => {
    const state = createInitialCognitionState();
    state.attention = 5; // invalid
    const snapshot = {
      version: '1.0' as const,
      timestamp: Date.now(),
      state,
    };
    const result = validateCognitionSnapshot(snapshot);
    expect(result.success).toBe(false);
  });
});

/**
 * Branded Types Tests
 */

import { describe, it, expect } from 'vitest';
import {
  type AgentId,
  type RunId,
  type WorkspaceId,
  type SessionId,
  type DocumentId,
  toAgentId,
  toRunId,
  toWorkspaceId,
  toSessionId,
  toDocumentId,
  generateRunId,
  generateSessionId,
  generateDocumentId,
  generateWorkspaceId,
  isValidId,
  assertValidId,
} from '../../src/protocol/branded.js';

describe('Branded Types', () => {
  describe('type constructors', () => {
    it('should create branded AgentId', () => {
      const id: AgentId = toAgentId('claude-3-opus');
      expect(id).toBe('claude-3-opus');
    });

    it('should create branded RunId', () => {
      const id: RunId = toRunId('run-123');
      expect(id).toBe('run-123');
    });

    it('should create branded WorkspaceId', () => {
      const id: WorkspaceId = toWorkspaceId('workspace-dashboard');
      expect(id).toBe('workspace-dashboard');
    });

    it('should create branded SessionId', () => {
      const id: SessionId = toSessionId('session-openrct2-abc');
      expect(id).toBe('session-openrct2-abc');
    });

    it('should create branded DocumentId', () => {
      const id: DocumentId = toDocumentId('doc-readme');
      expect(id).toBe('doc-readme');
    });
  });

  describe('ID generators', () => {
    it('should generate unique run IDs', () => {
      const id1 = generateRunId();
      const id2 = generateRunId();

      expect(id1).toMatch(/^run-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^run-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should generate session IDs with adapter prefix', () => {
      const id = generateSessionId('openrct2');

      expect(id).toMatch(/^session-openrct2-\d+-[a-z0-9]+$/);
    });

    it('should generate document IDs from names', () => {
      const id = generateDocumentId('My Project README');

      expect(id).toMatch(/^doc-my-project-readme-[a-z0-9]+$/);
    });

    it('should generate workspace IDs from names', () => {
      const id = generateWorkspaceId('Agent Dashboard');

      expect(id).toBe('workspace-agent-dashboard');
    });

    it('should handle special characters in document names', () => {
      const id = generateDocumentId('file@#$%name!!!');

      expect(id).toMatch(/^doc-file-name-[a-z0-9]+$/);
    });

    it('should handle empty spaces in workspace names', () => {
      const id = generateWorkspaceId('My  Cool   Workspace');

      expect(id).toBe('workspace-my-cool-workspace');
    });
  });

  describe('validation', () => {
    describe('isValidId', () => {
      it('should return true for valid string IDs', () => {
        expect(isValidId('agent-123')).toBe(true);
        expect(isValidId('a')).toBe(true);
        expect(isValidId('123')).toBe(true);
      });

      it('should return false for empty strings', () => {
        expect(isValidId('')).toBe(false);
      });

      it('should return false for non-strings', () => {
        expect(isValidId(null)).toBe(false);
        expect(isValidId(undefined)).toBe(false);
        expect(isValidId(123)).toBe(false);
        expect(isValidId({})).toBe(false);
        expect(isValidId([])).toBe(false);
      });
    });

    describe('assertValidId', () => {
      it('should not throw for valid IDs', () => {
        expect(() => assertValidId('valid-id')).not.toThrow();
      });

      it('should throw for invalid IDs', () => {
        expect(() => assertValidId('')).toThrow('Invalid id');
        expect(() => assertValidId(null)).toThrow('Invalid id');
        expect(() => assertValidId(undefined)).toThrow('Invalid id');
      });

      it('should include custom name in error message', () => {
        expect(() => assertValidId('', 'agentId')).toThrow('Invalid agentId');
      });
    });
  });

  describe('type safety', () => {
    // These tests verify compile-time type safety
    // They will fail to compile if types are wrong

    it('should allow using branded IDs as strings', () => {
      const agentId: AgentId = toAgentId('test');
      const uppercased: string = agentId.toUpperCase();
      expect(uppercased).toBe('TEST');
    });

    it('should allow string methods on branded IDs', () => {
      const runId: RunId = toRunId('run-123-abc');
      expect(runId.startsWith('run-')).toBe(true);
      expect(runId.length).toBe(11);
      expect(runId.split('-')).toEqual(['run', '123', 'abc']);
    });

    // Note: These would be compile-time errors if uncommented:
    // it('should NOT allow assigning RunId to AgentId', () => {
    //   const runId: RunId = toRunId('run-123');
    //   const agentId: AgentId = runId; // Type error!
    // });
    //
    // it('should NOT allow assigning plain string to AgentId', () => {
    //   const agentId: AgentId = 'plain-string'; // Type error!
    // });
  });
});

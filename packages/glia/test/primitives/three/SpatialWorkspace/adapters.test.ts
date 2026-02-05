/**
 * Entity Adapters Tests
 *
 * Tests for SpatialWorkspace adapter functions that map various entity types
 * to CrystallineOrganism props.
 */

import { describe, it, expect } from 'vitest';
import {
  jobAdapter,
  nodeAdapter,
  receiptAdapter,
  disputeAdapter,
  cyntraWorkcellAdapter,
  cyntraRunAdapter,
  cyntraIssueAdapter,
  jobsToOrganisms,
  nodesToOrganisms,
  receiptsToOrganisms,
  disputesToOrganisms,
  workcellsToOrganisms,
  runsToOrganisms,
  issuesToOrganisms,
  type CyntraWorkcellStatus,
  type CyntraRunStatus,
  type CyntraIssueStatus,
} from '../../../../src/primitives/three/SpatialWorkspace/adapters.js';
import type {
  Job,
  Node,
  Receipt,
  Dispute,
  JobStatus,
  NodeType,
  NodeStatus,
  TrustTier,
  ReceiptStatus,
  DisputeStatus,
} from '@backbay/contract';

// -----------------------------------------------------------------------------
// Mock Data Factories
// -----------------------------------------------------------------------------

function createMockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-123',
    type: 'render',
    status: 'queued',
    progress: 0,
    cost_estimate: 10,
    priority: 'normal',
    created_at: '2024-01-01T00:00:00Z',
    steps: [],
    logs: [],
    ...overrides,
  };
}

function createMockNode(overrides: Partial<Node> = {}): Node {
  return {
    id: 'node-456',
    type: 'operator',
    trust_tier: 'bronze',
    status: 'online',
    uptime_percent: 99.5,
    joined_at: '2024-01-01T00:00:00Z',
    runs_completed: 100,
    capabilities: ['render'],
    policies: ['standard'],
    offers: [],
    ...overrides,
  };
}

function createMockReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: 'receipt-789',
    job_id: 'job-123',
    node_id: 'node-456',
    status: 'pending',
    created_at: '2024-01-01T00:00:00Z',
    hashes: { input: 'abc', output: 'def', proof: 'ghi' },
    policies: [],
    gates: [],
    anchors: [],
    ...overrides,
  };
}

function createMockDispute(overrides: Partial<Dispute> = {}): Dispute {
  return {
    id: 'dispute-101',
    receipt_id: 'receipt-789',
    status: 'pending',
    opened_at: new Date().toISOString(),
    reason: 'Test dispute reason',
    ...overrides,
  };
}

function createMockWorkcell(overrides: Partial<CyntraWorkcellStatus> = {}): CyntraWorkcellStatus {
  return {
    id: 'wc-001',
    branch: 'feature/test-branch',
    toolchain: 'claude',
    state: 'idle',
    ...overrides,
  };
}

function createMockRun(overrides: Partial<CyntraRunStatus> = {}): CyntraRunStatus {
  return {
    id: 'run-001',
    issue_id: 'issue-001',
    state: 'queued',
    toolchain: 'codex',
    ...overrides,
  };
}

function createMockIssue(overrides: Partial<CyntraIssueStatus> = {}): CyntraIssueStatus {
  return {
    id: 'issue-001',
    title: 'Test issue title',
    state: 'open',
    labels: ['bug'],
    ...overrides,
  };
}

// -----------------------------------------------------------------------------
// Job Adapter Tests
// -----------------------------------------------------------------------------

describe('jobAdapter', () => {
  describe('getState', () => {
    it('should map queued status to idle state', () => {
      const job = createMockJob({ status: 'queued' });
      expect(jobAdapter.getState(job)).toBe('idle');
    });

    it('should map running status to busy state', () => {
      const job = createMockJob({ status: 'running' });
      expect(jobAdapter.getState(job)).toBe('busy');
    });

    it('should map completed status to success state', () => {
      const job = createMockJob({ status: 'completed' });
      expect(jobAdapter.getState(job)).toBe('success');
    });

    it('should map blocked status to thinking state', () => {
      const job = createMockJob({ status: 'blocked' });
      expect(jobAdapter.getState(job)).toBe('thinking');
    });

    it('should map quarantine status to error state', () => {
      const job = createMockJob({ status: 'quarantine' });
      expect(jobAdapter.getState(job)).toBe('error');
    });

    it('should default to idle for unknown status', () => {
      const job = createMockJob({ status: 'unknown' as JobStatus });
      expect(jobAdapter.getState(job)).toBe('idle');
    });
  });

  describe('getType', () => {
    it('should always return task type', () => {
      const job = createMockJob();
      expect(jobAdapter.getType(job)).toBe('task');
    });

    it('should return task regardless of job type', () => {
      const renderJob = createMockJob({ type: 'render' });
      const verifyJob = createMockJob({ type: 'verify' });
      const anchorJob = createMockJob({ type: 'anchor' });

      expect(jobAdapter.getType(renderJob)).toBe('task');
      expect(jobAdapter.getType(verifyJob)).toBe('task');
      expect(jobAdapter.getType(anchorJob)).toBe('task');
    });
  });

  describe('getPower', () => {
    it('should return elevated power for running jobs', () => {
      const job = createMockJob({ status: 'running' });
      expect(jobAdapter.getPower(job)).toBe('elevated');
    });

    it('should return elevated power for quarantine jobs', () => {
      const job = createMockJob({ status: 'quarantine' });
      expect(jobAdapter.getPower(job)).toBe('elevated');
    });

    it('should return standard power for queued jobs', () => {
      const job = createMockJob({ status: 'queued' });
      expect(jobAdapter.getPower(job)).toBe('standard');
    });

    it('should return standard power for completed jobs', () => {
      const job = createMockJob({ status: 'completed' });
      expect(jobAdapter.getPower(job)).toBe('standard');
    });

    it('should return standard power for blocked jobs', () => {
      const job = createMockJob({ status: 'blocked' });
      expect(jobAdapter.getPower(job)).toBe('standard');
    });
  });

  describe('toOrganism', () => {
    it('should create complete organism props', () => {
      const job = createMockJob({
        id: 'job-xyz-123',
        type: 'render',
        status: 'running',
      });

      const result = jobAdapter.toOrganism(job);

      expect(result.id).toBe('job-xyz-123');
      expect(result.type).toBe('task');
      expect(result.label).toBe('render');
      expect(result.state).toBe('busy');
      expect(result.power).toBe('elevated');
    });

    it('should use job type as label when available', () => {
      const job = createMockJob({ type: 'verify' });
      const result = jobAdapter.toOrganism(job);
      expect(result.label).toBe('verify');
    });

    it('should use truncated id as label when type is falsy', () => {
      const job = createMockJob({ id: 'long-job-id-12345', type: undefined as any });
      const result = jobAdapter.toOrganism(job);
      expect(result.label).toBe('long-job');
    });
  });
});

// -----------------------------------------------------------------------------
// Node Adapter Tests
// -----------------------------------------------------------------------------

describe('nodeAdapter', () => {
  describe('getType', () => {
    it('should map operator node type to kernel', () => {
      const node = createMockNode({ type: 'operator' });
      expect(nodeAdapter.getType(node)).toBe('kernel');
    });

    it('should map fab node type to workcell', () => {
      const node = createMockNode({ type: 'fab' });
      expect(nodeAdapter.getType(node)).toBe('workcell');
    });

    it('should map verifier node type to agent', () => {
      const node = createMockNode({ type: 'verifier' });
      expect(nodeAdapter.getType(node)).toBe('agent');
    });

    it('should map relay node type to relay', () => {
      const node = createMockNode({ type: 'relay' });
      expect(nodeAdapter.getType(node)).toBe('relay');
    });

    it('should default to agent for unknown node type', () => {
      const node = createMockNode({ type: 'unknown' as NodeType });
      expect(nodeAdapter.getType(node)).toBe('agent');
    });
  });

  describe('getState', () => {
    it('should map online status to idle state', () => {
      const node = createMockNode({ status: 'online' });
      expect(nodeAdapter.getState(node)).toBe('idle');
    });

    it('should map degraded status to thinking state', () => {
      const node = createMockNode({ status: 'degraded' });
      expect(nodeAdapter.getState(node)).toBe('thinking');
    });

    it('should map offline status to sleep state', () => {
      const node = createMockNode({ status: 'offline' });
      expect(nodeAdapter.getState(node)).toBe('sleep');
    });

    it('should default to idle for unknown status', () => {
      const node = createMockNode({ status: 'unknown' as NodeStatus });
      expect(nodeAdapter.getState(node)).toBe('idle');
    });
  });

  describe('getPower', () => {
    it('should map bronze trust tier to standard power', () => {
      const node = createMockNode({ trust_tier: 'bronze' });
      expect(nodeAdapter.getPower(node)).toBe('standard');
    });

    it('should map silver trust tier to elevated power', () => {
      const node = createMockNode({ trust_tier: 'silver' });
      expect(nodeAdapter.getPower(node)).toBe('elevated');
    });

    it('should map gold trust tier to intense power', () => {
      const node = createMockNode({ trust_tier: 'gold' });
      expect(nodeAdapter.getPower(node)).toBe('intense');
    });

    it('should default to standard for unknown trust tier', () => {
      const node = createMockNode({ trust_tier: 'unknown' as TrustTier });
      expect(nodeAdapter.getPower(node)).toBe('standard');
    });
  });

  describe('toOrganism', () => {
    it('should create complete organism props', () => {
      const node = createMockNode({
        id: 'node-abc-def-123',
        type: 'fab',
        status: 'degraded',
        trust_tier: 'gold',
      });

      const result = nodeAdapter.toOrganism(node);

      expect(result.id).toBe('node-abc-def-123');
      expect(result.type).toBe('workcell');
      expect(result.label).toBe('node-abc');
      expect(result.state).toBe('thinking');
      expect(result.power).toBe('intense');
    });
  });
});

// -----------------------------------------------------------------------------
// Receipt Adapter Tests
// -----------------------------------------------------------------------------

describe('receiptAdapter', () => {
  describe('getState', () => {
    it('should map pending status to listening state', () => {
      const receipt = createMockReceipt({ status: 'pending' });
      expect(receiptAdapter.getState(receipt)).toBe('listening');
    });

    it('should map passed status to success state', () => {
      const receipt = createMockReceipt({ status: 'passed' });
      expect(receiptAdapter.getState(receipt)).toBe('success');
    });

    it('should map failed status to error state', () => {
      const receipt = createMockReceipt({ status: 'failed' });
      expect(receiptAdapter.getState(receipt)).toBe('error');
    });

    it('should default to idle for unknown status', () => {
      const receipt = createMockReceipt({ status: 'unknown' as ReceiptStatus });
      expect(receiptAdapter.getState(receipt)).toBe('idle');
    });
  });

  describe('getType', () => {
    it('should always return task type', () => {
      const receipt = createMockReceipt();
      expect(receiptAdapter.getType(receipt)).toBe('task');
    });
  });

  describe('getPower', () => {
    it('should always return minimal power', () => {
      const pendingReceipt = createMockReceipt({ status: 'pending' });
      const passedReceipt = createMockReceipt({ status: 'passed' });
      const failedReceipt = createMockReceipt({ status: 'failed' });

      expect(receiptAdapter.getPower(pendingReceipt)).toBe('minimal');
      expect(receiptAdapter.getPower(passedReceipt)).toBe('minimal');
      expect(receiptAdapter.getPower(failedReceipt)).toBe('minimal');
    });
  });

  describe('toOrganism', () => {
    it('should create complete organism props with truncated label', () => {
      const receipt = createMockReceipt({
        id: 'receipt-xyz-123',
        status: 'passed',
      });

      const result = receiptAdapter.toOrganism(receipt);

      expect(result.id).toBe('receipt-xyz-123');
      expect(result.type).toBe('task');
      expect(result.label).toBe('receip');
      expect(result.state).toBe('success');
      expect(result.power).toBe('minimal');
    });
  });
});

// -----------------------------------------------------------------------------
// Dispute Adapter Tests
// -----------------------------------------------------------------------------

describe('disputeAdapter', () => {
  describe('getState', () => {
    it('should map pending status to error state', () => {
      const dispute = createMockDispute({ status: 'pending' });
      expect(disputeAdapter.getState(dispute)).toBe('error');
    });

    it('should map resolved status to success state', () => {
      const dispute = createMockDispute({ status: 'resolved' });
      expect(disputeAdapter.getState(dispute)).toBe('success');
    });

    it('should map rejected status to idle state', () => {
      const dispute = createMockDispute({ status: 'rejected' });
      expect(disputeAdapter.getState(dispute)).toBe('idle');
    });

    it('should default to error for unknown status', () => {
      const dispute = createMockDispute({ status: 'unknown' as DisputeStatus });
      expect(disputeAdapter.getState(dispute)).toBe('error');
    });
  });

  describe('getType', () => {
    it('should always return task type', () => {
      const dispute = createMockDispute();
      expect(disputeAdapter.getType(dispute)).toBe('task');
    });
  });

  describe('getPower (age-based)', () => {
    /**
     * Helper to create a dispute with opened_at set to hoursAgo before NOW
     */
    function createDisputeWithAge(hoursAgo: number): Dispute {
      const now = Date.now();
      const openedAt = new Date(now - hoursAgo * 60 * 60 * 1000);
      return createMockDispute({
        opened_at: openedAt.toISOString(),
      });
    }

    it('should return standard power for disputes less than 24 hours old', () => {
      // Dispute opened 12 hours ago
      const dispute = createDisputeWithAge(12);
      expect(disputeAdapter.getPower(dispute)).toBe('standard');
    });

    it('should return elevated power for disputes between 24 and 72 hours old', () => {
      // Dispute opened 48 hours ago
      const dispute = createDisputeWithAge(48);
      expect(disputeAdapter.getPower(dispute)).toBe('elevated');
    });

    it('should return intense power for disputes over 72 hours old', () => {
      // Dispute opened 100 hours ago
      const dispute = createDisputeWithAge(100);
      expect(disputeAdapter.getPower(dispute)).toBe('intense');
    });

    it('should return elevated power for disputes exactly at 24 hour boundary', () => {
      // Dispute opened exactly 24 hours ago
      const dispute = createDisputeWithAge(24);
      expect(disputeAdapter.getPower(dispute)).toBe('elevated');
    });

    it('should return intense power for disputes exactly at 72 hour boundary', () => {
      // Dispute opened exactly 72 hours ago
      const dispute = createDisputeWithAge(72);
      expect(disputeAdapter.getPower(dispute)).toBe('intense');
    });
  });

  describe('toOrganism', () => {
    it('should create complete organism props with dispute prefix in label', () => {
      // Dispute opened 12 hours ago (standard power)
      const now = Date.now();
      const openedAt = new Date(now - 12 * 60 * 60 * 1000);
      const dispute = createMockDispute({
        id: 'dispute-abc-123',
        status: 'pending',
        opened_at: openedAt.toISOString(),
      });

      const result = disputeAdapter.toOrganism(dispute);

      expect(result.id).toBe('dispute-abc-123');
      expect(result.type).toBe('task');
      expect(result.label).toBe('Dispute disput');
      expect(result.state).toBe('error');
      expect(result.power).toBe('standard');
    });
  });
});

// -----------------------------------------------------------------------------
// Cyntra Workcell Adapter Tests
// -----------------------------------------------------------------------------

describe('cyntraWorkcellAdapter', () => {
  describe('getState', () => {
    it('should map idle state to idle', () => {
      const wc = createMockWorkcell({ state: 'idle' });
      expect(cyntraWorkcellAdapter.getState(wc)).toBe('idle');
    });

    it('should map running state to busy', () => {
      const wc = createMockWorkcell({ state: 'running' });
      expect(cyntraWorkcellAdapter.getState(wc)).toBe('busy');
    });

    it('should map blocked state to error', () => {
      const wc = createMockWorkcell({ state: 'blocked' });
      expect(cyntraWorkcellAdapter.getState(wc)).toBe('error');
    });

    it('should default to idle for unknown state', () => {
      const wc = createMockWorkcell({ state: 'unknown' as any });
      expect(cyntraWorkcellAdapter.getState(wc)).toBe('idle');
    });
  });

  describe('getType', () => {
    it('should always return workcell type', () => {
      const wc = createMockWorkcell();
      expect(cyntraWorkcellAdapter.getType(wc)).toBe('workcell');
    });
  });

  describe('getPower', () => {
    it('should return elevated power when current_run exists', () => {
      const wc = createMockWorkcell({ current_run: 'run-123' });
      expect(cyntraWorkcellAdapter.getPower(wc)).toBe('elevated');
    });

    it('should return standard power when current_run is undefined', () => {
      const wc = createMockWorkcell({ current_run: undefined });
      expect(cyntraWorkcellAdapter.getPower(wc)).toBe('standard');
    });
  });

  describe('toOrganism', () => {
    it('should create organism props with branch name as label', () => {
      const wc = createMockWorkcell({
        id: 'wc-001',
        branch: 'feature/my-awesome-feature',
        state: 'running',
        current_run: 'run-123',
      });

      const result = cyntraWorkcellAdapter.toOrganism(wc);

      expect(result.id).toBe('wc-001');
      expect(result.type).toBe('workcell');
      expect(result.label).toBe('my-awesome-feature');
      expect(result.state).toBe('busy');
      expect(result.power).toBe('elevated');
    });

    it('should extract last segment from branch path', () => {
      const wc = createMockWorkcell({
        branch: 'refs/heads/main',
      });

      const result = cyntraWorkcellAdapter.toOrganism(wc);
      expect(result.label).toBe('main');
    });

    it('should fallback to truncated id when branch has no slash', () => {
      const wc = createMockWorkcell({
        id: 'workcell-abc-123',
        branch: '',
      });

      const result = cyntraWorkcellAdapter.toOrganism(wc);
      expect(result.label).toBe('workcell');
    });
  });
});

// -----------------------------------------------------------------------------
// Cyntra Run Adapter Tests
// -----------------------------------------------------------------------------

describe('cyntraRunAdapter', () => {
  describe('getState', () => {
    it('should map queued state to idle', () => {
      const run = createMockRun({ state: 'queued' });
      expect(cyntraRunAdapter.getState(run)).toBe('idle');
    });

    it('should map running state to busy', () => {
      const run = createMockRun({ state: 'running' });
      expect(cyntraRunAdapter.getState(run)).toBe('busy');
    });

    it('should map verifying state to thinking', () => {
      const run = createMockRun({ state: 'verifying' });
      expect(cyntraRunAdapter.getState(run)).toBe('thinking');
    });

    it('should map completed state to success', () => {
      const run = createMockRun({ state: 'completed' });
      expect(cyntraRunAdapter.getState(run)).toBe('success');
    });

    it('should map failed state to error', () => {
      const run = createMockRun({ state: 'failed' });
      expect(cyntraRunAdapter.getState(run)).toBe('error');
    });

    it('should default to idle for unknown state', () => {
      const run = createMockRun({ state: 'unknown' as any });
      expect(cyntraRunAdapter.getState(run)).toBe('idle');
    });
  });

  describe('getType', () => {
    it('should always return agent type', () => {
      const run = createMockRun();
      expect(cyntraRunAdapter.getType(run)).toBe('agent');
    });
  });

  describe('getPower', () => {
    it('should return elevated power when running', () => {
      const run = createMockRun({ state: 'running' });
      expect(cyntraRunAdapter.getPower(run)).toBe('elevated');
    });

    it('should return standard power for all other states', () => {
      const states: CyntraRunStatus['state'][] = ['queued', 'verifying', 'completed', 'failed'];

      for (const state of states) {
        const run = createMockRun({ state });
        expect(cyntraRunAdapter.getPower(run)).toBe('standard');
      }
    });
  });

  describe('toOrganism', () => {
    it('should create organism props with truncated issue_id as label', () => {
      const run = createMockRun({
        id: 'run-xyz-123',
        issue_id: 'issue-abc-def-456',
        state: 'verifying',
      });

      const result = cyntraRunAdapter.toOrganism(run);

      expect(result.id).toBe('run-xyz-123');
      expect(result.type).toBe('agent');
      expect(result.label).toBe('issue-ab');
      expect(result.state).toBe('thinking');
      expect(result.power).toBe('standard');
    });
  });
});

// -----------------------------------------------------------------------------
// Cyntra Issue Adapter Tests
// -----------------------------------------------------------------------------

describe('cyntraIssueAdapter', () => {
  describe('getState', () => {
    it('should map open state to idle', () => {
      const issue = createMockIssue({ state: 'open' });
      expect(cyntraIssueAdapter.getState(issue)).toBe('idle');
    });

    it('should map in_progress state to busy', () => {
      const issue = createMockIssue({ state: 'in_progress' });
      expect(cyntraIssueAdapter.getState(issue)).toBe('busy');
    });

    it('should map resolved state to success', () => {
      const issue = createMockIssue({ state: 'resolved' });
      expect(cyntraIssueAdapter.getState(issue)).toBe('success');
    });

    it('should map wontfix state to sleep', () => {
      const issue = createMockIssue({ state: 'wontfix' });
      expect(cyntraIssueAdapter.getState(issue)).toBe('sleep');
    });

    it('should default to idle for unknown state', () => {
      const issue = createMockIssue({ state: 'unknown' as any });
      expect(cyntraIssueAdapter.getState(issue)).toBe('idle');
    });
  });

  describe('getType', () => {
    it('should always return task type', () => {
      const issue = createMockIssue();
      expect(cyntraIssueAdapter.getType(issue)).toBe('task');
    });
  });

  describe('getPower', () => {
    it('should return elevated power when in_progress', () => {
      const issue = createMockIssue({ state: 'in_progress' });
      expect(cyntraIssueAdapter.getPower(issue)).toBe('elevated');
    });

    it('should return standard power for all other states', () => {
      const states: CyntraIssueStatus['state'][] = ['open', 'resolved', 'wontfix'];

      for (const state of states) {
        const issue = createMockIssue({ state });
        expect(cyntraIssueAdapter.getPower(issue)).toBe('standard');
      }
    });
  });

  describe('toOrganism', () => {
    it('should create organism props with truncated title as label', () => {
      const issue = createMockIssue({
        id: 'issue-001',
        title: 'This is a very long issue title that should be truncated',
        state: 'in_progress',
      });

      const result = cyntraIssueAdapter.toOrganism(issue);

      expect(result.id).toBe('issue-001');
      expect(result.type).toBe('task');
      expect(result.label).toBe('This is a very long ');
      expect(result.state).toBe('busy');
      expect(result.power).toBe('elevated');
    });

    it('should handle short titles without truncation', () => {
      const issue = createMockIssue({
        title: 'Fix bug',
      });

      const result = cyntraIssueAdapter.toOrganism(issue);
      expect(result.label).toBe('Fix bug');
    });
  });
});

// -----------------------------------------------------------------------------
// Batch Converter Tests
// -----------------------------------------------------------------------------

describe('Batch Converters', () => {
  describe('jobsToOrganisms', () => {
    it('should convert an array of jobs to organisms', () => {
      const jobs = [
        createMockJob({ id: 'job-1', status: 'queued' }),
        createMockJob({ id: 'job-2', status: 'running' }),
        createMockJob({ id: 'job-3', status: 'completed' }),
      ];

      const result = jobsToOrganisms(jobs);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('job-1');
      expect(result[1].id).toBe('job-2');
      expect(result[2].id).toBe('job-3');
    });

    it('should handle empty arrays', () => {
      const result = jobsToOrganisms([]);
      expect(result).toEqual([]);
    });

    it('should preserve order', () => {
      const jobs = [
        createMockJob({ id: 'z-job' }),
        createMockJob({ id: 'a-job' }),
        createMockJob({ id: 'm-job' }),
      ];

      const result = jobsToOrganisms(jobs);

      expect(result[0].id).toBe('z-job');
      expect(result[1].id).toBe('a-job');
      expect(result[2].id).toBe('m-job');
    });
  });

  describe('nodesToOrganisms', () => {
    it('should convert an array of nodes to organisms', () => {
      const nodes = [
        createMockNode({ id: 'node-1', type: 'operator' }),
        createMockNode({ id: 'node-2', type: 'fab' }),
      ];

      const result = nodesToOrganisms(nodes);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('kernel');
      expect(result[1].type).toBe('workcell');
    });

    it('should handle empty arrays', () => {
      const result = nodesToOrganisms([]);
      expect(result).toEqual([]);
    });

    it('should preserve order', () => {
      const nodes = [
        createMockNode({ id: 'node-c' }),
        createMockNode({ id: 'node-a' }),
        createMockNode({ id: 'node-b' }),
      ];

      const result = nodesToOrganisms(nodes);

      expect(result[0].id).toBe('node-c');
      expect(result[1].id).toBe('node-a');
      expect(result[2].id).toBe('node-b');
    });
  });

  describe('receiptsToOrganisms', () => {
    it('should convert an array of receipts to organisms', () => {
      const receipts = [
        createMockReceipt({ id: 'receipt-1', status: 'pending' }),
        createMockReceipt({ id: 'receipt-2', status: 'passed' }),
      ];

      const result = receiptsToOrganisms(receipts);

      expect(result).toHaveLength(2);
      expect(result[0].state).toBe('listening');
      expect(result[1].state).toBe('success');
    });

    it('should handle empty arrays', () => {
      const result = receiptsToOrganisms([]);
      expect(result).toEqual([]);
    });

    it('should preserve order', () => {
      const receipts = [
        createMockReceipt({ id: 'receipt-z' }),
        createMockReceipt({ id: 'receipt-a' }),
      ];

      const result = receiptsToOrganisms(receipts);

      expect(result[0].id).toBe('receipt-z');
      expect(result[1].id).toBe('receipt-a');
    });
  });

  describe('disputesToOrganisms', () => {
    it('should convert an array of disputes to organisms', () => {
      const disputes = [
        createMockDispute({ id: 'dispute-1', status: 'pending' }),
        createMockDispute({ id: 'dispute-2', status: 'resolved' }),
      ];

      const result = disputesToOrganisms(disputes);

      expect(result).toHaveLength(2);
      expect(result[0].state).toBe('error');
      expect(result[1].state).toBe('success');
    });

    it('should handle empty arrays', () => {
      const result = disputesToOrganisms([]);
      expect(result).toEqual([]);
    });

    it('should preserve order', () => {
      const disputes = [
        createMockDispute({ id: 'dispute-z' }),
        createMockDispute({ id: 'dispute-a' }),
      ];

      const result = disputesToOrganisms(disputes);

      expect(result[0].id).toBe('dispute-z');
      expect(result[1].id).toBe('dispute-a');
    });
  });

  describe('workcellsToOrganisms', () => {
    it('should convert an array of workcells to organisms', () => {
      const workcells = [
        createMockWorkcell({ id: 'wc-1', state: 'idle' }),
        createMockWorkcell({ id: 'wc-2', state: 'running' }),
      ];

      const result = workcellsToOrganisms(workcells);

      expect(result).toHaveLength(2);
      expect(result[0].state).toBe('idle');
      expect(result[1].state).toBe('busy');
    });

    it('should handle empty arrays', () => {
      const result = workcellsToOrganisms([]);
      expect(result).toEqual([]);
    });

    it('should preserve order', () => {
      const workcells = [
        createMockWorkcell({ id: 'wc-c' }),
        createMockWorkcell({ id: 'wc-a' }),
      ];

      const result = workcellsToOrganisms(workcells);

      expect(result[0].id).toBe('wc-c');
      expect(result[1].id).toBe('wc-a');
    });
  });

  describe('runsToOrganisms', () => {
    it('should convert an array of runs to organisms', () => {
      const runs = [
        createMockRun({ id: 'run-1', state: 'queued' }),
        createMockRun({ id: 'run-2', state: 'running' }),
        createMockRun({ id: 'run-3', state: 'completed' }),
      ];

      const result = runsToOrganisms(runs);

      expect(result).toHaveLength(3);
      expect(result[0].state).toBe('idle');
      expect(result[1].state).toBe('busy');
      expect(result[2].state).toBe('success');
    });

    it('should handle empty arrays', () => {
      const result = runsToOrganisms([]);
      expect(result).toEqual([]);
    });

    it('should preserve order', () => {
      const runs = [
        createMockRun({ id: 'run-z' }),
        createMockRun({ id: 'run-a' }),
      ];

      const result = runsToOrganisms(runs);

      expect(result[0].id).toBe('run-z');
      expect(result[1].id).toBe('run-a');
    });
  });

  describe('issuesToOrganisms', () => {
    it('should convert an array of issues to organisms', () => {
      const issues = [
        createMockIssue({ id: 'issue-1', state: 'open' }),
        createMockIssue({ id: 'issue-2', state: 'in_progress' }),
        createMockIssue({ id: 'issue-3', state: 'resolved' }),
      ];

      const result = issuesToOrganisms(issues);

      expect(result).toHaveLength(3);
      expect(result[0].state).toBe('idle');
      expect(result[1].state).toBe('busy');
      expect(result[2].state).toBe('success');
    });

    it('should handle empty arrays', () => {
      const result = issuesToOrganisms([]);
      expect(result).toEqual([]);
    });

    it('should preserve order', () => {
      const issues = [
        createMockIssue({ id: 'issue-z' }),
        createMockIssue({ id: 'issue-a' }),
      ];

      const result = issuesToOrganisms(issues);

      expect(result[0].id).toBe('issue-z');
      expect(result[1].id).toBe('issue-a');
    });
  });
});

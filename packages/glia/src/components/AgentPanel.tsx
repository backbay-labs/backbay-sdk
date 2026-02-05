/**
 * AgentPanel - Pre-built panel for selecting and invoking agents
 *
 * Provides quick prompts, agent selection, run history, and cost tracking.
 */

import { useState, useCallback, type ReactElement, type FormEvent } from 'react';
import { useBBContext } from './BBProvider.js';
import { useAgentRun } from '../hooks/useAgentRun.js';
import type { AgentRun, Agent } from '../protocol/types.js';

// =============================================================================
// Types
// =============================================================================

export interface QuickPrompt {
  /** Display label */
  label: string;

  /** Prompt text to send */
  prompt: string;

  /** Optional icon (component or string) */
  icon?: ReactElement | string;
}

export interface AgentPanelProps {
  /** Context data to include with every run */
  context?: Record<string, unknown>;

  /** Quick prompt buttons */
  quickPrompts?: QuickPrompt[];

  /** Called when a run starts */
  onRunStart?: (run: AgentRun) => void;

  /** Called when a run completes */
  onRunComplete?: (run: AgentRun) => void;

  /** Called when a run fails */
  onRunError?: (run: AgentRun, error: Error) => void;

  /** Show cost estimates and tracking */
  showCosts?: boolean;

  /** Show run history */
  showHistory?: boolean;

  /** Maximum history items to show */
  maxHistory?: number;

  /** Placeholder text for prompt input */
  placeholder?: string;

  /** Custom class name for the panel */
  className?: string;

  /** Custom agent filter (return true to include) */
  agentFilter?: (agent: Agent) => boolean;

  /** Default selected agent ID */
  defaultAgent?: string;
}

export interface AgentPanelRenderProps {
  /** All available agents */
  agents: Agent[];

  /** Currently selected agent */
  selectedAgent: Agent | null;

  /** Select an agent */
  selectAgent: (agentId: string) => void;

  /** Current prompt text */
  prompt: string;

  /** Update prompt text */
  setPrompt: (text: string) => void;

  /** Submit the current prompt */
  submit: () => void;

  /** Whether a run is in progress */
  isRunning: boolean;

  /** Current run (if any) */
  currentRun: AgentRun | null;

  /** Run history */
  history: AgentRun[];

  /** Total cost of all runs */
  totalCost: number;

  /** Estimated cost of current prompt */
  estimatedCost: number | null;

  /** Quick prompts */
  quickPrompts: QuickPrompt[];

  /** Execute a quick prompt */
  executeQuickPrompt: (quickPrompt: QuickPrompt) => void;
}

// =============================================================================
// Component
// =============================================================================

export function AgentPanel({
  context,
  quickPrompts = [],
  onRunStart,
  onRunComplete,
  onRunError,
  showCosts = true,
  showHistory = true,
  maxHistory = 10,
  placeholder = 'Enter a prompt...',
  className,
  agentFilter,
  defaultAgent,
}: AgentPanelProps): ReactElement {
  const { agents, runHistory, totalCost: globalTotalCost } = useBBContext();

  // Filter agents
  const availableAgents = agentFilter ? agents.filter(agentFilter) : agents;

  // State
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    defaultAgent ?? availableAgents[0]?.id ?? null
  );
  const [prompt, setPrompt] = useState('');

  // Get selected agent
  const selectedAgent = availableAgents.find((a) => a.id === selectedAgentId) ?? null;

  // Use agent run hook
  const {
    run: currentRun,
    status,
    isRunning,
    start,
  } = useAgentRun({
    onStart: onRunStart,
    onComplete: onRunComplete,
    onError: onRunError,
  });

  // Filter history for this panel's agents
  const panelHistory = runHistory
    .filter((run) => availableAgents.some((a) => a.id === run.agentId))
    .slice(0, maxHistory);

  // Calculate total cost for this panel's agents
  const panelTotalCost = panelHistory.reduce((sum, run) => sum + (run.cost ?? 0), 0);

  // Estimated cost for current prompt
  const estimatedCost = selectedAgent?.costPerRun ?? null;

  // Submit handler
  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      if (!selectedAgentId || !prompt.trim() || isRunning) return;
      start(selectedAgentId, prompt, context);
      setPrompt('');
    },
    [selectedAgentId, prompt, isRunning, start, context]
  );

  // Quick prompt handler
  const executeQuickPrompt = useCallback(
    (qp: QuickPrompt) => {
      if (!selectedAgentId || isRunning) return;
      start(selectedAgentId, qp.prompt, context);
    },
    [selectedAgentId, isRunning, start, context]
  );

  // Select agent handler
  const selectAgent = useCallback((agentId: string) => {
    setSelectedAgentId(agentId);
  }, []);

  return (
    <div className={`bb-agent-panel ${className ?? ''}`} data-bb-state={status}>
      {/* Agent Selector */}
      <div className="bb-agent-panel__agents">
        {availableAgents.map((agent) => (
          <button
            key={agent.id}
            type="button"
            className={`bb-agent-panel__agent ${
              agent.id === selectedAgentId ? 'bb-agent-panel__agent--selected' : ''
            }`}
            onClick={() => selectAgent(agent.id)}
            disabled={isRunning}
            data-bb-agent-id={agent.id}
          >
            <span className="bb-agent-panel__agent-name">{agent.name}</span>
            {showCosts && agent.costPerRun !== undefined && (
              <span className="bb-agent-panel__agent-cost">
                ${agent.costPerRun.toFixed(3)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Quick Prompts */}
      {quickPrompts.length > 0 && (
        <div className="bb-agent-panel__quick-prompts">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              className="bb-agent-panel__quick-prompt"
              onClick={() => executeQuickPrompt(qp)}
              disabled={isRunning || !selectedAgentId}
            >
              {qp.icon && <span className="bb-agent-panel__quick-prompt-icon">{qp.icon}</span>}
              <span className="bb-agent-panel__quick-prompt-label">{qp.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Prompt Input */}
      <form className="bb-agent-panel__form" onSubmit={handleSubmit}>
        <textarea
          className="bb-agent-panel__input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          disabled={isRunning || !selectedAgentId}
          rows={3}
          data-bb-input="agent-prompt"
        />
        <div className="bb-agent-panel__form-footer">
          {showCosts && estimatedCost !== null && (
            <span className="bb-agent-panel__estimate">
              Est. ${estimatedCost.toFixed(3)}
            </span>
          )}
          <button
            type="submit"
            className="bb-agent-panel__submit"
            disabled={isRunning || !selectedAgentId || !prompt.trim()}
            data-bb-action="submit-prompt"
          >
            {isRunning ? 'Running...' : 'Run'}
          </button>
        </div>
      </form>

      {/* Current Run Status */}
      {currentRun && (
        <div
          className={`bb-agent-panel__status bb-agent-panel__status--${currentRun.status}`}
          data-bb-state={currentRun.status}
        >
          <span className="bb-agent-panel__status-label">
            {currentRun.status === 'running' && 'Running...'}
            {currentRun.status === 'completed' && 'Completed'}
            {currentRun.status === 'failed' && 'Failed'}
            {currentRun.status === 'cancelled' && 'Cancelled'}
          </span>
          {currentRun.status === 'completed' && currentRun.output && (
            <div className="bb-agent-panel__output" data-bb-output="agent-output">
              {currentRun.output}
            </div>
          )}
          {currentRun.status === 'failed' && currentRun.error && (
            <div className="bb-agent-panel__error">{currentRun.error}</div>
          )}
        </div>
      )}

      {/* Run History */}
      {showHistory && panelHistory.length > 0 && (
        <div className="bb-agent-panel__history">
          <h4 className="bb-agent-panel__history-title">Recent Runs</h4>
          <ul className="bb-agent-panel__history-list">
            {panelHistory.map((run) => (
              <li
                key={run.id}
                className={`bb-agent-panel__history-item bb-agent-panel__history-item--${run.status}`}
                data-bb-entity="run"
                data-bb-entity-id={run.id}
              >
                <span className="bb-agent-panel__history-agent" data-bb-field="agent">
                  {availableAgents.find((a) => a.id === run.agentId)?.name ?? run.agentId}
                </span>
                <span className="bb-agent-panel__history-prompt" data-bb-field="prompt">
                  {run.prompt.slice(0, 50)}
                  {run.prompt.length > 50 && '...'}
                </span>
                {showCosts && run.cost !== undefined && (
                  <span className="bb-agent-panel__history-cost" data-bb-field="cost">
                    ${run.cost.toFixed(3)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cost Summary */}
      {showCosts && (
        <div className="bb-agent-panel__cost-summary">
          <span className="bb-agent-panel__cost-label">Session Total:</span>
          <span className="bb-agent-panel__cost-value" data-bb-field="total-cost">
            ${panelTotalCost.toFixed(3)}
          </span>
        </div>
      )}
    </div>
  );
}

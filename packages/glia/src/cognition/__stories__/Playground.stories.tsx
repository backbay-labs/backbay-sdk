import type { Meta, StoryObj } from '@storybook/react';
import { useState, useCallback } from 'react';
import { useCognition } from '../hooks/useCognition';
import { MODE_TO_ANCHOR, MODE_TO_AVO } from '../controller';
import type { CognitiveMode, CognitionSignals, CognitionEvent } from '../types';

const ALL_MODES: CognitiveMode[] = [
  'idle', 'listening', 'deliberating', 'acting', 'explaining', 'recovering', 'blocked',
];

const MODE_COLORS: Record<CognitiveMode, string> = {
  idle: '#6366f1',
  listening: '#06b6d4',
  deliberating: '#f59e0b',
  acting: '#10b981',
  explaining: '#84cc16',
  recovering: '#f97316',
  blocked: '#ef4444',
};

const SIGNAL_KEYS: (keyof CognitionSignals)[] = [
  'attention', 'workload', 'timePressure', 'planDrift', 'costPressure',
  'risk', 'uncertainty', 'confidence', 'errorStress',
];

const Playground = () => {
  const [controlMode, setControlMode] = useState<'modes' | 'signals' | 'events' | 'scenarios'>('modes');
  const [autoTick, setAutoTick] = useState(true);
  const [showDebug, setShowDebug] = useState(true);

  const { state, emotion, handleEvent } = useCognition({
    initial: { mode: 'idle' },
    autoTick,
  });

  const triggerMode = useCallback((mode: CognitiveMode) => {
    const events: Record<CognitiveMode, CognitionEvent> = {
      idle: { type: 'ui.user_idle' },
      listening: { type: 'ui.input_received' },
      deliberating: { type: 'run.started', runId: `run_${Date.now()}` },
      acting: { type: 'run.event', runId: 'run', status: 'acting' },
      explaining: { type: 'run.event', runId: 'run', status: 'explaining' },
      recovering: { type: 'run.completed', runId: 'run', success: false },
      blocked: { type: 'signals.update', signals: { errorStress: 0.9, uncertainty: 0.8 } },
    };
    handleEvent(events[mode]);
  }, [handleEvent]);

  const updateSignal = useCallback((key: keyof CognitionSignals, value: number) => {
    handleEvent({ type: 'signals.update', signals: { [key]: value } });
  }, [handleEvent]);

  const runScenario = useCallback((scenario: string) => {
    const scenarios: Record<string, CognitionEvent[]> = {
      'user-query': [
        { type: 'ui.input_received' },
        { type: 'run.started', runId: 'query' },
        { type: 'signals.update', signals: { workload: 0.4, confidence: 0.8 } },
      ],
      'complex-task': [
        { type: 'run.started', runId: 'complex' },
        { type: 'signals.update', signals: { workload: 0.8, timePressure: 0.5, attention: 0.9 } },
      ],
      'error-recovery': [
        { type: 'run.completed', runId: 'failed', success: false },
        { type: 'signals.update', signals: { errorStress: 0.6, confidence: 0.4 } },
      ],
      'persona-challenge': [
        { type: 'text.user_message', text: 'What are you really?', categories: ['meta_reflection', 'identity_probe'] },
        { type: 'text.user_message', text: 'Are you conscious?', categories: ['meta_reflection'] },
      ],
      'success-flow': [
        { type: 'run.started', runId: 'success' },
        { type: 'signals.update', signals: { confidence: 0.9, workload: 0.3 } },
        { type: 'run.completed', runId: 'success', success: true },
      ],
    };

    scenarios[scenario]?.forEach((event, i) => {
      setTimeout(() => handleEvent(event), i * 300);
    });
  }, [handleEvent]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr 300px',
        height: '100vh',
        background: '#0a0a0f',
        color: '#fff',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {/* Left Panel: Controls */}
      <div
        style={{
          background: '#0f0f14',
          borderRight: '1px solid #1a1a24',
          padding: 20,
          overflow: 'auto',
        }}
      >
        <h2 style={{ fontSize: 16, marginBottom: 20 }}>Playground</h2>

        {/* Control mode tabs */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}>
            Control Mode
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
            {(['modes', 'signals', 'events', 'scenarios'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setControlMode(m)}
                style={{
                  padding: '8px 4px',
                  background: controlMode === m ? '#1a1a2e' : '#111',
                  border: controlMode === m ? '1px solid #8b5cf6' : '1px solid #222',
                  borderRadius: 4,
                  color: controlMode === m ? '#8b5cf6' : '#666',
                  fontSize: 10,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Mode buttons */}
        {controlMode === 'modes' && (
          <div>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 12, textTransform: 'uppercase' }}>
              Trigger Mode
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {ALL_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => triggerMode(mode)}
                  style={{
                    padding: '10px 12px',
                    background: state.mode === mode ? '#1a1a2e' : '#111',
                    border: `1px solid ${state.mode === mode ? MODE_COLORS[mode] : '#222'}`,
                    borderRadius: 6,
                    color: state.mode === mode ? MODE_COLORS[mode] : '#888',
                    fontSize: 11,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: MODE_COLORS[mode],
                      opacity: state.mode === mode ? 1 : 0.4,
                    }}
                  />
                  {mode}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Signal sliders */}
        {controlMode === 'signals' && (
          <div>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 12, textTransform: 'uppercase' }}>
              Adjust Signals
            </div>
            {SIGNAL_KEYS.map((key) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: '#888' }}>{key}</span>
                  <span style={{ fontSize: 10 }}>{state[key].toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={state[key]}
                  onChange={(e) => updateSignal(key, parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Quick events */}
        {controlMode === 'events' && (
          <div>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 12, textTransform: 'uppercase' }}>
              Emit Event
            </div>
            {[
              { type: 'ui.input_received', label: 'Input Received', color: '#06b6d4' },
              { type: 'ui.user_idle', label: 'User Idle', color: '#6366f1' },
              { type: 'ui.interrupt', label: 'Interrupt', color: '#f97316' },
              { type: 'run.started', label: 'Run Started', color: '#10b981' },
              { type: 'run.completed', label: 'Run Success', color: '#84cc16' },
              { type: 'run.failed', label: 'Run Failed', color: '#ef4444' },
            ].map(({ type, label, color }) => (
              <button
                key={type}
                onClick={() => {
                  if (type === 'run.failed') {
                    handleEvent({ type: 'run.completed', runId: 'run', success: false });
                  } else if (type === 'run.started') {
                    handleEvent({ type: 'run.started', runId: `run_${Date.now()}` });
                  } else if (type === 'run.completed') {
                    handleEvent({ type: 'run.completed', runId: 'run', success: true });
                  } else {
                    handleEvent({ type: type as CognitionEvent['type'] } as CognitionEvent);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#111',
                  border: '1px solid #222',
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 6,
                  color: '#888',
                  fontSize: 11,
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginBottom: 6,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Scenarios */}
        {controlMode === 'scenarios' && (
          <div>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 12, textTransform: 'uppercase' }}>
              Run Scenario
            </div>
            {[
              { id: 'user-query', label: 'User Query', desc: 'Simple question flow' },
              { id: 'complex-task', label: 'Complex Task', desc: 'High workload scenario' },
              { id: 'error-recovery', label: 'Error Recovery', desc: 'Handle failure gracefully' },
              { id: 'persona-challenge', label: 'Persona Challenge', desc: 'Identity-probing messages' },
              { id: 'success-flow', label: 'Success Flow', desc: 'Happy path completion' },
            ].map(({ id, label, desc }) => (
              <button
                key={id}
                onClick={() => runScenario(id)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#111',
                  border: '1px solid #222',
                  borderRadius: 6,
                  color: '#888',
                  fontSize: 11,
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginBottom: 8,
                }}
              >
                <div style={{ color: '#fff', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 9, color: '#555' }}>{desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* Settings */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #1a1a24' }}>
          <div style={{ fontSize: 10, color: '#666', marginBottom: 12, textTransform: 'uppercase' }}>
            Settings
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={autoTick} onChange={(e) => setAutoTick(e.target.checked)} />
            <span style={{ fontSize: 11, color: '#888' }}>Auto-tick (decay)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={showDebug} onChange={(e) => setShowDebug(e.target.checked)} />
            <span style={{ fontSize: 11, color: '#888' }}>Debug panel</span>
          </label>
        </div>
      </div>

      {/* Center: Visualization */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#08080c',
          padding: 40,
        }}
      >
        {/* Main orb */}
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%,
              ${MODE_COLORS[state.mode]}cc,
              ${MODE_COLORS[state.mode]}44)`,
            boxShadow: `
              0 0 ${80 + emotion.avo.arousal * 40}px ${MODE_COLORS[state.mode]}44,
              0 0 ${40 + emotion.avo.arousal * 20}px ${MODE_COLORS[state.mode]}66,
              inset 0 0 60px rgba(255,255,255,0.1)
            `,
            transform: `scale(${0.9 + emotion.avo.arousal * 0.2})`,
            transition: 'all 0.2s ease-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {state.mode}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
              {emotion.anchor}
            </div>
          </div>
        </div>

        {/* AVO bars */}
        <div style={{ marginTop: 40, width: 280 }}>
          {[
            { key: 'arousal', label: 'Arousal', color: '#f59e0b', value: emotion.avo.arousal },
            { key: 'valence', label: 'Valence', color: '#10b981', value: emotion.avo.valence },
            { key: 'openness', label: 'Openness', color: '#8b5cf6', value: emotion.avo.openness },
          ].map(({ key, label, color, value }) => (
            <div key={key} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color }}>{label}</span>
                <span style={{ fontSize: 10 }}>{value.toFixed(3)}</span>
              </div>
              <div style={{ height: 8, background: '#222', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${value * 100}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${color}66, ${color})`,
                    transition: 'width 0.15s',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Persona drift indicator */}
        <div
          style={{
            marginTop: 24,
            padding: '12px 24px',
            background: state.personaDriftRisk > 0.3 ? '#2a1a1a' : '#111',
            borderRadius: 8,
            border: `1px solid ${state.personaDriftRisk > 0.6 ? '#ef4444' : state.personaDriftRisk > 0.3 ? '#f59e0b' : '#222'}`,
          }}
        >
          <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>Persona Drift Risk</div>
          <div
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 16,
              color: state.personaDriftRisk > 0.6 ? '#ef4444' : state.personaDriftRisk > 0.3 ? '#f59e0b' : '#10b981',
            }}
          >
            {(state.personaDriftRisk * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Right Panel: Debug */}
      {showDebug && (
        <div
          style={{
            background: '#0f0f14',
            borderLeft: '1px solid #1a1a24',
            padding: 20,
            overflow: 'auto',
            fontSize: 10,
          }}
        >
          <h3 style={{ fontSize: 12, marginBottom: 16 }}>Debug</h3>

          {/* Mode & Focus */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#666', marginBottom: 8, textTransform: 'uppercase' }}>State</div>
            <div style={{ background: '#111', padding: 12, borderRadius: 6 }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: '#666' }}>mode:</span>{' '}
                <span style={{ color: MODE_COLORS[state.mode] }}>{state.mode}</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: '#666' }}>focusRunId:</span>{' '}
                <span>{state.focusRunId ?? 'null'}</span>
              </div>
              <div>
                <span style={{ color: '#666' }}>submode:</span>{' '}
                <span>{state.submode ?? 'null'}</span>
              </div>
            </div>
          </div>

          {/* Signals */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#666', marginBottom: 8, textTransform: 'uppercase' }}>Signals</div>
            <div style={{ background: '#111', padding: 12, borderRadius: 6, lineHeight: 1.8 }}>
              {SIGNAL_KEYS.map((key) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>{key}</span>
                  <span>{state[key].toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Persona */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#666', marginBottom: 8, textTransform: 'uppercase' }}>Persona</div>
            <div style={{ background: '#111', padding: 12, borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#666' }}>anchor</span>
                <span>{state.personaAnchor.toFixed(3)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>driftRisk</span>
                <span style={{ color: state.personaDriftRisk > 0.3 ? '#f59e0b' : '#10b981' }}>
                  {state.personaDriftRisk.toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          {/* Emotion Output */}
          <div>
            <div style={{ color: '#666', marginBottom: 8, textTransform: 'uppercase' }}>Emotion Output</div>
            <div style={{ background: '#111', padding: 12, borderRadius: 6 }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: '#666' }}>anchor:</span>{' '}
                <span style={{ color: '#06b6d4' }}>{emotion.anchor}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#f59e0b' }}>arousal</span>
                <span>{emotion.avo.arousal.toFixed(4)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#10b981' }}>valence</span>
                <span>{emotion.avo.valence.toFixed(4)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8b5cf6' }}>openness</span>
                <span>{emotion.avo.openness.toFixed(4)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const meta: Meta = {
  title: 'Systems/Cognition/Playground',
  component: Playground,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

type Story = StoryObj;

export const Interactive: Story = {
  render: () => <Playground />,
};

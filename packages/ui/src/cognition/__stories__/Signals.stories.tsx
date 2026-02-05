import type { Meta, StoryObj } from '@storybook/react';
import { useState, useCallback } from 'react';
import { useCognition } from '../hooks/useCognition';
import type { CognitionSignals } from '../types';

const SIGNAL_INFO: Record<keyof CognitionSignals, { label: string; description: string; color: string; lowLabel: string; highLabel: string }> = {
  attention: {
    label: 'Attention',
    description: 'Current focus level on the task at hand',
    color: '#06b6d4',
    lowLabel: 'Diffuse',
    highLabel: 'Focused',
  },
  workload: {
    label: 'Workload',
    description: 'Processing load from active tasks',
    color: '#f59e0b',
    lowLabel: 'Light',
    highLabel: 'Heavy',
  },
  timePressure: {
    label: 'Time Pressure',
    description: 'Urgency based on deadlines or user expectations',
    color: '#ef4444',
    lowLabel: 'Relaxed',
    highLabel: 'Urgent',
  },
  planDrift: {
    label: 'Plan Drift',
    description: 'Deviation from the original execution plan',
    color: '#f97316',
    lowLabel: 'On Track',
    highLabel: 'Off Course',
  },
  costPressure: {
    label: 'Cost Pressure',
    description: 'Resource consumption awareness',
    color: '#a855f7',
    lowLabel: 'Budget OK',
    highLabel: 'Expensive',
  },
  risk: {
    label: 'Risk',
    description: 'Potential for negative outcomes',
    color: '#dc2626',
    lowLabel: 'Safe',
    highLabel: 'Risky',
  },
  uncertainty: {
    label: 'Uncertainty',
    description: 'Lack of clarity about correct approach',
    color: '#6366f1',
    lowLabel: 'Certain',
    highLabel: 'Uncertain',
  },
  confidence: {
    label: 'Confidence',
    description: 'Belief in ability to succeed',
    color: '#10b981',
    lowLabel: 'Doubtful',
    highLabel: 'Confident',
  },
  errorStress: {
    label: 'Error Stress',
    description: 'Accumulated stress from errors (decays over time)',
    color: '#ef4444',
    lowLabel: 'Calm',
    highLabel: 'Stressed',
  },
};

const SIGNAL_KEYS = Object.keys(SIGNAL_INFO) as (keyof CognitionSignals)[];

const SignalSlider = ({
  signalKey,
  value,
  onChange,
}: {
  signalKey: keyof CognitionSignals;
  value: number;
  onChange: (value: number) => void;
}) => {
  const info = SIGNAL_INFO[signalKey];

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: info.color }}>
            {info.label}
          </span>
          <span style={{ fontSize: 10, color: '#666', marginLeft: 8 }}>{info.description}</span>
        </div>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{value.toFixed(2)}</span>
      </div>

      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          accentColor: info.color,
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 9,
          color: '#444',
          marginTop: 4,
        }}
      >
        <span>{info.lowLabel}</span>
        <span>{info.highLabel}</span>
      </div>
    </div>
  );
};

const SignalsExplorer = () => {
  const { state, emotion, handleEvent } = useCognition({
    initial: { mode: 'deliberating' },
    autoTick: true,
  });

  const updateSignal = useCallback(
    (key: keyof CognitionSignals, value: number) => {
      handleEvent({
        type: 'signals.update',
        signals: { [key]: value },
      });
    },
    [handleEvent]
  );

  // Presets
  const applyPreset = (preset: 'calm' | 'focused' | 'stressed' | 'uncertain') => {
    const presets: Record<string, Partial<CognitionSignals>> = {
      calm: {
        attention: 0.3,
        workload: 0.1,
        timePressure: 0,
        planDrift: 0,
        costPressure: 0.1,
        risk: 0.1,
        uncertainty: 0.1,
        confidence: 0.9,
        errorStress: 0,
      },
      focused: {
        attention: 0.9,
        workload: 0.6,
        timePressure: 0.3,
        planDrift: 0,
        costPressure: 0.2,
        risk: 0.2,
        uncertainty: 0.1,
        confidence: 0.85,
        errorStress: 0,
      },
      stressed: {
        attention: 0.7,
        workload: 0.9,
        timePressure: 0.8,
        planDrift: 0.4,
        costPressure: 0.6,
        risk: 0.5,
        uncertainty: 0.4,
        confidence: 0.5,
        errorStress: 0.7,
      },
      uncertain: {
        attention: 0.5,
        workload: 0.4,
        timePressure: 0.2,
        planDrift: 0.3,
        costPressure: 0.2,
        risk: 0.6,
        uncertainty: 0.8,
        confidence: 0.3,
        errorStress: 0.2,
      },
    };
    handleEvent({ type: 'signals.update', signals: presets[preset] });
  };

  return (
    <div style={{ padding: 40, background: '#0a0a0f', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ fontFamily: 'JetBrains Mono', fontSize: 24, marginBottom: 8 }}>
        Continuous Signals
      </h1>
      <p style={{ color: '#666', marginBottom: 32, fontSize: 14 }}>
        9 normalized signals (0..1) that modulate cognitive state. Signals affect the emotion
        bridge output and can trigger mode transitions at threshold values.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 48 }}>
        {/* Signal sliders */}
        <div>
          {/* Presets */}
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 10,
                color: '#666',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              Presets
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['calm', 'focused', 'stressed', 'uncertain'] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => applyPreset(preset)}
                  style={{
                    padding: '8px 16px',
                    background: '#111',
                    border: '1px solid #333',
                    borderRadius: 6,
                    color: '#888',
                    fontFamily: 'JetBrains Mono',
                    fontSize: 11,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div style={{ background: '#111', borderRadius: 12, padding: 24 }}>
            {SIGNAL_KEYS.map((key) => (
              <SignalSlider
                key={key}
                signalKey={key}
                value={state[key]}
                onChange={(v) => updateSignal(key, v)}
              />
            ))}
          </div>
        </div>

        {/* Effect preview */}
        <div>
          <div
            style={{
              background: '#111',
              borderRadius: 12,
              padding: 24,
              position: 'sticky',
              top: 40,
            }}
          >
            <h3
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 12,
                color: '#666',
                textTransform: 'uppercase',
                marginBottom: 20,
              }}
            >
              Effect on Emotion
            </h3>

            {/* AVO bars */}
            {[
              { key: 'arousal', label: 'Arousal', color: '#f59e0b', value: emotion.avo.arousal },
              { key: 'valence', label: 'Valence', color: '#10b981', value: emotion.avo.valence },
              { key: 'openness', label: 'Openness', color: '#8b5cf6', value: emotion.avo.openness },
            ].map(({ key, label, color, value }) => (
              <div key={key} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color }}>{label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>{value.toFixed(3)}</span>
                </div>
                <div style={{ height: 8, background: '#222', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${value * 100}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${color}55, ${color})`,
                      transition: 'width 0.15s',
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Current anchor */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #222' }}>
              <div style={{ fontSize: 10, color: '#666', marginBottom: 8 }}>Emotion Anchor</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: '#06b6d4' }}>
                {emotion.anchor}
              </div>
            </div>

            {/* Mode */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, color: '#666', marginBottom: 8 }}>Cognitive Mode</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14 }}>{state.mode}</div>
            </div>

            {/* Signal effects explanation */}
            <div
              style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: '1px solid #222',
                fontSize: 10,
                color: '#555',
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: '#666' }}>Signal Effects:</strong>
              <br />• workload, timePressure → ↑ arousal
              <br />• errorStress, uncertainty → ↓ valence
              <br />• confidence → ↑ valence
              <br />• personaDriftRisk → ↓ openness
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const meta: Meta = {
  title: 'Systems/Cognition/Signals',
  component: SignalsExplorer,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

type Story = StoryObj;

export const Explorer: Story = {
  render: () => <SignalsExplorer />,
};

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { useCognition } from '../hooks/useCognition';
import { MODE_TO_ANCHOR, MODE_TO_AVO } from '../controller';
import type { CognitiveMode } from '../types';

const ALL_MODES: CognitiveMode[] = [
  'idle',
  'listening',
  'deliberating',
  'acting',
  'explaining',
  'recovering',
  'blocked',
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

const EmotionBridgeDemo = () => {
  const [selectedMode, setSelectedMode] = useState<CognitiveMode>('idle');
  const { state, emotion, handleEvent } = useCognition({
    initial: { mode: 'idle' },
    autoTick: false,
  });

  // Update mode via appropriate event
  const selectMode = (mode: CognitiveMode) => {
    setSelectedMode(mode);
    switch (mode) {
      case 'idle':
        handleEvent({ type: 'ui.user_idle' });
        break;
      case 'listening':
        handleEvent({ type: 'ui.input_received' });
        break;
      case 'deliberating':
        handleEvent({ type: 'run.started', runId: 'demo' });
        break;
      default:
        // For other modes, we simulate by setting signals
        handleEvent({ type: 'run.event', runId: 'demo', status: mode });
    }
  };

  // Signal adjustments for demo
  const adjustSignal = (signal: string, value: number) => {
    handleEvent({
      type: 'signals.update',
      signals: { [signal]: value },
    });
  };

  return (
    <div style={{ padding: 40, background: '#0a0a0f', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ fontFamily: 'JetBrains Mono', fontSize: 24, marginBottom: 8 }}>
        Emotion Bridge
      </h1>
      <p style={{ color: '#666', marginBottom: 32, fontSize: 14, maxWidth: 700 }}>
        The Cognition system bridges to the Emotion system by mapping cognitive modes to
        emotion anchors and AVO values. Signals modulate the base AVO for dynamic expression.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        {/* Left: Mode → Anchor mapping */}
        <div>
          <h3
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 11,
              color: '#666',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            Mode → Anchor Mapping
          </h3>

          <div style={{ background: '#111', borderRadius: 12, overflow: 'hidden' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 2fr',
                padding: '12px 16px',
                background: '#0a0a0f',
                fontSize: 10,
                color: '#666',
                textTransform: 'uppercase',
              }}
            >
              <div>Cognitive Mode</div>
              <div>Emotion Anchor</div>
              <div>Base AVO</div>
            </div>

            {ALL_MODES.map((mode) => {
              const anchor = MODE_TO_ANCHOR[mode];
              const avo = MODE_TO_AVO[mode];
              const isActive = state.mode === mode;

              return (
                <button
                  key={mode}
                  onClick={() => selectMode(mode)}
                  style={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 2fr',
                    padding: '16px',
                    background: isActive ? '#1a1a2e' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid #1a1a1a',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: 12,
                      color: isActive ? MODE_COLORS[mode] : '#888',
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
                        opacity: isActive ? 1 : 0.4,
                      }}
                    />
                    {mode}
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#06b6d4' }}>
                    {anchor}
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#666' }}>
                    <span style={{ color: '#f59e0b' }}>A:{avo.arousal.toFixed(2)}</span>
                    {' '}
                    <span style={{ color: '#10b981' }}>V:{avo.valence.toFixed(2)}</span>
                    {' '}
                    <span style={{ color: '#8b5cf6' }}>O:{avo.openness.toFixed(2)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Signal modulation */}
        <div>
          <h3
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 11,
              color: '#666',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            Signal Modulation
          </h3>

          <div style={{ background: '#111', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, color: '#666', marginBottom: 12 }}>
                Adjust signals to see how they modulate the base AVO values:
              </div>

              {[
                { key: 'workload', label: 'Workload', effect: '↑ Arousal', color: '#f59e0b' },
                { key: 'timePressure', label: 'Time Pressure', effect: '↑ Arousal', color: '#ef4444' },
                { key: 'errorStress', label: 'Error Stress', effect: '↑ Arousal, ↓ Valence', color: '#dc2626' },
                { key: 'uncertainty', label: 'Uncertainty', effect: '↓ Valence', color: '#6366f1' },
                { key: 'confidence', label: 'Confidence', effect: '↑ Valence (if > 0.5)', color: '#10b981' },
                { key: 'personaDriftRisk', label: 'Persona Drift', effect: '↓ Openness', color: '#8b5cf6' },
              ].map(({ key, label, effect, color }) => (
                <div key={key} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color }}>
                      {label}
                      <span style={{ color: '#555', marginLeft: 8, fontSize: 9 }}>{effect}</span>
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}>
                      {(state[key as keyof typeof state] as number).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={state[key as keyof typeof state] as number}
                    onChange={(e) => adjustSignal(key, parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: color }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Live output */}
          <div style={{ background: '#111', borderRadius: 12, padding: 20 }}>
            <div
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 10,
                color: '#666',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              Computed Emotion Output
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>Mode</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: MODE_COLORS[state.mode] }}>
                  {state.mode}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>Anchor</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: '#06b6d4' }}>
                  {emotion.anchor}
                </div>
              </div>
            </div>

            {/* AVO comparison */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 9, color: '#666' }}>Dimension</div>
                <div style={{ fontSize: 9, color: '#666', textAlign: 'center' }}>Base → Adjusted</div>
                <div style={{ fontSize: 9, color: '#666', textAlign: 'right' }}>Delta</div>
              </div>

              {[
                { key: 'arousal', label: 'Arousal', color: '#f59e0b' },
                { key: 'valence', label: 'Valence', color: '#10b981' },
                { key: 'openness', label: 'Openness', color: '#8b5cf6' },
              ].map(({ key, label, color }) => {
                const base = MODE_TO_AVO[state.mode][key as keyof typeof MODE_TO_AVO.idle];
                const adjusted = emotion.avo[key as keyof typeof emotion.avo];
                const delta = adjusted - base;

                return (
                  <div
                    key={key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr 80px',
                      gap: 8,
                      marginBottom: 12,
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 11, color }}>{label}</span>
                    <div style={{ position: 'relative', height: 16 }}>
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '100%',
                          background: '#222',
                          borderRadius: 4,
                        }}
                      />
                      {/* Base marker */}
                      <div
                        style={{
                          position: 'absolute',
                          left: `${base * 100}%`,
                          top: 0,
                          width: 2,
                          height: '100%',
                          background: '#444',
                        }}
                      />
                      {/* Adjusted bar */}
                      <div
                        style={{
                          position: 'absolute',
                          left: Math.min(base, adjusted) * 100 + '%',
                          width: Math.abs(delta) * 100 + '%',
                          top: 4,
                          height: 8,
                          background: delta >= 0 ? color : '#ef4444',
                          borderRadius: 2,
                          opacity: 0.7,
                        }}
                      />
                      {/* Current position */}
                      <div
                        style={{
                          position: 'absolute',
                          left: `calc(${adjusted * 100}% - 4px)`,
                          top: 2,
                          width: 8,
                          height: 12,
                          background: color,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono',
                        fontSize: 10,
                        textAlign: 'right',
                        color: delta === 0 ? '#444' : delta > 0 ? '#10b981' : '#ef4444',
                      }}
                    >
                      {delta >= 0 ? '+' : ''}{delta.toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Final AVO */}
            <div
              style={{
                background: '#0a0a0f',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                justifyContent: 'space-around',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#f59e0b', marginBottom: 4 }}>Arousal</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 18 }}>
                  {emotion.avo.arousal.toFixed(3)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#10b981', marginBottom: 4 }}>Valence</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 18 }}>
                  {emotion.avo.valence.toFixed(3)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#8b5cf6', marginBottom: 4 }}>Openness</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 18 }}>
                  {emotion.avo.openness.toFixed(3)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const meta: Meta = {
  title: 'Systems/Cognition/Emotion Bridge',
  component: EmotionBridgeDemo,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

type Story = StoryObj;

export const Interactive: Story = {
  render: () => <EmotionBridgeDemo />,
};

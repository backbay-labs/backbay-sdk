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

const MODE_INFO: Record<CognitiveMode, { description: string; trigger: string; color: string }> = {
  idle: {
    description: 'Resting state, ready for input. Low arousal, positive valence.',
    trigger: 'ui.user_idle',
    color: '#6366f1',
  },
  listening: {
    description: 'Receiving user input. Moderate arousal, receptive openness.',
    trigger: 'ui.input_received',
    color: '#06b6d4',
  },
  deliberating: {
    description: 'Processing information, thinking through options.',
    trigger: 'run.started',
    color: '#f59e0b',
  },
  acting: {
    description: 'Executing tool calls or actions. High focus and energy.',
    trigger: 'run.event (acting)',
    color: '#10b981',
  },
  explaining: {
    description: 'Communicating results. High openness for expression.',
    trigger: 'run.event (explaining)',
    color: '#84cc16',
  },
  recovering: {
    description: 'Handling errors, recovering from failures gracefully.',
    trigger: 'run.completed (failure)',
    color: '#f97316',
  },
  blocked: {
    description: 'Cannot proceed, needs user intervention.',
    trigger: 'Manual or prolonged error',
    color: '#ef4444',
  },
};

const ModeCard = ({ mode, isActive, onClick }: { mode: CognitiveMode; isActive: boolean; onClick: () => void }) => {
  const info = MODE_INFO[mode];
  const anchor = MODE_TO_ANCHOR[mode];
  const avo = MODE_TO_AVO[mode];

  return (
    <button
      onClick={onClick}
      style={{
        padding: 20,
        background: isActive ? '#1a1a2e' : '#111',
        border: `2px solid ${isActive ? info.color : '#222'}`,
        borderRadius: 12,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${info.color}cc, ${info.color}55)`,
            boxShadow: isActive ? `0 0 20px ${info.color}66` : 'none',
          }}
        />
        <div>
          <div
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 14,
              color: isActive ? info.color : '#fff',
              textTransform: 'capitalize',
            }}
          >
            {mode}
          </div>
          <div style={{ fontSize: 10, color: '#666' }}>→ {anchor}</div>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: 11, color: '#888', lineHeight: 1.5, marginBottom: 12 }}>
        {info.description}
      </p>

      {/* AVO values */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
        <div style={{ fontSize: 9 }}>
          <span style={{ color: '#f59e0b' }}>A</span>
          <span style={{ color: '#666', marginLeft: 4 }}>{avo.arousal.toFixed(2)}</span>
        </div>
        <div style={{ fontSize: 9 }}>
          <span style={{ color: '#10b981' }}>V</span>
          <span style={{ color: '#666', marginLeft: 4 }}>{avo.valence.toFixed(2)}</span>
        </div>
        <div style={{ fontSize: 9 }}>
          <span style={{ color: '#8b5cf6' }}>O</span>
          <span style={{ color: '#666', marginLeft: 4 }}>{avo.openness.toFixed(2)}</span>
        </div>
      </div>

      {/* Trigger */}
      <div style={{ fontSize: 9, color: '#555' }}>
        <span style={{ color: '#444' }}>Trigger:</span> {info.trigger}
      </div>
    </button>
  );
};

const ModesGallery = () => {
  const [activeMode, setActiveMode] = useState<CognitiveMode>('idle');
  const { state, emotion, handleEvent } = useCognition({
    initial: { mode: activeMode },
    autoTick: false,
  });

  const activateMode = (mode: CognitiveMode) => {
    setActiveMode(mode);
    // Trigger appropriate event based on mode
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
      case 'acting':
      case 'explaining':
        handleEvent({ type: 'run.event', runId: 'demo', status: mode });
        break;
      case 'recovering':
        handleEvent({ type: 'run.completed', runId: 'demo', success: false });
        break;
      case 'blocked':
        // Blocked is usually set programmatically, simulate with signals
        handleEvent({ type: 'signals.update', signals: { errorStress: 0.9 } });
        break;
    }
  };

  return (
    <div style={{ padding: 40, background: '#0a0a0f', minHeight: '100vh', color: '#fff' }}>
      <h1
        style={{
          fontFamily: 'JetBrains Mono',
          fontSize: 24,
          marginBottom: 8,
          color: '#fff',
        }}
      >
        Cognitive Modes
      </h1>
      <p style={{ color: '#666', marginBottom: 32, fontSize: 14 }}>
        7 discrete cognitive states that drive Glyph's behavior and visual expression.
        Each mode maps to an emotion anchor and default AVO values.
      </p>

      {/* Mode grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
          marginBottom: 48,
        }}
      >
        {ALL_MODES.map((mode) => (
          <ModeCard
            key={mode}
            mode={mode}
            isActive={state.mode === mode}
            onClick={() => activateMode(mode)}
          />
        ))}
      </div>

      {/* Live preview */}
      <div
        style={{
          background: '#111',
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 32,
        }}
      >
        {/* Orb */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%,
              ${MODE_INFO[state.mode].color}cc,
              ${MODE_INFO[state.mode].color}44)`,
            boxShadow: `0 0 40px ${MODE_INFO[state.mode].color}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease-out',
          }}
        >
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#fff' }}>
            {state.mode}
          </span>
        </div>

        {/* Current state info */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 12,
              color: '#666',
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            Current State
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>Mode</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: MODE_INFO[state.mode].color }}>
                {state.mode}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>Anchor</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{emotion.anchor}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>AVO</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}>
                <span style={{ color: '#f59e0b' }}>{emotion.avo.arousal.toFixed(2)}</span>
                {' / '}
                <span style={{ color: '#10b981' }}>{emotion.avo.valence.toFixed(2)}</span>
                {' / '}
                <span style={{ color: '#8b5cf6' }}>{emotion.avo.openness.toFixed(2)}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>Focus Run</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>
                {state.focusRunId ?? '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const meta: Meta = {
  title: 'Systems/Cognition/Modes',
  component: ModesGallery,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

type Story = StoryObj;

export const Gallery: Story = {
  render: () => <ModesGallery />,
};

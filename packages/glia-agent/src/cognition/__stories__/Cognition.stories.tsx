import type { Meta, StoryObj } from '@storybook/react';
import { useCognition } from '../hooks/useCognition';
import type { CognitiveMode } from '../types';

/**
 * # Glyph Cognition System
 *
 * A UI-facing model for representing agent cognitive state,
 * designed to drive the Glyph character's visual expression.
 *
 * ## The Model
 *
 * **Cognitive Modes** (7 discrete states):
 * - `idle` - Resting, ready state
 * - `listening` - Receiving user input
 * - `deliberating` - Processing/thinking
 * - `acting` - Executing actions
 * - `explaining` - Communicating results
 * - `recovering` - Handling errors
 * - `blocked` - Cannot proceed
 *
 * **Continuous Signals** (9 normalized 0..1 values):
 * - attention, workload, timePressure, planDrift, costPressure
 * - risk, uncertainty, confidence, errorStress
 *
 * **Persona Signals**:
 * - personaAnchor - Identity stability (0..1)
 * - personaDriftRisk - Risk of persona confusion (0..1)
 *
 * ## Stories
 *
 * - **Overview**: Introduction and live demo
 * - **Modes**: Gallery of all cognitive modes
 * - **Signals**: Interactive signal exploration
 * - **Events**: Trigger state changes via events
 * - **Persona Drift**: Assistant Axis stability
 * - **Emotion Bridge**: Cognition → Emotion mapping
 * - **Playground**: Full interactive sandbox
 */

const MODE_DESCRIPTIONS: Record<CognitiveMode, { label: string; description: string; color: string }> = {
  idle: {
    label: 'Idle',
    description: 'Resting state, ready to receive input',
    color: '#6366f1',
  },
  listening: {
    label: 'Listening',
    description: 'Actively receiving user input',
    color: '#06b6d4',
  },
  deliberating: {
    label: 'Deliberating',
    description: 'Processing information, thinking',
    color: '#f59e0b',
  },
  acting: {
    label: 'Acting',
    description: 'Executing actions or tool calls',
    color: '#10b981',
  },
  explaining: {
    label: 'Explaining',
    description: 'Communicating results to user',
    color: '#84cc16',
  },
  recovering: {
    label: 'Recovering',
    description: 'Handling errors, recovering from failures',
    color: '#f97316',
  },
  blocked: {
    label: 'Blocked',
    description: 'Cannot proceed, needs intervention',
    color: '#ef4444',
  },
};

const Overview = () => {
  const { state, emotion, handleEvent } = useCognition({
    initial: { mode: 'idle' },
    autoTick: true,
  });

  const quickModes: CognitiveMode[] = ['idle', 'listening', 'deliberating', 'acting', 'explaining'];

  return (
    <div style={{ padding: 40, background: '#0a0a0f', minHeight: '100vh', color: '#fff' }}>
      {/* Header */}
      <div style={{ maxWidth: 800, marginBottom: 48 }}>
        <h1
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 32,
            marginBottom: 16,
            background: 'linear-gradient(135deg, #06b6d4, #8b5cf6, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Glyph Cognition System
        </h1>
        <p style={{ color: '#888', fontSize: 16, lineHeight: 1.6, fontFamily: 'system-ui' }}>
          A UI-facing model for representing agent cognitive state. Drives Glyph's visual
          expression through mode transitions, continuous signals, and persona stability tracking.
          Bridges to the Emotion system for smooth AVO-based animations.
        </p>
      </div>

      {/* Main demo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, maxWidth: 1000 }}>
        {/* Live indicator */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 40,
            background: '#111',
            borderRadius: 16,
          }}
        >
          {/* Mode indicator orb */}
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%,
                ${MODE_DESCRIPTIONS[state.mode].color}cc,
                ${MODE_DESCRIPTIONS[state.mode].color}55)`,
              boxShadow: `
                0 0 60px ${MODE_DESCRIPTIONS[state.mode].color}66,
                inset 0 0 40px rgba(255,255,255,0.1)
              `,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease-out',
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 14,
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {state.mode}
            </span>
          </div>

          {/* Quick mode buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {quickModes.map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  if (mode === 'listening') {
                    handleEvent({ type: 'ui.input_received' });
                  } else if (mode === 'deliberating') {
                    handleEvent({ type: 'run.started', runId: 'demo' });
                  } else if (mode === 'idle') {
                    handleEvent({ type: 'ui.user_idle' });
                  } else {
                    handleEvent({ type: 'signals.update', signals: {} });
                  }
                }}
                style={{
                  padding: '8px 16px',
                  background: state.mode === mode ? '#1a1a2e' : '#1a1a1a',
                  border: `1px solid ${state.mode === mode ? MODE_DESCRIPTIONS[mode].color : '#333'}`,
                  borderRadius: 6,
                  color: state.mode === mode ? MODE_DESCRIPTIONS[mode].color : '#888',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          <div
            style={{
              marginTop: 16,
              fontSize: 11,
              fontFamily: 'JetBrains Mono',
              color: '#555',
            }}
          >
            Click modes to transition
          </div>
        </div>

        {/* Info panel */}
        <div>
          {/* Current state */}
          <div style={{ marginBottom: 32 }}>
            <h3
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 12,
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 16,
              }}
            >
              Current State
            </h3>

            <div
              style={{
                background: '#111',
                borderRadius: 8,
                padding: 16,
                borderLeft: `3px solid ${MODE_DESCRIPTIONS[state.mode].color}`,
              }}
            >
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, marginBottom: 8 }}>
                {MODE_DESCRIPTIONS[state.mode].label}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {MODE_DESCRIPTIONS[state.mode].description}
              </div>
            </div>
          </div>

          {/* Key signals */}
          <div style={{ marginBottom: 32 }}>
            <h3
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 12,
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 16,
              }}
            >
              Key Signals
            </h3>

            {[
              { key: 'confidence', label: 'Confidence', color: '#10b981', value: state.confidence },
              { key: 'workload', label: 'Workload', color: '#f59e0b', value: state.workload },
              { key: 'errorStress', label: 'Error Stress', color: '#ef4444', value: state.errorStress },
              { key: 'personaDriftRisk', label: 'Persona Drift', color: '#8b5cf6', value: state.personaDriftRisk },
            ].map(({ key, label, color, value }) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color }}>{label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>{value.toFixed(2)}</span>
                </div>
                <div style={{ height: 4, background: '#222', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${value * 100}%`,
                      height: '100%',
                      background: color,
                      transition: 'width 0.2s',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Emotion bridge preview */}
          <div>
            <h3
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 12,
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 16,
              }}
            >
              Emotion Bridge
            </h3>
            <div
              style={{
                background: '#111',
                borderRadius: 8,
                padding: 12,
                fontFamily: 'JetBrains Mono',
                fontSize: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#666' }}>anchor</span>
                <span style={{ color: '#06b6d4' }}>{emotion.anchor}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#666' }}>arousal</span>
                <span style={{ color: '#f59e0b' }}>{emotion.avo.arousal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#666' }}>valence</span>
                <span style={{ color: '#10b981' }}>{emotion.avo.valence.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>openness</span>
                <span style={{ color: '#8b5cf6' }}>{emotion.avo.openness.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 48 }}>
        {[
          {
            title: '7 Cognitive Modes',
            description: 'Discrete states: idle, listening, deliberating, acting, explaining, recovering, blocked',
            color: '#06b6d4',
          },
          {
            title: '9 Continuous Signals',
            description: 'Workload, confidence, risk, uncertainty, and more - all normalized 0..1',
            color: '#f59e0b',
          },
          {
            title: 'Persona Stability',
            description: 'Track persona drift risk to maintain Assistant Axis identity',
            color: '#8b5cf6',
          },
          {
            title: 'Emotion Bridge',
            description: 'Maps cognitive state to AVO dimensions for visual expression',
            color: '#10b981',
          },
          {
            title: 'Event-Driven',
            description: 'UI events, run events, and signal updates drive state changes',
            color: '#ec4899',
          },
          {
            title: 'React Hook',
            description: 'useCognition() provides reactive state with auto-tick decay',
            color: '#84cc16',
          },
        ].map((feature) => (
          <div
            key={feature.title}
            style={{
              padding: 20,
              background: '#111',
              borderRadius: 12,
              borderLeft: `3px solid ${feature.color}`,
            }}
          >
            <h4
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 13,
                color: feature.color,
                marginBottom: 8,
              }}
            >
              {feature.title}
            </h4>
            <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const meta: Meta = {
  title: 'Systems/Cognition/Overview',
  component: Overview,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component: `
# Glyph Cognition System

A UI-facing model for representing agent cognitive state.

## Installation

\`\`\`tsx
import { useCognition } from '@backbay/glia/cognition';
\`\`\`

## Basic Usage

\`\`\`tsx
const { state, emotion, handleEvent } = useCognition({
  initial: { mode: 'idle' },
  autoTick: true,
});

// Handle events
handleEvent({ type: 'run.started', runId: 'r1' });

// Access emotion bridge
console.log(emotion.anchor, emotion.avo);
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Overview />,
};

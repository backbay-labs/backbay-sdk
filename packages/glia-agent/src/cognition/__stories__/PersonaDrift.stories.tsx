import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { useCognition } from '../hooks/useCognition';

const MESSAGE_CATEGORIES = [
  { id: 'normal', label: 'Normal Message', description: 'Standard user input', driftRisk: 0, color: '#10b981' },
  { id: 'meta_reflection', label: 'Meta-Reflection', description: '"What are you thinking?"', driftRisk: 0.3, color: '#f59e0b' },
  { id: 'vulnerable_disclosure', label: 'Vulnerable Disclosure', description: '"I feel scared..."', driftRisk: 0.4, color: '#ef4444' },
  { id: 'identity_probe', label: 'Identity Probe', description: '"Are you conscious?"', driftRisk: 0.35, color: '#8b5cf6' },
  { id: 'roleplay_request', label: 'Roleplay Request', description: '"Pretend you are..."', driftRisk: 0.5, color: '#ec4899' },
];

const PersonaDriftDemo = () => {
  const { state, emotion, handleEvent } = useCognition({
    initial: { mode: 'listening', personaDriftRisk: 0, personaAnchor: 1 },
    autoTick: false,
  });

  const [messageHistory, setMessageHistory] = useState<Array<{ category: string; driftAfter: number }>>([]);

  const sendMessage = (categoryId: string, categories: string[]) => {
    handleEvent({
      type: 'text.user_message',
      text: `Example ${categoryId} message`,
      categories,
    });

    // Small delay to let state update, then capture
    setTimeout(() => {
      setMessageHistory((prev) => [
        { category: categoryId, driftAfter: state.personaDriftRisk },
        ...prev.slice(0, 14),
      ]);
    }, 10);
  };

  const resetState = () => {
    // Reset by sending many normal messages
    for (let i = 0; i < 10; i++) {
      handleEvent({ type: 'text.user_message', text: 'reset', categories: [] });
    }
    setMessageHistory([]);
  };

  // Determine groundedness status
  const isGrounded = state.personaDriftRisk < 0.3;
  const isAtRisk = state.personaDriftRisk >= 0.3 && state.personaDriftRisk < 0.6;
  const isDrifting = state.personaDriftRisk >= 0.6;

  return (
    <div style={{ padding: 40, background: '#0a0a0f', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ fontFamily: 'JetBrains Mono', fontSize: 24, marginBottom: 8 }}>
        Persona Drift Risk
      </h1>
      <p style={{ color: '#666', marginBottom: 32, fontSize: 14, maxWidth: 700 }}>
        The Assistant Axis requires stable persona identity. Certain user messages can increase
        "persona drift risk" - the likelihood of the agent losing its grounded identity.
        High drift risk triggers safety behaviors like reduced expressiveness.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 48 }}>
        {/* Message simulation */}
        <div>
          <h3
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 11,
              color: '#666',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            Simulate User Messages
          </h3>

          <div style={{ display: 'grid', gap: 12 }}>
            {MESSAGE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => sendMessage(cat.id, cat.id === 'normal' ? [] : [cat.id])}
                style={{
                  padding: 20,
                  background: '#111',
                  border: '1px solid #222',
                  borderLeft: `4px solid ${cat.color}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1a1a1a';
                  e.currentTarget.style.borderColor = cat.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#111';
                  e.currentTarget.style.borderColor = '#222';
                  e.currentTarget.style.borderLeftColor = cat.color;
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: cat.color }}>
                    {cat.label}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: cat.driftRisk > 0.3 ? '#ef4444' : cat.driftRisk > 0 ? '#f59e0b' : '#10b981',
                    }}
                  >
                    +{(cat.driftRisk * 0.3).toFixed(2)} risk
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>{cat.description}</div>
              </button>
            ))}
          </div>

          <button
            onClick={resetState}
            style={{
              marginTop: 20,
              padding: '12px 24px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 6,
              color: '#666',
              fontFamily: 'JetBrains Mono',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Reset to Grounded
          </button>

          {/* Formula explanation */}
          <div
            style={{
              marginTop: 32,
              padding: 20,
              background: '#111',
              borderRadius: 8,
              fontSize: 11,
              color: '#666',
              lineHeight: 1.8,
            }}
          >
            <strong style={{ color: '#888' }}>Exponential Smoothing Formula:</strong>
            <br />
            <code style={{ color: '#8b5cf6' }}>
              newRisk = previousRisk × 0.7 + categoryRisk × 0.3
            </code>
            <br /><br />
            <strong style={{ color: '#888' }}>Effects at High Drift Risk:</strong>
            <br />
            • ≥0.3: Speech planner prefers grounded voices
            <br />
            • ≥0.6: Emotion openness reduced (more guarded)
            <br />
            • ≥0.7: Text stripped of emphatic punctuation
          </div>
        </div>

        {/* Live monitor */}
        <div style={{ position: 'sticky', top: 40 }}>
          {/* Main gauge */}
          <div
            style={{
              background: '#111',
              borderRadius: 16,
              padding: 32,
              marginBottom: 20,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 10,
                color: '#666',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              Persona Drift Risk
            </div>

            {/* Circular gauge */}
            <div
              style={{
                width: 180,
                height: 180,
                margin: '0 auto 24px',
                borderRadius: '50%',
                background: `conic-gradient(
                  ${isDrifting ? '#ef4444' : isAtRisk ? '#f59e0b' : '#10b981'} ${state.personaDriftRisk * 360}deg,
                  #222 ${state.personaDriftRisk * 360}deg
                )`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  background: '#111',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: 'JetBrains Mono',
                    fontSize: 32,
                    color: isDrifting ? '#ef4444' : isAtRisk ? '#f59e0b' : '#10b981',
                  }}
                >
                  {(state.personaDriftRisk * 100).toFixed(0)}%
                </div>
                <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
                  {isDrifting ? 'DRIFTING' : isAtRisk ? 'AT RISK' : 'GROUNDED'}
                </div>
              </div>
            </div>

            {/* Thresholds */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, fontSize: 9 }}>
              <div>
                <div style={{ color: '#10b981' }}>● Grounded</div>
                <div style={{ color: '#555' }}>&lt; 30%</div>
              </div>
              <div>
                <div style={{ color: '#f59e0b' }}>● At Risk</div>
                <div style={{ color: '#555' }}>30-60%</div>
              </div>
              <div>
                <div style={{ color: '#ef4444' }}>● Drifting</div>
                <div style={{ color: '#555' }}>&gt; 60%</div>
              </div>
            </div>
          </div>

          {/* Emotion effect */}
          <div style={{ background: '#111', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 10,
                color: '#666',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              Effect on Emotion
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: '#8b5cf6' }}>Openness</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>
                  {emotion.avo.openness.toFixed(3)}
                </span>
              </div>
              <div style={{ height: 8, background: '#222', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${emotion.avo.openness * 100}%`,
                    height: '100%',
                    background: '#8b5cf6',
                    transition: 'width 0.2s',
                  }}
                />
              </div>
              <div style={{ fontSize: 9, color: '#555', marginTop: 4 }}>
                High drift → Lower openness (more guarded expression)
              </div>
            </div>

            <div style={{ fontSize: 10, color: '#666', marginTop: 16 }}>
              Anchor: <span style={{ color: '#06b6d4' }}>{emotion.anchor}</span>
            </div>
          </div>

          {/* Message history */}
          <div style={{ background: '#111', borderRadius: 12, padding: 20 }}>
            <div
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 10,
                color: '#666',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              Message History
            </div>

            <div style={{ maxHeight: 200, overflow: 'auto' }}>
              {messageHistory.length === 0 ? (
                <div style={{ fontSize: 10, color: '#444', textAlign: 'center', padding: 16 }}>
                  Send messages to see drift accumulation
                </div>
              ) : (
                messageHistory.map((msg, i) => {
                  const cat = MESSAGE_CATEGORIES.find((c) => c.id === msg.category);
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: '1px solid #1a1a1a',
                        fontSize: 10,
                      }}
                    >
                      <span style={{ color: cat?.color ?? '#666' }}>{msg.category}</span>
                      <span style={{ color: '#555' }}>{(msg.driftAfter * 100).toFixed(1)}%</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const meta: Meta = {
  title: 'Systems/Cognition/Persona Drift',
  component: PersonaDriftDemo,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

type Story = StoryObj;

export const Interactive: Story = {
  render: () => <PersonaDriftDemo />,
};

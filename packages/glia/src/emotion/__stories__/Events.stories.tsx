import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEmotion, type EmotionEvent } from '../index';
import { GlyphObject, type GlyphOneShot } from '../../primitives/three/Glyph';

const EVENT_TYPES: EmotionEvent['type'][] = [
  'input_received',
  'processing_start',
  'processing_complete',
  'error_occurred',
  'success',
  'user_idle',
  'interrupt',
];

const EVENT_DESCRIPTIONS: Record<EmotionEvent['type'], { description: string; targetState: string; color: string }> = {
  input_received: {
    description: 'User starts typing or speaking',
    targetState: 'listening',
    color: '#06b6d4',
  },
  processing_start: {
    description: 'Agent begins processing request',
    targetState: 'thinking',
    color: '#f59e0b',
  },
  processing_complete: {
    description: 'Processing finished, preparing response',
    targetState: 'responding',
    color: '#10b981',
  },
  error_occurred: {
    description: 'An error was encountered',
    targetState: 'error/concerned (by intensity)',
    color: '#ef4444',
  },
  success: {
    description: 'Task completed successfully',
    targetState: 'satisfied',
    color: '#84cc16',
  },
  user_idle: {
    description: 'No user activity detected',
    targetState: 'idle',
    color: '#6366f1',
  },
  interrupt: {
    description: 'User interrupts current action',
    targetState: 'arousal spike (no state change)',
    color: '#ec4899',
  },
};

const EventsDemo = () => {
  const [eventLog, setEventLog] = useState<{ event: EmotionEvent; timestamp: Date }[]>([]);
  const [intensity, setIntensity] = useState(0.5);
  const [oneShot, setOneShot] = useState<GlyphOneShot | undefined>(undefined);
  const [oneShotNonce, setOneShotNonce] = useState(0);

  const { dimensions, visualState, emit, goTo } = useEmotion({
    initialAnchor: 'idle',
    microExpressions: true,
  });

  const triggerOneShot = (clip: GlyphOneShot) => {
    setOneShot(clip);
    setOneShotNonce((n) => n + 1);
  };

  const sendEvent = (type: EmotionEvent['type']) => {
    const event: EmotionEvent = { type, intensity };
    emit(event);
    setEventLog((prev) => [{ event, timestamp: new Date() }, ...prev].slice(0, 20));

    // Kick the corresponding baked one-shot clip (procedural layer still comes from AVO).
    if (type === 'processing_complete') triggerOneShot('responding');
    if (type === 'success') triggerOneShot('success');
    if (type === 'error_occurred') triggerOneShot('error');
  };

  return (
    <div style={{ padding: 32, background: '#0a0a0f', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ fontFamily: 'JetBrains Mono', fontSize: 24, marginBottom: 8 }}>
        Emotion Events
      </h1>
      <p style={{ color: '#666', marginBottom: 32, fontFamily: 'system-ui' }}>
        Events trigger automatic state transitions based on agent activity
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: 32 }}>
        {/* Event buttons */}
        <div>
          <h3
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 12,
              color: '#888',
              marginBottom: 16,
              textTransform: 'uppercase',
            }}
          >
            Emit Event
          </h3>

          {/* Intensity slider */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#888' }}>
                Intensity
              </span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>
                {intensity.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 9,
                color: '#555',
                marginTop: 4,
              }}
            >
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Event buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {EVENT_TYPES.map((type) => {
              const info = EVENT_DESCRIPTIONS[type];
              return (
                <button
                  key={type}
                  onClick={() => sendEvent(type)}
                  style={{
                    padding: '12px 16px',
                    background: '#111',
                    border: `1px solid ${info.color}40`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = info.color;
                    e.currentTarget.style.background = `${info.color}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${info.color}40`;
                    e.currentTarget.style.background = '#111';
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: 12,
                      color: info.color,
                      marginBottom: 4,
                    }}
                  >
                    {type}
                  </div>
                  <div style={{ fontSize: 11, color: '#666' }}>{info.description}</div>
                  <div style={{ fontSize: 10, color: '#444', marginTop: 4 }}>
                    → {info.targetState}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Reset button */}
          <button
            onClick={() => goTo('idle')}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              background: '#222',
              border: '1px solid #333',
              borderRadius: 6,
              color: '#888',
              fontFamily: 'JetBrains Mono',
              fontSize: 11,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Reset to Idle
          </button>
        </div>

        {/* Glyph visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: 360,
              height: 360,
              borderRadius: 16,
              background: '#0a0a0f',
              border: '1px solid #222',
              marginBottom: 24,
            }}
          >
            <Canvas
              camera={{ position: [0, 0, 4], fov: 50 }}
              dpr={[1, 2]}
              gl={{ antialias: true, alpha: true }}
            >
              <ambientLight intensity={0.25} />
              <pointLight position={[5, 5, 5]} intensity={0.5} color="#ffd700" />
              <pointLight position={[-5, -5, -5]} intensity={0.4} color="#00f0ff" />

              <GlyphObject
                state="idle"
                dimensions={dimensions}
                visualState={visualState}
                enableBlending={true}
                variant="sentinel"
                enableParticles={true}
                oneShot={oneShot}
                oneShotNonce={oneShotNonce}
              />

              <OrbitControls enableDamping dampingFactor={0.05} minDistance={2} maxDistance={10} />
            </Canvas>
          </div>

          {/* Current state display */}
          <div
            style={{
              padding: 16,
              background: '#111',
              borderRadius: 8,
              fontFamily: 'JetBrains Mono',
              textAlign: 'center',
              width: '100%',
            }}
          >
            <div style={{ fontSize: 10, color: '#888', marginBottom: 8 }}>Current AVO</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div>
                <div style={{ color: '#f59e0b', fontSize: 10 }}>A</div>
                <div style={{ fontSize: 14 }}>{dimensions.arousal.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ color: '#10b981', fontSize: 10 }}>V</div>
                <div style={{ fontSize: 14 }}>{dimensions.valence.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ color: '#8b5cf6', fontSize: 10 }}>O</div>
                <div style={{ fontSize: 14 }}>{dimensions.openness.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Event log */}
        <div>
          <h3
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 12,
              color: '#888',
              marginBottom: 16,
              textTransform: 'uppercase',
            }}
          >
            Event Log
          </h3>
          <div style={{ maxHeight: 500, overflow: 'auto' }}>
            {eventLog.length === 0 ? (
              <div style={{ color: '#444', fontFamily: 'JetBrains Mono', fontSize: 11 }}>
                Click an event to see it logged...
              </div>
            ) : (
              eventLog.map((entry, i) => {
                const info = EVENT_DESCRIPTIONS[entry.event.type];
                return (
                  <div
                    key={i}
                    style={{
                      padding: 10,
                      background: '#111',
                      borderLeft: `3px solid ${info.color}`,
                      marginBottom: 8,
                      fontFamily: 'JetBrains Mono',
                      fontSize: 10,
                    }}
                  >
                    <div style={{ color: info.color, marginBottom: 4 }}>{entry.event.type}</div>
                    <div style={{ color: '#555' }}>
                      intensity: {entry.event.intensity?.toFixed(2) ?? 'default'}
                    </div>
                    <div style={{ color: '#333', marginTop: 4 }}>
                      {entry.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simulated conversation flow
const ConversationSimulation = () => {
  const [step, setStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [oneShot, setOneShot] = useState<GlyphOneShot | undefined>(undefined);
  const [oneShotNonce, setOneShotNonce] = useState(0);

  const { dimensions, visualState, emit, goTo } = useEmotion({
    initialAnchor: 'idle',
    microExpressions: true,
  });

  const triggerOneShot = (clip: GlyphOneShot) => {
    setOneShot(clip);
    setOneShotNonce((n) => n + 1);
  };

  const conversationSteps = [
    { event: null, label: 'Waiting...', delay: 1000 },
    { event: { type: 'input_received' as const }, label: 'User typing...', delay: 2000 },
    { event: { type: 'processing_start' as const }, label: 'Thinking...', delay: 3000 },
    { event: { type: 'processing_complete' as const }, label: 'Responding...', delay: 2000 },
    { event: { type: 'success' as const }, label: 'Complete!', delay: 2000 },
    { event: { type: 'user_idle' as const }, label: 'Back to idle', delay: 1000 },
  ];

  const runSimulation = async () => {
    setIsRunning(true);
    goTo('idle');
    setStep(0);

    for (let i = 0; i < conversationSteps.length; i++) {
      setStep(i);
      const { event, delay } = conversationSteps[i];
      if (event) {
        emit(event);
        if (event.type === 'processing_complete') triggerOneShot('responding');
        if (event.type === 'success') triggerOneShot('success');
        if (event.type === 'error_occurred') triggerOneShot('error');
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    setIsRunning(false);
  };

  return (
    <div style={{ padding: 32, background: '#0a0a0f', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ fontFamily: 'JetBrains Mono', fontSize: 24, marginBottom: 8 }}>
        Conversation Simulation
      </h1>
      <p style={{ color: '#666', marginBottom: 32, fontFamily: 'system-ui' }}>
        Watch a simulated conversation flow with automatic event emissions
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        <div
          style={{
            width: 360,
            height: 360,
            borderRadius: 16,
            background: '#0a0a0f',
            border: '1px solid #222',
          }}
        >
          <Canvas camera={{ position: [0, 0, 4], fov: 50 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
            <ambientLight intensity={0.25} />
            <pointLight position={[5, 5, 5]} intensity={0.5} color="#ffd700" />
            <pointLight position={[-5, -5, -5]} intensity={0.4} color="#00f0ff" />

            <GlyphObject
              state="idle"
              dimensions={dimensions}
              visualState={visualState}
              enableBlending={true}
              variant="sentinel"
              enableParticles={true}
              oneShot={oneShot}
              oneShotNonce={oneShotNonce}
            />

            <OrbitControls enableDamping dampingFactor={0.05} minDistance={2} maxDistance={10} />
          </Canvas>
        </div>

        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 18 }}>
          {conversationSteps[step]?.label || 'Ready'}
        </div>

        <button
          onClick={runSimulation}
          disabled={isRunning}
          style={{
            padding: '16px 48px',
            background: isRunning ? '#333' : '#10b981',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontFamily: 'JetBrains Mono',
            fontSize: 14,
            cursor: isRunning ? 'not-allowed' : 'pointer',
          }}
        >
          {isRunning ? 'Running...' : '▶ Run Simulation'}
        </button>

        {/* Timeline */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {conversationSteps.map((s, i) => (
            <div
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: i === step ? '#10b981' : i < step ? '#10b98180' : '#333',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const meta: Meta = {
  title: 'Systems/Emotion/Events',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

type Story = StoryObj;

export const Demo: Story = {
  render: () => <EventsDemo />,
};

export const ConversationFlow: Story = {
  render: () => <ConversationSimulation />,
};

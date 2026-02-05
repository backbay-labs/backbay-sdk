import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { useCognition } from '../hooks/useCognition';
import type { CognitionEvent } from '../types';

type EventType = CognitionEvent['type'];

const EVENT_INFO: Record<EventType, { description: string; category: string; color: string; example: string }> = {
  'ui.input_received': {
    description: 'User started typing or interacting',
    category: 'UI Events',
    color: '#06b6d4',
    example: '{ type: "ui.input_received", intensity: 0.5 }',
  },
  'ui.user_idle': {
    description: 'User has stopped interacting',
    category: 'UI Events',
    color: '#6366f1',
    example: '{ type: "ui.user_idle" }',
  },
  'ui.interrupt': {
    description: 'User interrupted current action (barge-in)',
    category: 'UI Events',
    color: '#f97316',
    example: '{ type: "ui.interrupt", intensity: 0.8 }',
  },
  'run.started': {
    description: 'Agent run has begun execution',
    category: 'Run Events',
    color: '#10b981',
    example: '{ type: "run.started", runId: "run_123" }',
  },
  'run.event': {
    description: 'Progress update during run execution',
    category: 'Run Events',
    color: '#84cc16',
    example: '{ type: "run.event", runId: "run_123", status: "tool_call", progress: 0.5 }',
  },
  'run.completed': {
    description: 'Agent run finished (success or failure)',
    category: 'Run Events',
    color: '#8b5cf6',
    example: '{ type: "run.completed", runId: "run_123", success: true }',
  },
  'signals.update': {
    description: 'Update one or more continuous signals',
    category: 'Signal Events',
    color: '#f59e0b',
    example: '{ type: "signals.update", signals: { workload: 0.8, confidence: 0.6 } }',
  },
  'intensity.update': {
    description: 'Alias for signals.update',
    category: 'Signal Events',
    color: '#f59e0b',
    example: '{ type: "intensity.update", values: { attention: 0.9 } }',
  },
  'dynamics.update': {
    description: 'Update dynamics state (kernel integration)',
    category: 'System Events',
    color: '#a855f7',
    example: '{ type: "dynamics.update", dynamics: { potentialV: 0.5 } }',
  },
  'policy.update': {
    description: 'Update policy or personality configuration',
    category: 'System Events',
    color: '#ec4899',
    example: '{ type: "policy.update", policy: { safetyMode: true } }',
  },
  'text.user_message': {
    description: 'User sent a text message (tracks persona drift)',
    category: 'Text Events',
    color: '#14b8a6',
    example: '{ type: "text.user_message", text: "Hello", categories: ["greeting"] }',
  },
  'tick': {
    description: 'Time tick for decay (usually automatic)',
    category: 'System Events',
    color: '#64748b',
    example: '{ type: "tick", deltaMs: 16 }',
  },
};

const EventButton = ({
  event,
  onEmit,
}: {
  event: EventType;
  onEmit: (event: CognitionEvent) => void;
}) => {
  const info = EVENT_INFO[event];

  const createEvent = (): CognitionEvent => {
    switch (event) {
      case 'ui.input_received':
        return { type: 'ui.input_received', intensity: 0.5 };
      case 'ui.user_idle':
        return { type: 'ui.user_idle' };
      case 'ui.interrupt':
        return { type: 'ui.interrupt', intensity: 0.8 };
      case 'run.started':
        return { type: 'run.started', runId: `run_${Date.now()}` };
      case 'run.event':
        return { type: 'run.event', runId: 'run_demo', status: 'tool_call', progress: 0.5 };
      case 'run.completed':
        return { type: 'run.completed', runId: 'run_demo', success: true };
      case 'signals.update':
        return { type: 'signals.update', signals: { workload: 0.7 } };
      case 'intensity.update':
        return { type: 'intensity.update', values: { attention: 0.9 } };
      case 'dynamics.update':
        return { type: 'dynamics.update', dynamics: { potentialV: 0.5, actionRate: 0.3 } };
      case 'policy.update':
        return { type: 'policy.update', policy: { safetyMode: true } };
      case 'text.user_message':
        return { type: 'text.user_message', text: 'Hello!', categories: ['greeting'] };
      case 'tick':
        return { type: 'tick', deltaMs: 1000 };
      default:
        return { type: 'ui.user_idle' };
    }
  };

  return (
    <button
      onClick={() => onEmit(createEvent())}
      style={{
        width: '100%',
        padding: 16,
        background: '#111',
        border: `1px solid #222`,
        borderLeft: `3px solid ${info.color}`,
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
        marginBottom: 8,
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = info.color;
        e.currentTarget.style.background = '#1a1a1a';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#222';
        e.currentTarget.style.borderLeftColor = info.color;
        e.currentTarget.style.background = '#111';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: info.color }}>{event}</span>
        <span
          style={{
            fontSize: 9,
            color: '#666',
            background: '#0a0a0f',
            padding: '2px 8px',
            borderRadius: 4,
          }}
        >
          {info.category}
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>{info.description}</div>
      <code
        style={{
          display: 'block',
          fontSize: 9,
          color: '#555',
          background: '#0a0a0f',
          padding: 8,
          borderRadius: 4,
          overflow: 'auto',
        }}
      >
        {info.example}
      </code>
    </button>
  );
};

const EventsDemo = () => {
  const { state, emotion, handleEvent } = useCognition({
    initial: { mode: 'idle' },
    autoTick: true,
  });

  const [eventLog, setEventLog] = useState<Array<{ time: number; event: CognitionEvent }>>([]);

  const emitEvent = (event: CognitionEvent) => {
    handleEvent(event);
    setEventLog((prev) => [{ time: Date.now(), event }, ...prev.slice(0, 9)]);
  };

  const categories = ['UI Events', 'Run Events', 'Signal Events', 'Text Events', 'System Events'];
  const eventsByCategory = categories.reduce(
    (acc, cat) => {
      acc[cat] = (Object.keys(EVENT_INFO) as EventType[]).filter((e) => EVENT_INFO[e].category === cat);
      return acc;
    },
    {} as Record<string, EventType[]>
  );

  return (
    <div style={{ padding: 40, background: '#0a0a0f', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ fontFamily: 'JetBrains Mono', fontSize: 24, marginBottom: 8 }}>
        Cognition Events
      </h1>
      <p style={{ color: '#666', marginBottom: 32, fontSize: 14 }}>
        Events drive state transitions and signal updates. Click any event to emit it
        and watch the cognition state respond.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 48 }}>
        {/* Event buttons by category */}
        <div>
          {categories.map((category) => (
            <div key={category} style={{ marginBottom: 32 }}>
              <h3
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11,
                  color: '#666',
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                {category}
              </h3>
              {eventsByCategory[category].map((event) => (
                <EventButton key={event} event={event} onEmit={emitEvent} />
              ))}
            </div>
          ))}
        </div>

        {/* Live state & log */}
        <div style={{ position: 'sticky', top: 40 }}>
          {/* Current state */}
          <div style={{ background: '#111', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h3
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 11,
                color: '#666',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              Current State
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>Mode</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: '#06b6d4' }}>
                  {state.mode}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>Anchor</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: '#10b981' }}>
                  {emotion.anchor}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, color: '#666', marginBottom: 8 }}>Key Signals</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { k: 'confidence', v: state.confidence, c: '#10b981' },
                  { k: 'workload', v: state.workload, c: '#f59e0b' },
                  { k: 'errorStress', v: state.errorStress, c: '#ef4444' },
                ].map(({ k, v, c }) => (
                  <div key={k} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 8, color: '#555' }}>{k}</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: c }}>
                      {v.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 9, color: '#666', marginBottom: 8 }}>AVO</div>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}>
                  <span style={{ color: '#f59e0b' }}>A</span> {emotion.avo.arousal.toFixed(2)}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}>
                  <span style={{ color: '#10b981' }}>V</span> {emotion.avo.valence.toFixed(2)}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}>
                  <span style={{ color: '#8b5cf6' }}>O</span> {emotion.avo.openness.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Event log */}
          <div style={{ background: '#111', borderRadius: 12, padding: 20 }}>
            <h3
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 11,
                color: '#666',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              Event Log
            </h3>

            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {eventLog.length === 0 ? (
                <div style={{ fontSize: 11, color: '#444', textAlign: 'center', padding: 20 }}>
                  No events yet. Click an event button to emit.
                </div>
              ) : (
                eventLog.map((entry, i) => (
                  <div
                    key={entry.time}
                    style={{
                      padding: 8,
                      background: i === 0 ? '#1a1a2e' : 'transparent',
                      borderRadius: 4,
                      marginBottom: 4,
                      borderLeft: `2px solid ${EVENT_INFO[entry.event.type].color}`,
                      paddingLeft: 12,
                    }}
                  >
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: EVENT_INFO[entry.event.type].color }}>
                      {entry.event.type}
                    </div>
                    <div style={{ fontSize: 9, color: '#555', marginTop: 2 }}>
                      {JSON.stringify(entry.event).slice(0, 60)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const meta: Meta = {
  title: 'Systems/Cognition/Events',
  component: EventsDemo,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

type Story = StoryObj;

export const Interactive: Story = {
  render: () => <EventsDemo />,
};

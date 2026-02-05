import type { Meta, StoryObj } from '@storybook/react';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  useEmotion,
  ANCHOR_STATES,
  computeVisualState,
  type AnchorState,
  type AVO,
  type EmotionEvent,
} from '../index';

const CATEGORY_COLORS: Record<string, string> = {
  rest: '#6366f1',
  receptive: '#06b6d4',
  processing: '#f59e0b',
  expressive: '#10b981',
  completion: '#84cc16',
  negative: '#ef4444',
  recovery: '#8b5cf6',
};

const STATE_CATEGORIES: Record<string, AnchorState[]> = {
  rest: ['dormant', 'idle'],
  receptive: ['attentive', 'curious', 'listening'],
  processing: ['thinking', 'contemplating', 'focused'],
  expressive: ['responding', 'explaining', 'enthusiastic'],
  completion: ['satisfied', 'proud'],
  negative: ['uncertain', 'concerned', 'struggling', 'alarmed', 'error'],
  recovery: ['recovering', 'relieved'],
};

const Playground = () => {
  const [mode, setMode] = useState<'anchors' | 'manual' | 'events'>('anchors');
  const [manualAVO, setManualAVO] = useState<AVO>({ arousal: 0.5, valence: 0.6, openness: 0.5 });
  const [microExpressionsEnabled, setMicroExpressionsEnabled] = useState(true);
  const [autoTickEnabled, setAutoTickEnabled] = useState(true);
  const [showDebug, setShowDebug] = useState(true);

  const emotion = useEmotion({
    initialAnchor: 'idle',
    microExpressions: microExpressionsEnabled,
    autoTick: autoTickEnabled,
  });

  const { dimensions, visualState, goTo, set, emit, isTransitioning, tick, baseDimensions } = emotion;

  // Manual tick for when autoTick is disabled
  useEffect(() => {
    if (autoTickEnabled) return;
    const interval = setInterval(() => tick(16), 16);
    return () => clearInterval(interval);
  }, [autoTickEnabled, tick]);

  // Update manual AVO
  const handleManualChange = useCallback(
    (dim: keyof AVO, value: number) => {
      const newAVO = { ...manualAVO, [dim]: value };
      setManualAVO(newAVO);
      if (mode === 'manual') {
        set(newAVO);
      }
    },
    [manualAVO, mode, set]
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr 280px',
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
        <h2 style={{ fontSize: 16, marginBottom: 20 }}>Controls</h2>

        {/* Mode selector */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}>
            Mode
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['anchors', 'manual', 'events'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  background: mode === m ? '#1a1a2e' : '#111',
                  border: mode === m ? '1px solid #8b5cf6' : '1px solid #222',
                  borderRadius: 4,
                  color: mode === m ? '#8b5cf6' : '#666',
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Anchor states */}
        {mode === 'anchors' && (
          <div>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 12, textTransform: 'uppercase' }}>
              Anchor States
            </div>
            {Object.entries(STATE_CATEGORIES).map(([category, states]) => (
              <div key={category} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 9,
                    color: CATEGORY_COLORS[category],
                    marginBottom: 6,
                    textTransform: 'uppercase',
                  }}
                >
                  {category}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {states.map((state) => (
                    <button
                      key={state}
                      onClick={() => goTo(state)}
                      style={{
                        padding: '4px 8px',
                        background: '#111',
                        border: '1px solid #222',
                        borderRadius: 4,
                        color: '#888',
                        fontSize: 9,
                        cursor: 'pointer',
                      }}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manual sliders */}
        {mode === 'manual' && (
          <div>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 12, textTransform: 'uppercase' }}>
              Manual AVO
            </div>
            {(['arousal', 'valence', 'openness'] as const).map((dim) => {
              const colors = { arousal: '#f59e0b', valence: '#10b981', openness: '#8b5cf6' };
              return (
                <div key={dim} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: colors[dim] }}>{dim}</span>
                    <span style={{ fontSize: 10 }}>{manualAVO[dim].toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={manualAVO[dim]}
                    onChange={(e) => handleManualChange(dim, parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Events */}
        {mode === 'events' && (
          <div>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 12, textTransform: 'uppercase' }}>
              Emit Events
            </div>
            {(
              [
                'input_received',
                'processing_start',
                'processing_complete',
                'success',
                'error_occurred',
                'user_idle',
                'interrupt',
              ] as EmotionEvent['type'][]
            ).map((type) => (
              <button
                key={type}
                onClick={() => emit({ type })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#111',
                  border: '1px solid #222',
                  borderRadius: 4,
                  color: '#888',
                  fontSize: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginBottom: 4,
                }}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        {/* Settings */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #1a1a24' }}>
          <div style={{ fontSize: 10, color: '#666', marginBottom: 12, textTransform: 'uppercase' }}>
            Settings
          </div>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={microExpressionsEnabled}
              onChange={(e) => setMicroExpressionsEnabled(e.target.checked)}
            />
            <span style={{ fontSize: 11, color: '#888' }}>Micro-expressions</span>
          </label>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={autoTickEnabled}
              onChange={(e) => setAutoTickEnabled(e.target.checked)}
            />
            <span style={{ fontSize: 11, color: '#888' }}>Auto-tick</span>
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
        }}
      >
        {/* Orb */}
        <div
          style={{
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%,
              hsl(${visualState.coreHue}, ${visualState.coreSaturation * 100}%, 65%),
              hsl(${visualState.coreHue}, ${visualState.coreSaturation * 100}%, 35%))`,
            transform: `scale(${visualState.scaleFactor})`,
            boxShadow: `
              0 0 ${visualState.emissiveIntensity * 120}px hsl(${visualState.coreHue}, 70%, 50%),
              0 0 ${visualState.emissiveIntensity * 60}px hsl(${visualState.coreHue}, 80%, 60%),
              inset 0 0 60px rgba(255,255,255,0.15)
            `,
            transition: 'all 0.05s linear',
          }}
        />

        {/* Status */}
        <div
          style={{
            marginTop: 32,
            padding: '12px 24px',
            background: '#111',
            borderRadius: 8,
            fontSize: 11,
            color: isTransitioning ? '#f59e0b' : '#10b981',
          }}
        >
          {isTransitioning ? '● Transitioning' : '○ Stable'}
        </div>

        {/* Mini AVO display */}
        <div
          style={{
            marginTop: 16,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 80px)',
            gap: 16,
            fontSize: 12,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#f59e0b', fontSize: 10, marginBottom: 4 }}>Arousal</div>
            <div>{dimensions.arousal.toFixed(3)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#10b981', fontSize: 10, marginBottom: 4 }}>Valence</div>
            <div>{dimensions.valence.toFixed(3)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#8b5cf6', fontSize: 10, marginBottom: 4 }}>Openness</div>
            <div>{dimensions.openness.toFixed(3)}</div>
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

          {/* Base dimensions */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#666', marginBottom: 8, textTransform: 'uppercase' }}>
              Base Dimensions
            </div>
            <div style={{ background: '#111', padding: 8, borderRadius: 4 }}>
              <div>A: {baseDimensions.arousal.toFixed(4)}</div>
              <div>V: {baseDimensions.valence.toFixed(4)}</div>
              <div>O: {baseDimensions.openness.toFixed(4)}</div>
            </div>
          </div>

          {/* Animated dimensions */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#666', marginBottom: 8, textTransform: 'uppercase' }}>
              Animated (w/ Micro)
            </div>
            <div style={{ background: '#111', padding: 8, borderRadius: 4 }}>
              <div>A: {dimensions.arousal.toFixed(4)}</div>
              <div>V: {dimensions.valence.toFixed(4)}</div>
              <div>O: {dimensions.openness.toFixed(4)}</div>
            </div>
          </div>

          {/* Visual State */}
          <div>
            <div style={{ color: '#666', marginBottom: 8, textTransform: 'uppercase' }}>
              Visual State
            </div>
            <div style={{ background: '#111', padding: 8, borderRadius: 4, lineHeight: 1.8 }}>
              {Object.entries(visualState).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>{key}</span>
                  <span>{typeof value === 'number' ? value.toFixed(2) : value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const meta: Meta = {
  title: 'Systems/Emotion/Playground',
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

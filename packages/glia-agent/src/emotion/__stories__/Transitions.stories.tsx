import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect, useRef } from 'react';
import {
  useEmotion,
  ANCHOR_STATES,
  avoDistance,
  getTransitionConfig,
  ease,
  type AnchorState,
  type EasingFunction,
} from '../index';
import { EASING_FUNCTIONS } from '../transitions';

// Transition sequence for demo
const DEMO_SEQUENCES: Record<string, AnchorState[]> = {
  conversation: ['idle', 'listening', 'thinking', 'responding', 'satisfied', 'idle'],
  errorRecovery: ['focused', 'struggling', 'alarmed', 'error', 'recovering', 'relieved', 'idle'],
  excitement: ['idle', 'attentive', 'curious', 'enthusiastic', 'proud', 'satisfied'],
  deepWork: ['idle', 'attentive', 'focused', 'contemplating', 'focused', 'satisfied'],
};

const TransitionDemo = () => {
  const [sequence, setSequence] = useState<AnchorState[]>(DEMO_SEQUENCES.conversation);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState<{ from: AnchorState; to: AnchorState; duration: number }[]>([]);

  const { dimensions, visualState, goTo, isTransitioning } = useEmotion({
    initialAnchor: sequence[0],
    microExpressions: true,
  });

  const timeoutRef = useRef<NodeJS.Timeout>();

  const playSequence = () => {
    setIsPlaying(true);
    setCurrentIndex(0);
    setHistory([]);
    goTo(sequence[0]);
  };

  useEffect(() => {
    if (!isPlaying) return;

    if (currentIndex < sequence.length - 1) {
      const from = sequence[currentIndex];
      const to = sequence[currentIndex + 1];
      const config = getTransitionConfig(ANCHOR_STATES[from], ANCHOR_STATES[to]);

      timeoutRef.current = setTimeout(() => {
        goTo(to);
        setHistory((prev) => [...prev, { from, to, duration: config.duration }]);
        setCurrentIndex((i) => i + 1);
      }, config.duration + 500); // Add pause between transitions
    } else {
      setIsPlaying(false);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isPlaying, currentIndex, sequence, goTo]);

  return (
    <div style={{ padding: 32, background: '#0a0a0f', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ fontFamily: 'JetBrains Mono', fontSize: 24, marginBottom: 8 }}>
        Transitions
      </h1>
      <p style={{ color: '#666', marginBottom: 32, fontFamily: 'system-ui' }}>
        Watch smooth transitions between emotional states with auto-calculated timing
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 40 }}>
        {/* Main visualization */}
        <div>
          {/* Orb */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: 60,
              background: '#111',
              borderRadius: 16,
              marginBottom: 24,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 30% 30%,
                    hsl(${visualState.coreHue}, ${visualState.coreSaturation * 100}%, 65%),
                    hsl(${visualState.coreHue}, ${visualState.coreSaturation * 100}%, 35%))`,
                  transform: `scale(${visualState.scaleFactor})`,
                  boxShadow: `
                    0 0 ${visualState.emissiveIntensity * 80}px hsl(${visualState.coreHue}, 70%, 50%),
                    inset 0 0 40px rgba(255,255,255,0.2)
                  `,
                  margin: '0 auto 20px',
                  transition: 'all 0.05s linear',
                }}
              />
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 18 }}>
                {sequence[currentIndex]}
              </div>
              <div
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11,
                  color: isTransitioning ? '#f59e0b' : '#555',
                  marginTop: 8,
                }}
              >
                {isTransitioning ? '● Transitioning...' : '○ Stable'}
              </div>
            </div>
          </div>

          {/* Sequence selector */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8, fontFamily: 'JetBrains Mono' }}>
              Select Sequence:
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(DEMO_SEQUENCES).map(([name, seq]) => (
                <button
                  key={name}
                  onClick={() => {
                    setSequence(seq);
                    setCurrentIndex(0);
                    setIsPlaying(false);
                    goTo(seq[0]);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: sequence === seq ? '#1a1a2e' : '#111',
                    border: sequence === seq ? '1px solid #8b5cf6' : '1px solid #333',
                    borderRadius: 6,
                    color: sequence === seq ? '#8b5cf6' : '#888',
                    fontFamily: 'JetBrains Mono',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Play button */}
          <button
            onClick={playSequence}
            disabled={isPlaying}
            style={{
              padding: '12px 32px',
              background: isPlaying ? '#333' : '#10b981',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontFamily: 'JetBrains Mono',
              fontSize: 14,
              cursor: isPlaying ? 'not-allowed' : 'pointer',
            }}
          >
            {isPlaying ? 'Playing...' : '▶ Play Sequence'}
          </button>

          {/* Timeline */}
          <div style={{ marginTop: 32 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 12, fontFamily: 'JetBrains Mono' }}>
              Sequence Timeline:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {sequence.map((state, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      padding: '6px 12px',
                      background: i === currentIndex ? '#1a1a2e' : '#111',
                      border: i === currentIndex ? '1px solid #8b5cf6' : '1px solid #222',
                      borderRadius: 4,
                      color: i <= currentIndex ? '#fff' : '#555',
                      fontFamily: 'JetBrains Mono',
                      fontSize: 10,
                    }}
                  >
                    {state}
                  </div>
                  {i < sequence.length - 1 && (
                    <span style={{ color: '#333', margin: '0 4px' }}>→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Transition history */}
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
            Transition Log
          </h3>
          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            {history.length === 0 ? (
              <div style={{ color: '#444', fontFamily: 'JetBrains Mono', fontSize: 11 }}>
                Press play to see transitions...
              </div>
            ) : (
              history.map((h, i) => (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    background: '#111',
                    borderRadius: 6,
                    marginBottom: 8,
                    fontFamily: 'JetBrains Mono',
                    fontSize: 11,
                  }}
                >
                  <div style={{ color: '#888', marginBottom: 4 }}>#{i + 1}</div>
                  <div>
                    <span style={{ color: '#f59e0b' }}>{h.from}</span>
                    <span style={{ color: '#555' }}> → </span>
                    <span style={{ color: '#10b981' }}>{h.to}</span>
                  </div>
                  <div style={{ color: '#555', marginTop: 4 }}>{h.duration}ms</div>
                </div>
              ))
            )}
          </div>

          {/* Current AVO */}
          <div style={{ marginTop: 24 }}>
            <h3
              style={{
                fontFamily: 'JetBrains Mono',
                fontSize: 12,
                color: '#888',
                marginBottom: 12,
                textTransform: 'uppercase',
              }}
            >
              Current AVO
            </h3>
            <div
              style={{
                padding: 12,
                background: '#111',
                borderRadius: 6,
                fontFamily: 'JetBrains Mono',
                fontSize: 12,
              }}
            >
              <div>A: {dimensions.arousal.toFixed(3)}</div>
              <div>V: {dimensions.valence.toFixed(3)}</div>
              <div>O: {dimensions.openness.toFixed(3)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Easing function visualizer
const EasingVisualizer = () => {
  const easings: EasingFunction[] = ['linear', 'easeIn', 'easeOut', 'easeInOut', 'spring'];
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => (p >= 1 ? 0 : p + 0.01));
    }, 20);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: 32, background: '#0a0a0f', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ fontFamily: 'JetBrains Mono', fontSize: 24, marginBottom: 32 }}>
        Easing Functions
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 24 }}>
        {easings.map((easing) => {
          const easedValue = EASING_FUNCTIONS[easing](progress);
          return (
            <div key={easing} style={{ textAlign: 'center' }}>
              <div
                style={{
                  height: 200,
                  background: '#111',
                  borderRadius: 8,
                  position: 'relative',
                  overflow: 'hidden',
                  marginBottom: 12,
                }}
              >
                {/* Curve visualization */}
                <svg width="100%" height="100%" style={{ position: 'absolute' }}>
                  <path
                    d={Array.from({ length: 100 }, (_, i) => {
                      const t = i / 99;
                      const y = 200 - EASING_FUNCTIONS[easing](t) * 180 - 10;
                      return `${i === 0 ? 'M' : 'L'} ${(t * 100).toFixed(1)}% ${y.toFixed(1)}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                  />
                </svg>
                {/* Progress indicator */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${progress * 100}%`,
                    bottom: easedValue * 180 + 10,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#10b981',
                    transform: 'translate(-50%, 50%)',
                  }}
                />
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{easing}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const meta: Meta = {
  title: 'Systems/Emotion/Transitions',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

type Story = StoryObj;

export const Demo: Story = {
  render: () => <TransitionDemo />,
};

export const EasingFunctions: Story = {
  render: () => <EasingVisualizer />,
};

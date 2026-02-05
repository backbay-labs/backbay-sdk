import type { Meta, StoryObj } from '@storybook/react';
import { useEmotion, ANCHOR_STATES, type AnchorState } from '../index';

/**
 * # Glyph Emotion System
 *
 * A psychology-grounded dimensional model for agent emotional expression,
 * based on Russell's Circumplex Model of Affect.
 *
 * ## The AVO Model
 *
 * Three continuous dimensions (0-1 range):
 *
 * - **Arousal (A)**: Energy/activation level (dormant → intense)
 * - **Valence (V)**: Positivity/confidence (distressed → elated)
 * - **Openness (O)**: Input/output direction (receptive → expressive)
 *
 * ## Stories
 *
 * Explore the different aspects of the emotion system:
 *
 * - **Overview**: Quick introduction and live demo
 * - **Anchor States**: Gallery of all 17 named emotional configurations
 * - **Dimensions**: Interactive sliders to explore AVO space
 * - **Transitions**: Watch smooth state changes with auto-calculated timing
 * - **Events**: Trigger state changes via semantic events
 * - **Visual Mapping**: How AVO maps to visual properties
 * - **Playground**: Full interactive sandbox
 */

const Overview = () => {
  const { dimensions, visualState, goTo, isTransitioning } = useEmotion({
    initialAnchor: 'idle',
    microExpressions: true,
  });

  const quickStates: AnchorState[] = ['idle', 'listening', 'thinking', 'responding', 'satisfied', 'error'];

  return (
    <div style={{ padding: 40, background: '#0a0a0f', minHeight: '100vh', color: '#fff' }}>
      {/* Header */}
      <div style={{ maxWidth: 800, marginBottom: 48 }}>
        <h1
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 32,
            marginBottom: 16,
            background: 'linear-gradient(135deg, #f59e0b, #10b981, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Glyph Emotion System
        </h1>
        <p style={{ color: '#888', fontSize: 16, lineHeight: 1.6, fontFamily: 'system-ui' }}>
          A psychology-grounded dimensional model for agent emotional expression. Built on Russell's
          Circumplex Model of Affect, the system provides smooth transitions between 17 named anchor
          states with micro-expressions for natural liveliness.
        </p>
      </div>

      {/* Main demo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, maxWidth: 1000 }}>
        {/* Live orb */}
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
                inset 0 0 40px rgba(255,255,255,0.15)
              `,
              marginBottom: 24,
              transition: 'all 0.1s ease-out',
            }}
          />

          {/* Quick state buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {quickStates.map((state) => (
              <button
                key={state}
                onClick={() => goTo(state)}
                style={{
                  padding: '8px 16px',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: 6,
                  color: '#888',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#8b5cf6';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#333';
                  e.currentTarget.style.color = '#888';
                }}
              >
                {state}
              </button>
            ))}
          </div>

          <div
            style={{
              marginTop: 16,
              fontSize: 11,
              fontFamily: 'JetBrains Mono',
              color: isTransitioning ? '#f59e0b' : '#555',
            }}
          >
            {isTransitioning ? '● Transitioning' : '○ Stable'}
          </div>
        </div>

        {/* Info panel */}
        <div>
          {/* AVO dimensions */}
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
              Current Dimensions
            </h3>

            {/* Arousal */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#f59e0b' }}>
                  Arousal
                </span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>
                  {dimensions.arousal.toFixed(2)}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: '#222',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${dimensions.arousal * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #f59e0b55, #f59e0b)',
                    transition: 'width 0.1s',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 9,
                  color: '#444',
                  marginTop: 4,
                }}
              >
                <span>Dormant</span>
                <span>Intense</span>
              </div>
            </div>

            {/* Valence */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#10b981' }}>
                  Valence
                </span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>
                  {dimensions.valence.toFixed(2)}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: '#222',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${dimensions.valence * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b98155, #10b981)',
                    transition: 'width 0.1s',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 9,
                  color: '#444',
                  marginTop: 4,
                }}
              >
                <span>Distressed</span>
                <span>Elated</span>
              </div>
            </div>

            {/* Openness */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#8b5cf6' }}>
                  Openness
                </span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>
                  {dimensions.openness.toFixed(2)}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: '#222',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${dimensions.openness * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #8b5cf655, #8b5cf6)',
                    transition: 'width 0.1s',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 9,
                  color: '#444',
                  marginTop: 4,
                }}
              >
                <span>Receptive</span>
                <span>Expressive</span>
              </div>
            </div>
          </div>

          {/* Visual properties preview */}
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
              Visual Output
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
                <span style={{ color: '#666' }}>coreHue</span>
                <span>{visualState.coreHue.toFixed(0)}°</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#666' }}>breathingRate</span>
                <span>{visualState.breathingRate.toFixed(2)} Hz</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#666' }}>emissiveIntensity</span>
                <span>{visualState.emissiveIntensity.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>particleFlow</span>
                <span>{visualState.particleFlowDirection > 0 ? 'outward' : 'inward'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 48 }}>
        {[
          {
            title: '17 Anchor States',
            description: 'Named emotional configurations like idle, thinking, responding, error',
            color: '#06b6d4',
          },
          {
            title: 'Smooth Transitions',
            description: 'Auto-calculated duration and easing based on AVO distance',
            color: '#f59e0b',
          },
          {
            title: 'Micro-expressions',
            description: 'Perlin-like noise adds subtle natural movement',
            color: '#10b981',
          },
          {
            title: 'Event System',
            description: 'Emit semantic events that map to appropriate states',
            color: '#8b5cf6',
          },
          {
            title: 'Visual Mapping',
            description: 'AVO dimensions drive animation, color, particles, and scale',
            color: '#ec4899',
          },
          {
            title: 'React Hook',
            description: 'useEmotion() provides reactive state with auto-tick',
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
  title: 'Systems/Emotion/Overview',
  component: Overview,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component: `
# Glyph Emotion System

A psychology-grounded dimensional model for agent emotional expression.

## Installation

\`\`\`tsx
import { useEmotion, ANCHOR_STATES } from '@backbay/bb-ui';
\`\`\`

## Basic Usage

\`\`\`tsx
const { dimensions, visualState, goTo, emit } = useEmotion({
  initialAnchor: 'idle',
  microExpressions: true,
});

// Transition to named state
goTo('thinking');

// Emit semantic event
emit({ type: 'error_occurred', intensity: 0.8 });
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

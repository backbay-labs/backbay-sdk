import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import { useEmotion, ANCHOR_STATES, computeVisualState, type AnchorState, type AVO } from '../index';

// Group anchor states by category
const STATE_CATEGORIES = {
  rest: ['dormant', 'idle'] as AnchorState[],
  receptive: ['attentive', 'curious', 'listening'] as AnchorState[],
  processing: ['thinking', 'contemplating', 'focused'] as AnchorState[],
  expressive: ['responding', 'explaining', 'enthusiastic'] as AnchorState[],
  completion: ['satisfied', 'proud'] as AnchorState[],
  negative: ['uncertain', 'concerned', 'struggling', 'alarmed', 'error'] as AnchorState[],
  recovery: ['recovering', 'relieved'] as AnchorState[],
};

const CATEGORY_COLORS: Record<string, string> = {
  rest: '#6366f1',
  receptive: '#06b6d4',
  processing: '#f59e0b',
  expressive: '#10b981',
  completion: '#84cc16',
  negative: '#ef4444',
  recovery: '#8b5cf6',
};

interface OrbPreviewProps {
  avo: AVO;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const OrbPreview = ({ avo, label, isActive, onClick }: OrbPreviewProps) => {
  const visual = computeVisualState(avo);

  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: isActive ? '2px solid #fff' : '2px solid transparent',
        borderRadius: 12,
        padding: 12,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.2s',
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%,
            hsl(${visual.coreHue}, ${visual.coreSaturation * 100}%, 65%),
            hsl(${visual.coreHue}, ${visual.coreSaturation * 100}%, 35%))`,
          transform: `scale(${visual.scaleFactor})`,
          boxShadow: `
            0 0 ${visual.emissiveIntensity * 30}px hsl(${visual.coreHue}, 70%, 50%),
            inset 0 0 20px rgba(255,255,255,0.2)
          `,
          transition: 'all 0.3s ease',
        }}
      />
      <span
        style={{
          fontSize: 10,
          fontFamily: 'JetBrains Mono, monospace',
          color: isActive ? '#fff' : '#888',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 8,
          fontFamily: 'JetBrains Mono, monospace',
          color: '#555',
        }}
      >
        A:{avo.arousal.toFixed(2)} V:{avo.valence.toFixed(2)} O:{avo.openness.toFixed(2)}
      </span>
    </button>
  );
};

const AnchorStatesGallery = () => {
  const [selectedState, setSelectedState] = useState<AnchorState>('idle');
  const { dimensions, visualState, goTo } = useEmotion({
    initialAnchor: 'idle',
    microExpressions: true,
  });

  const handleSelect = (state: AnchorState) => {
    setSelectedState(state);
    goTo(state);
  };

  return (
    <div style={{ padding: 24, background: '#0a0a0f', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ fontFamily: 'JetBrains Mono', fontSize: 24, marginBottom: 8 }}>
        Anchor States
      </h1>
      <p style={{ color: '#666', marginBottom: 32, fontFamily: 'system-ui' }}>
        17 named emotional configurations across the AVO dimensional space
      </p>

      {/* Live preview */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 40,
          padding: 40,
          background: '#111',
          borderRadius: 16,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              margin: '0 auto 20px',
              background: `radial-gradient(circle at 30% 30%,
                hsl(${visualState.coreHue}, ${visualState.coreSaturation * 100}%, 65%),
                hsl(${visualState.coreHue}, ${visualState.coreSaturation * 100}%, 35%))`,
              transform: `scale(${visualState.scaleFactor})`,
              boxShadow: `
                0 0 ${visualState.emissiveIntensity * 60}px hsl(${visualState.coreHue}, 70%, 50%),
                inset 0 0 30px rgba(255,255,255,0.2)
              `,
              transition: 'all 0.4s ease',
            }}
          />
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 18, marginBottom: 8 }}>
            {selectedState}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#666' }}>
            A: {dimensions.arousal.toFixed(3)} | V: {dimensions.valence.toFixed(3)} | O: {dimensions.openness.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Categories */}
      {Object.entries(STATE_CATEGORIES).map(([category, states]) => (
        <div key={category} style={{ marginBottom: 32 }}>
          <h3
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: CATEGORY_COLORS[category],
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: `1px solid ${CATEGORY_COLORS[category]}33`,
            }}
          >
            {category}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {states.map((state) => (
              <OrbPreview
                key={state}
                avo={ANCHOR_STATES[state]}
                label={state}
                isActive={selectedState === state}
                onClick={() => handleSelect(state)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Individual state stories for documentation
const SingleStateDemo = ({ state }: { state: AnchorState }) => {
  const avo = ANCHOR_STATES[state];
  const visual = computeVisualState(avo);

  return (
    <div
      style={{
        padding: 40,
        background: '#0a0a0f',
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
      }}
    >
      <div
        style={{
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%,
            hsl(${visual.coreHue}, ${visual.coreSaturation * 100}%, 65%),
            hsl(${visual.coreHue}, ${visual.coreSaturation * 100}%, 35%))`,
          transform: `scale(${visual.scaleFactor})`,
          boxShadow: `
            0 0 ${visual.emissiveIntensity * 80}px hsl(${visual.coreHue}, 70%, 50%),
            inset 0 0 40px rgba(255,255,255,0.2)
          `,
          marginBottom: 24,
        }}
      />
      <h2 style={{ fontFamily: 'JetBrains Mono', fontSize: 24, marginBottom: 8 }}>
        {state}
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          marginTop: 16,
          fontFamily: 'JetBrains Mono',
          fontSize: 12,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#f59e0b', marginBottom: 4 }}>Arousal</div>
          <div>{avo.arousal.toFixed(2)}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#10b981', marginBottom: 4 }}>Valence</div>
          <div>{avo.valence.toFixed(2)}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#8b5cf6', marginBottom: 4 }}>Openness</div>
          <div>{avo.openness.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

const meta: Meta = {
  title: 'Systems/Emotion/Anchor States',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

type Story = StoryObj;

export const Gallery: Story = {
  render: () => <AnchorStatesGallery />,
};

export const Idle: Story = {
  render: () => <SingleStateDemo state="idle" />,
};

export const Listening: Story = {
  render: () => <SingleStateDemo state="listening" />,
};

export const Thinking: Story = {
  render: () => <SingleStateDemo state="thinking" />,
};

export const Responding: Story = {
  render: () => <SingleStateDemo state="responding" />,
};

export const Enthusiastic: Story = {
  render: () => <SingleStateDemo state="enthusiastic" />,
};

export const Error: Story = {
  render: () => <SingleStateDemo state="error" />,
};

export const Satisfied: Story = {
  render: () => <SingleStateDemo state="satisfied" />,
};

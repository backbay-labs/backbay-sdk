import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  ANCHOR_STATES,
  type AnchorState,
  type LegacyGlyphState,
} from '../index';
import { GlyphObject } from '../../primitives/three/Glyph';

// Full demo with controls
const Glyph3DDemo = () => {
  const [legacyState, setLegacyState] = useState<LegacyGlyphState>('idle');
  const [selectedAnchor, setSelectedAnchor] = useState<AnchorState | null>(null);

  const legacyStates: LegacyGlyphState[] = ['idle', 'listening', 'thinking', 'responding', 'success', 'error', 'sleep'];
  const anchors = Object.keys(ANCHOR_STATES) as AnchorState[];

  return (
    <div style={{ width: '100%', height: '100vh', background: '#0a0a0f', display: 'flex' }}>
      {/* 3D Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          camera={{ position: [0, 0, 4], fov: 50 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.25} />
          <pointLight position={[5, 5, 5]} intensity={0.5} color="#ffd700" />
          <pointLight position={[-5, -5, -5]} intensity={0.4} color="#00f0ff" />

          <GlyphObject
            state={legacyState}
            anchor={selectedAnchor ?? undefined}
            enableBlending={true}
            variant="sentinel"
          />

          <OrbitControls enableDamping dampingFactor={0.05} minDistance={2} maxDistance={10} />
        </Canvas>
      </div>

      {/* Control panel */}
      <div
        style={{
          width: 280,
          background: '#111',
          borderLeft: '1px solid #222',
          padding: 20,
          overflow: 'auto',
          fontFamily: 'JetBrains Mono, monospace',
          color: '#fff',
        }}
      >
        <h2 style={{ fontSize: 16, marginBottom: 20 }}>Glyph 3D Demo</h2>

        {/* Legacy states (trigger baked animations) */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 8, textTransform: 'uppercase' }}>
            Baked Animations
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {legacyStates.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setLegacyState(s);
                  setSelectedAnchor(null);
                }}
                style={{
                  padding: '6px 10px',
                  background: legacyState === s && !selectedAnchor ? '#1a1a2e' : '#1a1a1a',
                  border: legacyState === s && !selectedAnchor ? '1px solid #8b5cf6' : '1px solid #333',
                  borderRadius: 4,
                  color: legacyState === s && !selectedAnchor ? '#8b5cf6' : '#888',
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Anchor states (AVO-driven) */}
        <div>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 8, textTransform: 'uppercase' }}>
            AVO Anchor States
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 400, overflow: 'auto' }}>
            {anchors.map((anchor) => {
              const avo = ANCHOR_STATES[anchor];
              return (
                <button
                  key={anchor}
                  onClick={() => setSelectedAnchor(anchor)}
                  style={{
                    padding: '6px 10px',
                    background: selectedAnchor === anchor ? '#1a1a2e' : '#1a1a1a',
                    border: selectedAnchor === anchor ? '1px solid #10b981' : '1px solid #333',
                    borderRadius: 4,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ color: selectedAnchor === anchor ? '#10b981' : '#888', fontSize: 10 }}>
                    {anchor}
                  </div>
                  <div style={{ color: '#555', fontSize: 8, marginTop: 2 }}>
                    A:{avo.arousal.toFixed(2)} V:{avo.valence.toFixed(2)} O:{avo.openness.toFixed(2)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 24, padding: 12, background: '#0a0a0f', borderRadius: 6, fontSize: 10, color: '#666' }}>
          <strong style={{ color: '#888' }}>How it works:</strong>
          <br /><br />
          <strong style={{ color: '#f59e0b' }}>Baked Animations:</strong> Blend pre-authored Blender clips (Root, Core, Rings) by AVO proximity
          <br /><br />
          <strong style={{ color: '#10b981' }}>AVO System:</strong> Procedural color, emissive, scale, breathing rate controlled by Arousal/Valence/Openness
        </div>
      </div>
    </div>
  );
};

const meta: Meta = {
  title: 'Systems/Emotion/Glyph 3D',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

type Story = StoryObj;

export const Interactive: Story = {
  render: () => <Glyph3DDemo />,
};

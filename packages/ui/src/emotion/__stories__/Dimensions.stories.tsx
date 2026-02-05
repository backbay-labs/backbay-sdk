import type { Meta, StoryObj } from '@storybook/react';
import { useState, useCallback } from 'react';
import { computeVisualState, type AVO, type VisualState } from '../index';

interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
  description: string;
  lowLabel: string;
  highLabel: string;
}

const DimensionSlider = ({
  label,
  value,
  onChange,
  color,
  description,
  lowLabel,
  highLabel,
}: SliderProps) => (
  <div style={{ marginBottom: 32 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontFamily: 'JetBrains Mono', color, fontWeight: 600 }}>
        {label}
      </span>
      <span style={{ fontFamily: 'JetBrains Mono', color: '#888' }}>
        {value.toFixed(2)}
      </span>
    </div>
    <div style={{ position: 'relative', marginBottom: 8 }}>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          height: 8,
          appearance: 'none',
          background: `linear-gradient(to right, ${color}33, ${color})`,
          borderRadius: 4,
          outline: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 10,
        color: '#555',
        fontFamily: 'JetBrains Mono',
      }}
    >
      <span>{lowLabel}</span>
      <span>{highLabel}</span>
    </div>
    <p style={{ color: '#666', fontSize: 12, marginTop: 8, fontFamily: 'system-ui' }}>
      {description}
    </p>
  </div>
);

interface VisualPropertyProps {
  label: string;
  value: number | string;
  unit?: string;
}

const VisualProperty = ({ label, value, unit = '' }: VisualPropertyProps) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 0',
      borderBottom: '1px solid #222',
      fontFamily: 'JetBrains Mono',
      fontSize: 11,
    }}
  >
    <span style={{ color: '#888' }}>{label}</span>
    <span style={{ color: '#fff' }}>
      {typeof value === 'number' ? value.toFixed(2) : value}
      {unit}
    </span>
  </div>
);

const DimensionsExplorer = () => {
  const [avo, setAvo] = useState<AVO>({ arousal: 0.5, valence: 0.5, openness: 0.5 });
  const visual = computeVisualState(avo);

  const updateDimension = useCallback((dim: keyof AVO, value: number) => {
    setAvo((prev) => ({ ...prev, [dim]: value }));
  }, []);

  return (
    <div style={{ padding: 32, background: '#0a0a0f', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ fontFamily: 'JetBrains Mono', fontSize: 24, marginBottom: 8 }}>
        AVO Dimensions
      </h1>
      <p style={{ color: '#666', marginBottom: 40, fontFamily: 'system-ui' }}>
        Explore how Arousal, Valence, and Openness map to visual properties
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40 }}>
        {/* Left: Sliders */}
        <div>
          <DimensionSlider
            label="Arousal"
            value={avo.arousal}
            onChange={(v) => updateDimension('arousal', v)}
            color="#f59e0b"
            description="Energy/activation level. Affects animation speed, particle count, breathing rate."
            lowLabel="Dormant"
            highLabel="Intense"
          />

          <DimensionSlider
            label="Valence"
            value={avo.valence}
            onChange={(v) => updateDimension('valence', v)}
            color="#10b981"
            description="Positivity/confidence. Affects color warmth, motion smoothness, scale."
            lowLabel="Distressed"
            highLabel="Elated"
          />

          <DimensionSlider
            label="Openness"
            value={avo.openness}
            onChange={(v) => updateDimension('openness', v)}
            color="#8b5cf6"
            description="Input/output direction. Affects particle flow, breathing phase, aura expansion."
            lowLabel="Receptive"
            highLabel="Expressive"
          />
        </div>

        {/* Center: Live orb preview */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: 180,
              height: 180,
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
              transition: 'all 0.15s ease-out',
            }}
          />

          {/* Mini coordinate display */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              fontFamily: 'JetBrains Mono',
              fontSize: 12,
              padding: 16,
              background: '#111',
              borderRadius: 8,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#f59e0b', marginBottom: 4 }}>A</div>
              <div>{avo.arousal.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#10b981', marginBottom: 4 }}>V</div>
              <div>{avo.valence.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#8b5cf6', marginBottom: 4 }}>O</div>
              <div>{avo.openness.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Right: Visual properties */}
        <div>
          <h3
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 12,
              color: '#f59e0b',
              marginBottom: 16,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Arousal → Temporal
          </h3>
          <VisualProperty label="breathingRate" value={visual.breathingRate} unit=" Hz" />
          <VisualProperty label="breathingAmplitude" value={visual.breathingAmplitude} />
          <VisualProperty label="ringRotationSpeed" value={visual.ringRotationSpeed} unit=" rad/s" />
          <VisualProperty label="particleVelocity" value={visual.particleVelocity} />
          <VisualProperty label="particleCount" value={visual.particleCount} />
          <VisualProperty label="glowPulseRate" value={visual.glowPulseRate} unit=" Hz" />

          <h3
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 12,
              color: '#10b981',
              marginTop: 24,
              marginBottom: 16,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Valence → Qualitative
          </h3>
          <VisualProperty label="coreHue" value={visual.coreHue} unit="°" />
          <VisualProperty label="coreSaturation" value={visual.coreSaturation} />
          <VisualProperty label="motionNoise" value={visual.motionNoise} />
          <VisualProperty label="scaleFactor" value={visual.scaleFactor} unit="x" />
          <VisualProperty label="emissiveIntensity" value={visual.emissiveIntensity} />

          <h3
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 12,
              color: '#8b5cf6',
              marginTop: 24,
              marginBottom: 16,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Openness → Spatial
          </h3>
          <VisualProperty label="particleFlowDirection" value={visual.particleFlowDirection} />
          <VisualProperty label="particleSpreadAngle" value={visual.particleSpreadAngle} unit="°" />
          <VisualProperty label="breathingPhaseBias" value={visual.breathingPhaseBias} />
          <VisualProperty label="ringTilt" value={visual.ringTilt} unit="°" />
          <VisualProperty label="auraExpansion" value={visual.auraExpansion} unit="x" />

          <h3
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 12,
              color: '#fff',
              marginTop: 24,
              marginBottom: 16,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Combined
          </h3>
          <VisualProperty label="overallIntensity" value={visual.overallIntensity} />
        </div>
      </div>
    </div>
  );
};

// Isolated dimension stories
const ArousalDemo = () => {
  const [arousal, setArousal] = useState(0.5);
  const visual = computeVisualState({ arousal, valence: 0.6, openness: 0.5 });

  return (
    <div style={{ padding: 40, background: '#0a0a0f', minHeight: 500, color: '#fff' }}>
      <h2 style={{ fontFamily: 'JetBrains Mono', marginBottom: 24 }}>
        Arousal: Energy Level
      </h2>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={arousal}
        onChange={(e) => setArousal(parseFloat(e.target.value))}
        style={{ width: '100%', marginBottom: 24 }}
      />
      <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: `hsl(${visual.coreHue}, ${visual.coreSaturation * 100}%, 50%)`,
            boxShadow: `0 0 ${visual.emissiveIntensity * 60}px hsl(${visual.coreHue}, 70%, 50%)`,
            animation: `pulse ${1 / visual.breathingRate}s ease-in-out infinite`,
          }}
        />
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>
          <p>Arousal: {arousal.toFixed(2)}</p>
          <p style={{ color: '#888' }}>Breathing: {visual.breathingRate.toFixed(2)} Hz</p>
          <p style={{ color: '#888' }}>Particles: {visual.particleCount}</p>
        </div>
      </div>
    </div>
  );
};

const ValenceDemo = () => {
  const [valence, setValence] = useState(0.5);
  const visual = computeVisualState({ arousal: 0.5, valence, openness: 0.5 });

  return (
    <div style={{ padding: 40, background: '#0a0a0f', minHeight: 500, color: '#fff' }}>
      <h2 style={{ fontFamily: 'JetBrains Mono', marginBottom: 24 }}>
        Valence: Sentiment/Confidence
      </h2>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={valence}
        onChange={(e) => setValence(parseFloat(e.target.value))}
        style={{ width: '100%', marginBottom: 24 }}
      />
      <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%,
              hsl(${visual.coreHue}, ${visual.coreSaturation * 100}%, 65%),
              hsl(${visual.coreHue}, ${visual.coreSaturation * 100}%, 35%))`,
            transform: `scale(${visual.scaleFactor})`,
            boxShadow: `0 0 ${visual.emissiveIntensity * 60}px hsl(${visual.coreHue}, 70%, 50%)`,
            transition: 'all 0.2s',
          }}
        />
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>
          <p>Valence: {valence.toFixed(2)}</p>
          <p style={{ color: '#888' }}>Hue: {visual.coreHue.toFixed(0)}° (Blue→Gold)</p>
          <p style={{ color: '#888' }}>Scale: {visual.scaleFactor.toFixed(2)}x</p>
          <p style={{ color: '#888' }}>Noise: {visual.motionNoise.toFixed(3)}</p>
        </div>
      </div>
    </div>
  );
};

const OpennessDemo = () => {
  const [openness, setOpenness] = useState(0.5);
  const visual = computeVisualState({ arousal: 0.5, valence: 0.6, openness });

  return (
    <div style={{ padding: 40, background: '#0a0a0f', minHeight: 500, color: '#fff' }}>
      <h2 style={{ fontFamily: 'JetBrains Mono', marginBottom: 24 }}>
        Openness: Input/Output Direction
      </h2>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={openness}
        onChange={(e) => setOpenness(parseFloat(e.target.value))}
        style={{ width: '100%', marginBottom: 24 }}
      />
      <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
        <div
          style={{
            width: 120 * visual.auraExpansion,
            height: 120 * visual.auraExpansion,
            borderRadius: '50%',
            background: `hsl(${visual.coreHue}, ${visual.coreSaturation * 100}%, 50%)`,
            boxShadow: `0 0 ${visual.emissiveIntensity * 60}px hsl(${visual.coreHue}, 70%, 50%)`,
            transition: 'all 0.2s',
          }}
        />
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>
          <p>Openness: {openness.toFixed(2)}</p>
          <p style={{ color: '#888' }}>Flow: {visual.particleFlowDirection > 0 ? 'Outward' : 'Inward'} ({visual.particleFlowDirection.toFixed(2)})</p>
          <p style={{ color: '#888' }}>Spread: {visual.particleSpreadAngle.toFixed(0)}°</p>
          <p style={{ color: '#888' }}>Aura: {visual.auraExpansion.toFixed(2)}x</p>
        </div>
      </div>
    </div>
  );
};

const meta: Meta = {
  title: 'Systems/Emotion/Dimensions',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

type Story = StoryObj;

export const Explorer: Story = {
  render: () => <DimensionsExplorer />,
};

export const Arousal: Story = {
  render: () => <ArousalDemo />,
};

export const Valence: Story = {
  render: () => <ValenceDemo />,
};

export const Openness: Story = {
  render: () => <OpennessDemo />,
};

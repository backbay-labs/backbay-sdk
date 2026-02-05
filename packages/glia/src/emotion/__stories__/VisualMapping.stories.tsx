import type { Meta, StoryObj } from '@storybook/react';
import { useState, useMemo } from 'react';
import { mapArousal, mapValence, mapOpenness, lerp, type AVO } from '../index';

interface MappingChartProps {
  title: string;
  color: string;
  dimension: 'arousal' | 'valence' | 'openness';
  properties: string[];
  mapFn: (v: number) => Record<string, number>;
}

const MappingChart = ({ title, color, dimension, properties, mapFn }: MappingChartProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  // Generate data points
  const dataPoints = useMemo(() => {
    return Array.from({ length: 101 }, (_, i) => {
      const t = i / 100;
      return { t, values: mapFn(t) };
    });
  }, [mapFn]);

  // Normalize values for display
  const normalizedData = useMemo(() => {
    const mins: Record<string, number> = {};
    const maxs: Record<string, number> = {};

    properties.forEach((prop) => {
      const values = dataPoints.map((d) => d.values[prop]);
      mins[prop] = Math.min(...values);
      maxs[prop] = Math.max(...values);
    });

    return dataPoints.map((d) => ({
      t: d.t,
      normalized: Object.fromEntries(
        properties.map((prop) => [
          prop,
          maxs[prop] === mins[prop] ? 0.5 : (d.values[prop] - mins[prop]) / (maxs[prop] - mins[prop]),
        ])
      ),
      raw: d.values,
    }));
  }, [dataPoints, properties]);

  const PROPERTY_COLORS = [
    '#ef4444',
    '#f59e0b',
    '#10b981',
    '#06b6d4',
    '#8b5cf6',
    '#ec4899',
  ];

  return (
    <div style={{ marginBottom: 40 }}>
      <h3
        style={{
          fontFamily: 'JetBrains Mono',
          fontSize: 14,
          color,
          marginBottom: 16,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        {title}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 24 }}>
        {/* Chart */}
        <div
          style={{
            height: 200,
            background: '#111',
            borderRadius: 8,
            position: 'relative',
            padding: '10px 0',
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            setHoverValue(Math.max(0, Math.min(1, x)));
          }}
          onMouseLeave={() => setHoverValue(null)}
        >
          <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((y) => (
              <line
                key={y}
                x1="0%"
                x2="100%"
                y1={`${(1 - y) * 100}%`}
                y2={`${(1 - y) * 100}%`}
                stroke="#222"
                strokeWidth="1"
              />
            ))}

            {/* Property curves */}
            {properties.map((prop, propIdx) => (
              <path
                key={prop}
                d={normalizedData
                  .map((d, i) => {
                    const x = (d.t * 100).toFixed(1);
                    const y = ((1 - d.normalized[prop]) * 100).toFixed(1);
                    return `${i === 0 ? 'M' : 'L'} ${x}% ${y}%`;
                  })
                  .join(' ')}
                fill="none"
                stroke={PROPERTY_COLORS[propIdx % PROPERTY_COLORS.length]}
                strokeWidth="2"
                opacity="0.8"
              />
            ))}

            {/* Hover line */}
            {hoverValue !== null && (
              <line
                x1={`${hoverValue * 100}%`}
                x2={`${hoverValue * 100}%`}
                y1="0%"
                y2="100%"
                stroke={color}
                strokeWidth="1"
                strokeDasharray="4"
              />
            )}
          </svg>

          {/* X-axis labels */}
          <div
            style={{
              position: 'absolute',
              bottom: -20,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'JetBrains Mono',
              fontSize: 9,
              color: '#555',
            }}
          >
            <span>0.0</span>
            <span>0.5</span>
            <span>1.0</span>
          </div>
        </div>

        {/* Legend & current values */}
        <div>
          {properties.map((prop, propIdx) => {
            const currentValue = hoverValue !== null ? mapFn(hoverValue)[prop] : mapFn(0.5)[prop];
            return (
              <div
                key={prop}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid #222',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 10,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: PROPERTY_COLORS[propIdx % PROPERTY_COLORS.length],
                    }}
                  />
                  <span style={{ color: '#888' }}>{prop}</span>
                </span>
                <span style={{ color: '#fff' }}>{currentValue.toFixed(2)}</span>
              </div>
            );
          })}

          {hoverValue !== null && (
            <div style={{ marginTop: 16, fontFamily: 'JetBrains Mono', fontSize: 11, color }}>
              {dimension}: {hoverValue.toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VisualMappingDemo = () => {
  return (
    <div style={{ padding: 32, background: '#0a0a0f', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ fontFamily: 'JetBrains Mono', fontSize: 24, marginBottom: 8 }}>
        Visual Mapping Functions
      </h1>
      <p style={{ color: '#666', marginBottom: 40, fontFamily: 'system-ui' }}>
        How each AVO dimension maps to visual properties. Hover over charts to see values.
      </p>

      <MappingChart
        title="Arousal → Temporal Properties"
        color="#f59e0b"
        dimension="arousal"
        properties={[
          'breathingRate',
          'breathingAmplitude',
          'ringRotationSpeed',
          'particleVelocity',
          'particleCount',
          'glowPulseRate',
        ]}
        mapFn={mapArousal}
      />

      <MappingChart
        title="Valence → Qualitative Properties"
        color="#10b981"
        dimension="valence"
        properties={['coreHue', 'coreSaturation', 'motionNoise', 'scaleFactor', 'emissiveIntensity']}
        mapFn={mapValence}
      />

      <MappingChart
        title="Openness → Spatial Properties"
        color="#8b5cf6"
        dimension="openness"
        properties={[
          'particleFlowDirection',
          'particleSpreadAngle',
          'breathingPhaseBias',
          'ringTilt',
          'auraExpansion',
        ]}
        mapFn={mapOpenness}
      />
    </div>
  );
};

// Formula reference
const FormulaReference = () => {
  return (
    <div style={{ padding: 32, background: '#0a0a0f', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ fontFamily: 'JetBrains Mono', fontSize: 24, marginBottom: 32 }}>
        Mapping Formulas
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
        {/* Arousal */}
        <div>
          <h3 style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: '#f59e0b', marginBottom: 16 }}>
            Arousal (A)
          </h3>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, lineHeight: 2 }}>
            <div style={{ background: '#111', padding: 8, borderRadius: 4, marginBottom: 8 }}>
              <span style={{ color: '#888' }}>breathingRate</span>
              <br />
              <span style={{ color: '#fff' }}>0.3 + A^1.5 × 1.7</span>
            </div>
            <div style={{ background: '#111', padding: 8, borderRadius: 4, marginBottom: 8 }}>
              <span style={{ color: '#888' }}>breathingAmplitude</span>
              <br />
              <span style={{ color: '#fff' }}>0.01 + A × 0.05</span>
            </div>
            <div style={{ background: '#111', padding: 8, borderRadius: 4, marginBottom: 8 }}>
              <span style={{ color: '#888' }}>ringRotationSpeed</span>
              <br />
              <span style={{ color: '#fff' }}>0.1 + A^1.3 × 1.9</span>
            </div>
            <div style={{ background: '#111', padding: 8, borderRadius: 4, marginBottom: 8 }}>
              <span style={{ color: '#888' }}>particleCount</span>
              <br />
              <span style={{ color: '#fff' }}>⌊20 + A × 80⌋</span>
            </div>
            <div style={{ background: '#111', padding: 8, borderRadius: 4, marginBottom: 8 }}>
              <span style={{ color: '#888' }}>glowPulseRate</span>
              <br />
              <span style={{ color: '#fff' }}>0.2 + A^1.4 × 1.3</span>
            </div>
          </div>
        </div>

        {/* Valence */}
        <div>
          <h3 style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: '#10b981', marginBottom: 16 }}>
            Valence (V)
          </h3>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, lineHeight: 2 }}>
            <div style={{ background: '#111', padding: 8, borderRadius: 4, marginBottom: 8 }}>
              <span style={{ color: '#888' }}>coreHue</span>
              <br />
              <span style={{ color: '#fff' }}>lerp(220, 35, σ(V))</span>
              <br />
              <span style={{ color: '#555', fontSize: 9 }}>σ = 1/(1+e^(-8(V-0.4)))</span>
            </div>
            <div style={{ background: '#111', padding: 8, borderRadius: 4, marginBottom: 8 }}>
              <span style={{ color: '#888' }}>coreSaturation</span>
              <br />
              <span style={{ color: '#fff' }}>0.4 + V × 0.45</span>
            </div>
            <div style={{ background: '#111', padding: 8, borderRadius: 4, marginBottom: 8 }}>
              <span style={{ color: '#888' }}>motionNoise</span>
              <br />
              <span style={{ color: '#fff' }}>0.15 × (1-V)²</span>
            </div>
            <div style={{ background: '#111', padding: 8, borderRadius: 4, marginBottom: 8 }}>
              <span style={{ color: '#888' }}>scaleFactor</span>
              <br />
              <span style={{ color: '#fff' }}>0.92 + V × 0.16</span>
            </div>
            <div style={{ background: '#111', padding: 8, borderRadius: 4, marginBottom: 8 }}>
              <span style={{ color: '#888' }}>emissiveIntensity</span>
              <br />
              <span style={{ color: '#fff' }}>0.2 + V^1.5 × 0.7</span>
            </div>
          </div>
        </div>

        {/* Openness */}
        <div>
          <h3 style={{ fontFamily: 'JetBrains Mono', fontSize: 14, color: '#8b5cf6', marginBottom: 16 }}>
            Openness (O)
          </h3>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, lineHeight: 2 }}>
            <div style={{ background: '#111', padding: 8, borderRadius: 4, marginBottom: 8 }}>
              <span style={{ color: '#888' }}>particleFlowDirection</span>
              <br />
              <span style={{ color: '#fff' }}>lerp(-1, 1, O)</span>
            </div>
            <div style={{ background: '#111', padding: 8, borderRadius: 4, marginBottom: 8 }}>
              <span style={{ color: '#888' }}>particleSpreadAngle</span>
              <br />
              <span style={{ color: '#fff' }}>lerp(30, 120, O)</span>
            </div>
            <div style={{ background: '#111', padding: 8, borderRadius: 4, marginBottom: 8 }}>
              <span style={{ color: '#888' }}>breathingPhaseBias</span>
              <br />
              <span style={{ color: '#fff' }}>lerp(-0.3, 0.3, O)</span>
            </div>
            <div style={{ background: '#111', padding: 8, borderRadius: 4, marginBottom: 8 }}>
              <span style={{ color: '#888' }}>ringTilt</span>
              <br />
              <span style={{ color: '#fff' }}>lerp(-15, 15, O)</span>
            </div>
            <div style={{ background: '#111', padding: 8, borderRadius: 4, marginBottom: 8 }}>
              <span style={{ color: '#888' }}>auraExpansion</span>
              <br />
              <span style={{ color: '#fff' }}>lerp(0.95, 1.1, O)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const meta: Meta = {
  title: 'Systems/Emotion/Visual Mapping',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

type Story = StoryObj;

export const Charts: Story = {
  render: () => <VisualMappingDemo />,
};

export const Formulas: Story = {
  render: () => <FormulaReference />,
};

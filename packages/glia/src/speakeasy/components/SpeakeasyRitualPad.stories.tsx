import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

import type { GestureSequence, GestureStep } from '../types';
import { SpeakeasyRitualPad } from './SpeakeasyRitualPad';

const meta: Meta<typeof SpeakeasyRitualPad> = {
  title: 'Speakeasy/SpeakeasyRitualPad',
  component: SpeakeasyRitualPad,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 40, display: 'grid', placeItems: 'center' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SpeakeasyRitualPad>;

export const Empty: Story = {
  name: 'Empty (Ready to Record)',
  args: {
    onComplete: (sequence: GestureSequence) => {
      console.log('Gesture complete:', sequence);
    },
    autoStart: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    onComplete: () => {},
  },
};

export const RecordingWithStepLog: Story = {
  name: 'Recording (with step log)',
  render: function StepLogStory() {
    const [steps, setSteps] = useState<GestureStep[]>([]);
    const [completed, setCompleted] = useState(false);

    function describeStep(step: GestureStep): string {
      switch (step.type) {
        case 'tap':
          return `tap x${step.count} (${step.region})`;
        case 'hold':
          return `hold ${Math.round(step.durationMs)}ms (${step.region})`;
        case 'radial_drag':
          return `radial ${Math.round(step.fromAngle)}-${Math.round(step.toAngle)} (${step.notches} notches)`;
        case 'flick':
          return `flick ${step.direction} (${step.velocity.toFixed(2)}px/ms)`;
      }
    }

    return (
      <div style={{ display: 'grid', gap: 16, justifyItems: 'center' }}>
        <SpeakeasyRitualPad
          onComplete={(seq) => {
            setCompleted(true);
            console.log('Gesture complete:', seq);
          }}
          onStep={(step) => setSteps((prev) => [...prev, step])}
        />

        <div
          style={{
            width: 240,
            minHeight: 60,
            padding: 12,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.3)',
            fontSize: 12,
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          {completed ? (
            <div style={{ color: '#22c55e', fontWeight: 600, marginBottom: 4 }}>
              Gesture complete
            </div>
          ) : (
            <div style={{ opacity: 0.5, marginBottom: 4 }}>
              Perform gestures on the pad above...
            </div>
          )}
          {steps.length > 0 && (
            <ol style={{ margin: 0, paddingLeft: 16 }}>
              {steps.map((s, i) => (
                <li key={i}>{describeStep(s)}</li>
              ))}
            </ol>
          )}
        </div>
      </div>
    );
  },
};

export const CustomStyle: Story = {
  name: 'Custom Style',
  args: {
    onComplete: () => {},
    style: {
      width: 300,
      height: 300,
      borderRadius: 16,
      background:
        'radial-gradient(circle at 50% 50%, rgba(100,200,255,0.15), rgba(0,0,0,0.55) 70%)',
    },
  },
};

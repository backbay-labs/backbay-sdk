import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { SpeakeasyProvider } from '../SpeakeasyProvider';
import { SpeakeasyOrb } from './SpeakeasyOrb';

const meta: Meta<typeof SpeakeasyOrb> = {
  title: 'Speakeasy/SpeakeasyOrb',
  component: SpeakeasyOrb,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SpeakeasyProvider domain="storybook.local" deviceSecret="storybook-secret">
        <div style={{ padding: 80, display: 'grid', placeItems: 'center' }}>
          <Story />
        </div>
      </SpeakeasyProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SpeakeasyOrb>;

export const Idle: Story = {
  args: {
    config: {
      size: 80,
    },
  },
};

export const Pulsing: Story = {
  name: 'Pulsing (Knock Detected)',
  args: {
    config: {
      size: 80,
      glowIntensity: {
        idle: 0.6,
        challenged: 0.6,
        verifying: 0.8,
        admitted: 1.0,
        decoy: 0.35,
        locked: 0.1,
      },
      pulseSpeed: {
        idle: 1000,
        challenged: 1000,
        verifying: 500,
        admitted: 2000,
        decoy: 1200,
        locked: 0,
      },
      colors: {
        idle: '#d4a84b',
        challenged: '#d4a84b',
        verifying: '#d4a84b',
        admitted: '#22c55e',
        decoy: '#d4a84b',
        locked: '#ef4444',
      },
    },
  },
};

export const AdmittedGlow: Story = {
  name: 'Admitted Glow',
  args: {
    config: {
      size: 80,
      glowIntensity: {
        idle: 1.0,
        challenged: 1.0,
        verifying: 1.0,
        admitted: 1.0,
        decoy: 1.0,
        locked: 1.0,
      },
      pulseSpeed: {
        idle: 2000,
        challenged: 2000,
        verifying: 2000,
        admitted: 2000,
        decoy: 2000,
        locked: 2000,
      },
      colors: {
        idle: '#22c55e',
        challenged: '#22c55e',
        verifying: '#22c55e',
        admitted: '#22c55e',
        decoy: '#22c55e',
        locked: '#22c55e',
      },
    },
  },
};

export const Locked: Story = {
  args: {
    config: {
      size: 80,
      glowIntensity: {
        idle: 0.1,
        challenged: 0.1,
        verifying: 0.1,
        admitted: 0.1,
        decoy: 0.1,
        locked: 0.1,
      },
      pulseSpeed: {
        idle: 0,
        challenged: 0,
        verifying: 0,
        admitted: 0,
        decoy: 0,
        locked: 0,
      },
      colors: {
        idle: '#ef4444',
        challenged: '#ef4444',
        verifying: '#ef4444',
        admitted: '#ef4444',
        decoy: '#ef4444',
        locked: '#ef4444',
      },
    },
  },
};

export const CustomSize: Story = {
  name: 'Custom Size (120px)',
  args: {
    config: {
      size: 120,
    },
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

import { SpeakeasyProvider } from '../SpeakeasyProvider';
import { SpeakeasyRegistrationDialog } from './SpeakeasyRegistrationDialog';

const meta: Meta<typeof SpeakeasyRegistrationDialog> = {
  title: 'Speakeasy/SpeakeasyRegistrationDialog',
  component: SpeakeasyRegistrationDialog,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SpeakeasyProvider domain="storybook.local" deviceSecret="storybook-secret">
        <Story />
      </SpeakeasyProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SpeakeasyRegistrationDialog>;

export const OpenInitial: Story = {
  name: 'Open (Initial)',
  args: {
    open: true,
    onOpenChange: () => {},
  },
};

export const WithTriggerButton: Story = {
  name: 'With Trigger Button',
  args: {
    trigger: (
      <button
        style={{
          background: 'rgba(212,168,75,0.15)',
          border: '1px solid rgba(212,168,75,0.3)',
          borderRadius: 8,
          padding: '8px 16px',
          color: 'rgba(212,168,75,0.9)',
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        Register Ritual
      </button>
    ),
  },
};

export const ControlledOpenClose: Story = {
  name: 'Controlled Open/Close',
  render: function ControlledStory() {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
        <button
          onClick={() => setOpen(true)}
          style={{
            background: 'rgba(100,200,255,0.15)',
            border: '1px solid rgba(100,200,255,0.3)',
            borderRadius: 8,
            padding: '8px 16px',
            color: 'rgba(100,200,255,0.9)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Open Registration Dialog
        </button>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
          Dialog open: {String(open)}
        </div>
        <SpeakeasyRegistrationDialog open={open} onOpenChange={setOpen} />
      </div>
    );
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

import type { CapabilityToken } from '../types';
import { SpeakeasyConsentDialog, type SpeakeasyConsentRequest } from './SpeakeasyConsentDialog';

const DEFAULT_REQUEST: SpeakeasyConsentRequest = {
  requester: 'Cyntra Agent',
  purpose: 'access to private feeds and wallet signing',
  scopes: ['speakeasy.private_feeds', 'speakeasy.wallet.sign'],
};

const meta: Meta<typeof SpeakeasyConsentDialog> = {
  title: 'Speakeasy/SpeakeasyConsentDialog',
  component: SpeakeasyConsentDialog,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SpeakeasyConsentDialog>;

export const Open: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    request: DEFAULT_REQUEST,
    onGranted: (token: CapabilityToken) => {
      console.log('Token granted:', token);
    },
  },
};

export const WithTriggerButton: Story = {
  name: 'With Trigger Button',
  args: {
    request: DEFAULT_REQUEST,
    onGranted: (token: CapabilityToken) => {
      console.log('Token granted:', token);
    },
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
        Request Consent
      </button>
    ),
  },
};

export const ControlledWithStatus: Story = {
  name: 'Controlled (with grant status)',
  render: function ControlledStory() {
    const [open, setOpen] = useState(false);
    const [granted, setGranted] = useState<CapabilityToken | null>(null);

    return (
      <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
        <button
          onClick={() => {
            setGranted(null);
            setOpen(true);
          }}
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
          Open Consent Dialog
        </button>

        {granted && (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              border: '1px solid rgba(34,197,94,0.3)',
              background: 'rgba(34,197,94,0.08)',
              fontSize: 12,
              color: 'rgba(255,255,255,0.8)',
              maxWidth: 320,
            }}
          >
            <div style={{ color: '#22c55e', fontWeight: 600, marginBottom: 4 }}>
              Consent granted
            </div>
            <div>Token ID: {granted.tokenId}</div>
            <div>Scopes: {granted.scopes.join(', ')}</div>
          </div>
        )}

        {!granted && !open && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            No consent granted yet
          </div>
        )}

        <SpeakeasyConsentDialog
          open={open}
          onOpenChange={setOpen}
          request={DEFAULT_REQUEST}
          onGranted={(token) => {
            setGranted(token);
          }}
        />
      </div>
    );
  },
};

export const DifferentScopes: Story = {
  name: 'Different Scopes',
  args: {
    open: true,
    onOpenChange: () => {},
    request: {
      requester: 'Providence Security Module',
      purpose: 'elevated threat analysis',
      scopes: ['speakeasy.security.*', 'speakeasy.admin.read'],
    },
    onGranted: (token: CapabilityToken) => {
      console.log('Token granted:', token);
    },
  },
};

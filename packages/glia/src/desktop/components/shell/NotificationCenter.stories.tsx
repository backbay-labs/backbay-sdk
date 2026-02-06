import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect, useCallback } from 'react';
import { NotificationCenter } from './NotificationCenter';
import { NotificationToast } from './NotificationToast';
import { useNotifications } from '../../core/shell/useNotifications';
import { useNotificationStore } from '../../core/shell/useNotifications';
import type { Notification, NotificationInput } from '../../core/shell/notificationTypes';

// ═══════════════════════════════════════════════════════════════════════════
// Dark Wrapper
// ═══════════════════════════════════════════════════════════════════════════

const darkWrapperStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: '#0a0a0a',
  fontFamily: "'IBM Plex Mono', 'SF Mono', monospace",
  // CSS variables for theme
  '--bb-color-context-menu-bg': 'rgba(17, 17, 17, 0.95)',
  '--bb-color-window-border': '#333333',
  '--bb-color-text-primary': '#ffffff',
  '--bb-color-text-secondary': '#cccccc',
  '--bb-color-text-muted': '#888888',
  '--bb-color-accent': '#d4a84b',
  '--bb-color-accent-glow': 'rgba(212, 168, 75, 0.2)',
  '--bb-color-accent-muted': 'rgba(212, 168, 75, 0.1)',
  '--bb-color-destructive': '#c44444',
  '--bb-color-success': '#44c444',
  '--bb-color-warning': '#e6a817',
  '--bb-color-taskbar-bg': 'rgba(17, 17, 17, 0.8)',
  '--bb-color-context-menu-hover': 'rgba(212, 168, 75, 0.10)',
  '--bb-blur-backdrop': 'blur(12px)',
  '--bb-radius-menu': '3px',
  '--bb-radius-button': '2px',
  '--bb-font-mono': "'IBM Plex Mono', 'SF Mono', monospace",
  '--bb-font-body': "'Inter', sans-serif",
  '--bb-font-display': "'Inter', sans-serif",
  '--bb-spacing-taskbar-height': '48px',
  '--bb-duration-fast': '100ms',
} as React.CSSProperties;

function DarkWrapper({ children }: { children: React.ReactNode }) {
  return <div style={darkWrapperStyle}>{children}</div>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Sample Data
// ═══════════════════════════════════════════════════════════════════════════

const sampleNotifications: NotificationInput[] = [
  {
    type: 'success',
    priority: 'normal',
    title: 'Build Complete',
    message: 'Project compiled successfully in 2.4s',
    appId: 'builder',
  },
  {
    type: 'error',
    priority: 'high',
    title: 'Connection Lost',
    message: 'Unable to reach cluster node alpha-7. Retrying...',
    appId: 'network',
  },
  {
    type: 'warning',
    priority: 'normal',
    title: 'Memory Usage High',
    message: 'Process using 87% of allocated memory',
    appId: 'monitor',
  },
  {
    type: 'info',
    priority: 'low',
    title: 'New Update Available',
    message: 'Version 2.1.0 is ready to install',
    appId: 'system',
  },
  {
    type: 'info',
    priority: 'normal',
    title: 'Agent Training Complete',
    message: 'Model accuracy: 94.2%',
    appId: 'cognition',
    groupKey: 'training',
  },
  {
    type: 'success',
    priority: 'normal',
    title: 'Deployment Successful',
    message: 'Service deployed to production cluster',
    appId: 'deploy',
  },
];

const notificationsWithActions: NotificationInput[] = [
  {
    type: 'info',
    priority: 'normal',
    title: 'Incoming File Transfer',
    message: 'agent-7 wants to send "report.pdf" (2.4MB)',
    appId: 'transfer',
    actions: [
      { id: 'accept', label: 'Accept', primary: true, action: () => {} },
      { id: 'decline', label: 'Decline', action: () => {} },
    ],
  },
  {
    type: 'warning',
    priority: 'high',
    title: 'Certificate Expiring',
    message: 'TLS certificate for cluster-alpha expires in 3 days',
    appId: 'security',
    actions: [
      { id: 'renew', label: 'Renew Now', primary: true, action: () => {} },
      { id: 'remind', label: 'Remind Later', action: () => {} },
    ],
  },
  {
    type: 'error',
    priority: 'critical',
    title: 'Authentication Failed',
    message: 'Multiple failed login attempts detected from 192.168.1.42',
    appId: 'security',
    actions: [
      { id: 'block', label: 'Block IP', primary: true, action: () => {} },
      { id: 'review', label: 'Review Logs', action: () => {} },
    ],
  },
];

const groupedNotifications: NotificationInput[] = [
  {
    type: 'info',
    priority: 'normal',
    title: 'Epoch 1/10 Complete',
    message: 'Loss: 0.342, Accuracy: 78.1%',
    groupKey: 'Training Progress',
  },
  {
    type: 'info',
    priority: 'normal',
    title: 'Epoch 2/10 Complete',
    message: 'Loss: 0.287, Accuracy: 82.4%',
    groupKey: 'Training Progress',
  },
  {
    type: 'info',
    priority: 'normal',
    title: 'Epoch 3/10 Complete',
    message: 'Loss: 0.215, Accuracy: 86.9%',
    groupKey: 'Training Progress',
  },
  {
    type: 'success',
    priority: 'normal',
    title: 'PR #142 Merged',
    message: 'feat: add notification system',
    groupKey: 'Repository Activity',
  },
  {
    type: 'info',
    priority: 'low',
    title: 'PR #143 Opened',
    message: 'fix: memory leak in worker pool',
    groupKey: 'Repository Activity',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// Meta
// ═══════════════════════════════════════════════════════════════════════════

const meta: Meta<typeof NotificationCenter> = {
  title: 'Desktop/Shell/NotificationCenter',
  component: NotificationCenter,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      // Reset store between stories
      useEffect(() => {
        useNotificationStore.getState().clearAll();
        useNotificationStore.getState().closePanel();
      }, []);
      return (
        <DarkWrapper>
          <Story />
        </DarkWrapper>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof NotificationCenter>;

// ═══════════════════════════════════════════════════════════════════════════
// Stories
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Default notification center with mixed notification types.
 */
export const Default: Story = {
  render: function DefaultStory() {
    const { notify, isPanelOpen, openPanel, closePanel } = useNotifications();

    useEffect(() => {
      for (const n of sampleNotifications) {
        notify(n);
      }
    }, []);

    return (
      <>
        <div style={{ padding: 24 }}>
          <button
            onClick={openPanel}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid #333',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 3,
              cursor: 'pointer',
              fontFamily: 'var(--bb-font-mono)',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Open Notifications
          </button>
        </div>
        <NotificationCenter isOpen={isPanelOpen} onClose={closePanel} />
        {/* Fake taskbar */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 48,
            background: 'rgba(17,17,17,0.8)',
            borderTop: '1px solid #333',
          }}
        />
      </>
    );
  },
};

/**
 * Empty state when there are no notifications.
 */
export const Empty: Story = {
  render: function EmptyStory() {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <>
        <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 48,
            background: 'rgba(17,17,17,0.8)',
            borderTop: '1px solid #333',
          }}
        />
      </>
    );
  },
};

/**
 * Notifications grouped by custom group keys.
 */
export const Grouped: Story = {
  render: function GroupedStory() {
    const { notify, isPanelOpen, openPanel, closePanel } = useNotifications();

    useEffect(() => {
      for (const n of groupedNotifications) {
        notify(n);
      }
    }, []);

    return (
      <>
        <div style={{ padding: 24 }}>
          <button
            onClick={openPanel}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid #333',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 3,
              cursor: 'pointer',
              fontFamily: 'var(--bb-font-mono)',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Open Grouped Notifications
          </button>
        </div>
        <NotificationCenter isOpen={isPanelOpen} onClose={closePanel} />
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 48,
            background: 'rgba(17,17,17,0.8)',
            borderTop: '1px solid #333',
          }}
        />
      </>
    );
  },
};

/**
 * Notifications with action buttons.
 */
export const WithActions: Story = {
  render: function WithActionsStory() {
    const { notify, isPanelOpen, openPanel, closePanel } = useNotifications();

    useEffect(() => {
      for (const n of notificationsWithActions) {
        notify(n);
      }
    }, []);

    return (
      <>
        <div style={{ padding: 24 }}>
          <button
            onClick={openPanel}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid #333',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 3,
              cursor: 'pointer',
              fontFamily: 'var(--bb-font-mono)',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Open Notifications with Actions
          </button>
        </div>
        <NotificationCenter isOpen={isPanelOpen} onClose={closePanel} />
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 48,
            background: 'rgba(17,17,17,0.8)',
            borderTop: '1px solid #333',
          }}
        />
      </>
    );
  },
};

/**
 * Toast notification with auto-dismiss and progress bar.
 */
export const Toast: Story = {
  render: function ToastStory() {
    const { notify, notifications, dismiss, markRead } = useNotifications();
    const [currentToast, setCurrentToast] = useState<Notification | null>(null);

    const sendNotification = useCallback(() => {
      const types = ['info', 'warning', 'error', 'success'] as const;
      const messages = [
        { title: 'Build Complete', message: 'All checks passed' },
        { title: 'Disk Space Low', message: 'Only 2.1 GB remaining on /dev/sda1' },
        { title: 'Service Crashed', message: 'Worker process exited with code 1' },
        { title: 'Backup Finished', message: 'Snapshot saved to s3://backups/' },
      ];
      const idx = Math.floor(Math.random() * types.length);
      const id = notify({
        type: types[idx],
        priority: 'normal',
        ...messages[idx],
        autoDismissMs: 5000,
      });
      // Show the newly created notification as toast
      setTimeout(() => {
        const n = useNotificationStore.getState().notifications.find((n) => n.id === id);
        if (n) setCurrentToast(n);
      }, 0);
    }, [notify]);

    return (
      <>
        <div style={{ padding: 24 }}>
          <button
            onClick={sendNotification}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid #333',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 3,
              cursor: 'pointer',
              fontFamily: 'var(--bb-font-mono)',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Send Toast Notification
          </button>
        </div>
        <NotificationToast
          notification={currentToast}
          onDismiss={(id) => {
            dismiss(id);
            setCurrentToast(null);
          }}
          onRead={markRead}
        />
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 48,
            background: 'rgba(17,17,17,0.8)',
            borderTop: '1px solid #333',
          }}
        />
      </>
    );
  },
};

/**
 * High volume: many notifications stacked.
 */
export const HighVolume: Story = {
  render: function HighVolumeStory() {
    const { notify, isPanelOpen, openPanel, closePanel } = useNotifications();

    useEffect(() => {
      const types = ['info', 'warning', 'error', 'success'] as const;
      const apps = ['system', 'network', 'builder', 'monitor', 'deploy', 'security'];
      for (let i = 0; i < 30; i++) {
        notify({
          type: types[i % types.length],
          priority: i % 5 === 0 ? 'high' : 'normal',
          title: `Notification #${i + 1}`,
          message: `This is notification number ${i + 1} from the system`,
          appId: apps[i % apps.length],
        });
      }
    }, []);

    return (
      <>
        <div style={{ padding: 24 }}>
          <button
            onClick={openPanel}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid #333',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 3,
              cursor: 'pointer',
              fontFamily: 'var(--bb-font-mono)',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Open High Volume ({30} notifications)
          </button>
        </div>
        <NotificationCenter isOpen={isPanelOpen} onClose={closePanel} />
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 48,
            background: 'rgba(17,17,17,0.8)',
            borderTop: '1px solid #333',
          }}
        />
      </>
    );
  },
};

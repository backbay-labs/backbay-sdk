import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SystemTray, type SystemTrayItem } from './SystemTray';
import { Taskbar } from './Taskbar';

// ═══════════════════════════════════════════════════════════════════════════
// Dark wrapper that sets desktop CSS variables
// ═══════════════════════════════════════════════════════════════════════════

function DesktopWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        // Colors
        ['--bb-color-text-primary' as string]: '#ffffff',
        ['--bb-color-text-secondary' as string]: '#cccccc',
        ['--bb-color-text-muted' as string]: '#888888',
        ['--bb-color-accent' as string]: '#d4a84b',
        ['--bb-color-accent-glow' as string]: 'rgba(212, 168, 75, 0.2)',
        ['--bb-color-window-bg' as string]: '#111111',
        ['--bb-color-window-border' as string]: '#333333',
        ['--bb-color-context-menu-bg' as string]: '#111111',
        ['--bb-color-context-menu-hover' as string]:
          'rgba(212, 168, 75, 0.10)',
        ['--bb-color-taskbar-bg' as string]: 'rgba(17, 17, 17, 0.8)',
        ['--bb-color-destructive' as string]: '#c44444',
        ['--bb-color-success' as string]: '#44c444',
        ['--bb-color-warning' as string]: '#c4a844',
        // Fonts
        ['--bb-font-mono' as string]:
          "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
        ['--bb-font-body' as string]:
          "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        // Radii
        ['--bb-radius-button' as string]: '2px',
        ['--bb-radius-menu' as string]: '3px',
        // Shadows
        ['--bb-shadow-tooltip' as string]: '0 4px 12px rgba(0,0,0,0.4)',
        // Blur
        ['--bb-blur-backdrop' as string]: 'blur(12px)',
        // Durations
        ['--bb-duration-fast' as string]: '100ms',
        // Spacing
        ['--bb-spacing-taskbar-height' as string]: '48px',

        background: '#0a0a0a',
        padding: '40px',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
      }}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Icon helpers (inline SVGs for story demo)
// ═══════════════════════════════════════════════════════════════════════════

function WifiIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
      <line x1="23" y1="13" x2="23" y2="11" />
      <rect x="3" y="8" width="10" height="8" rx="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function VolumeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function BluetoothIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  );
}

function CastIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
      <line x1="2" y1="20" x2="2.01" y2="20" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Default items
// ═══════════════════════════════════════════════════════════════════════════

const defaultItems: SystemTrayItem[] = [
  { id: 'wifi', icon: <WifiIcon />, tooltip: 'Wi-Fi: Connected', order: 0 },
  {
    id: 'volume',
    icon: <VolumeIcon />,
    tooltip: 'Volume: 75%',
    order: 1,
  },
  {
    id: 'battery',
    icon: <BatteryIcon />,
    tooltip: 'Battery: 85%',
    order: 2,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// Meta
// ═══════════════════════════════════════════════════════════════════════════

const meta: Meta<typeof SystemTray> = {
  title: 'Desktop/Shell/SystemTray',
  component: SystemTray,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <DesktopWrapper>
        <Story />
      </DesktopWrapper>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof SystemTray>;

// ═══════════════════════════════════════════════════════════════════════════
// Stories
// ═══════════════════════════════════════════════════════════════════════════

/** Default system tray with wifi, volume, and battery icons */
export const Default: Story = {
  args: {
    items: defaultItems,
    showClock: true,
  },
};

/** Tray icons with badge counts */
export const WithBadges: Story = {
  args: {
    items: [
      {
        id: 'wifi',
        icon: <WifiIcon />,
        tooltip: 'Wi-Fi: Connected',
        order: 0,
      },
      {
        id: 'volume',
        icon: <VolumeIcon />,
        tooltip: 'Volume: 75%',
        badge: 2,
        order: 1,
      },
      {
        id: 'battery',
        icon: <BatteryIcon />,
        tooltip: 'Battery: 15% - Low',
        badge: 1,
        order: 2,
      },
    ],
    showNotificationIndicator: true,
    notificationCount: 5,
    showClock: true,
  },
};

/** Overflow panel with more than maxVisibleItems */
export const WithOverflow: Story = {
  args: {
    items: [
      { id: 'wifi', icon: <WifiIcon />, tooltip: 'Wi-Fi', order: 0 },
      { id: 'volume', icon: <VolumeIcon />, tooltip: 'Volume', order: 1 },
      { id: 'battery', icon: <BatteryIcon />, tooltip: 'Battery', order: 2 },
      {
        id: 'bluetooth',
        icon: <BluetoothIcon />,
        tooltip: 'Bluetooth',
        order: 3,
      },
      { id: 'shield', icon: <ShieldIcon />, tooltip: 'Security', order: 4 },
      { id: 'cloud', icon: <CloudIcon />, tooltip: 'Cloud Sync', order: 5 },
      { id: 'cast', icon: <CastIcon />, tooltip: 'Cast', order: 6 },
    ],
    maxVisibleItems: 4,
    showClock: true,
  },
};

/** Full integration inside the Taskbar component */
export const InTaskbar: Story = {
  decorators: [
    (Story) => (
      <div
        style={{
          // Colors
          ['--bb-color-text-primary' as string]: '#ffffff',
          ['--bb-color-text-secondary' as string]: '#cccccc',
          ['--bb-color-text-muted' as string]: '#888888',
          ['--bb-color-accent' as string]: '#d4a84b',
          ['--bb-color-accent-glow' as string]: 'rgba(212, 168, 75, 0.2)',
          ['--bb-color-window-bg' as string]: '#111111',
          ['--bb-color-window-border' as string]: '#333333',
          ['--bb-color-context-menu-bg' as string]: '#111111',
          ['--bb-color-context-menu-hover' as string]:
            'rgba(212, 168, 75, 0.10)',
          ['--bb-color-taskbar-bg' as string]: 'rgba(17, 17, 17, 0.8)',
          ['--bb-color-destructive' as string]: '#c44444',
          ['--bb-font-mono' as string]:
            "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
          ['--bb-font-body' as string]:
            "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          ['--bb-radius-button' as string]: '2px',
          ['--bb-radius-menu' as string]: '3px',
          ['--bb-shadow-tooltip' as string]: '0 4px 12px rgba(0,0,0,0.4)',
          ['--bb-blur-backdrop' as string]: 'blur(12px)',
          ['--bb-duration-fast' as string]: '100ms',
          ['--bb-spacing-taskbar-height' as string]: '48px',

          background: '#0a0a0a',
          width: '100%',
          height: '400px',
          position: 'relative',
        }}
      >
        <Taskbar showClock={false}>
          <Taskbar.StartButton />
          <Taskbar.Divider />
          <Taskbar.RunningApps>
            <div
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                fontFamily: 'var(--bb-font-mono)',
                color: 'var(--bb-color-text-muted)',
                letterSpacing: '0.05em',
              }}
            >
              No running applications
            </div>
          </Taskbar.RunningApps>
          <Taskbar.Divider />
          <Taskbar.SystemTray>
            <Story />
          </Taskbar.SystemTray>
        </Taskbar>
      </div>
    ),
  ],
  args: {
    items: defaultItems,
    showNotificationIndicator: true,
    notificationCount: 3,
    showClock: true,
  },
};

/** Interactive demo with toggleable badges and notifications */
export const Interactive: Story = {
  render: function InteractiveSystemTray() {
    const [notifCount, setNotifCount] = useState(3);
    const [items, setItems] = useState<SystemTrayItem[]>([
      {
        id: 'wifi',
        icon: <WifiIcon />,
        tooltip: 'Wi-Fi: Connected',
        order: 0,
      },
      {
        id: 'volume',
        icon: <VolumeIcon />,
        tooltip: 'Volume: 75%',
        badge: 0,
        order: 1,
      },
      {
        id: 'battery',
        icon: <BatteryIcon />,
        tooltip: 'Battery: 85%',
        order: 2,
      },
    ]);

    const addBadge = () => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === 'volume'
            ? { ...item, badge: (item.badge ?? 0) + 1 }
            : item
        )
      );
    };

    const clearBadges = () => {
      setItems((prev) =>
        prev.map((item) => ({ ...item, badge: 0 }))
      );
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={addBadge}
            style={{
              padding: '6px 12px',
              background: 'var(--bb-color-accent)',
              color: '#000',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              fontFamily: 'var(--bb-font-mono)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Add Badge
          </button>
          <button
            onClick={clearBadges}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              color: 'var(--bb-color-text-secondary)',
              border: '1px solid var(--bb-color-window-border)',
              borderRadius: '3px',
              cursor: 'pointer',
              fontFamily: 'var(--bb-font-mono)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Clear Badges
          </button>
          <button
            onClick={() => setNotifCount((n) => n + 1)}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              color: 'var(--bb-color-text-secondary)',
              border: '1px solid var(--bb-color-window-border)',
              borderRadius: '3px',
              cursor: 'pointer',
              fontFamily: 'var(--bb-font-mono)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            +1 Notification
          </button>
          <button
            onClick={() => setNotifCount(0)}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              color: 'var(--bb-color-text-secondary)',
              border: '1px solid var(--bb-color-window-border)',
              borderRadius: '3px',
              cursor: 'pointer',
              fontFamily: 'var(--bb-font-mono)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Clear Notifications
          </button>
        </div>
        <SystemTray
          items={items}
          showNotificationIndicator
          notificationCount={notifCount}
          onNotificationClick={() =>
            setNotifCount(0)
          }
          showClock
        />
      </div>
    );
  },
};

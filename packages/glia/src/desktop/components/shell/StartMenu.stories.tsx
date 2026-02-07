import { useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { StartMenu } from './StartMenu';
import type { StartMenuApp, StartMenuCategory } from '../../core/shell/types';

// ═══════════════════════════════════════════════════════════════════════════
// Dark decorator to supply CSS custom properties
// ═══════════════════════════════════════════════════════════════════════════

const desktopVars: Record<string, string> = {
  '--glia-color-bg-elevated': '#111111',
  '--glia-color-border': '#333333',
  '--glia-glass-hover-bg': 'rgba(212, 168, 75, 0.10)',
  '--glia-color-accent': '#d4a84b',
  '--glia-glass-active-shadow': 'rgba(212, 168, 75, 0.2)',
  '--glia-color-text-primary': '#ffffff',
  '--glia-color-text-muted': '#cccccc',
  '--glia-color-text-soft': '#888888',
  '--glia-color-accent-destructive': '#c44444',
  '--glia-blur-backdrop': 'blur(12px)',
  '--glia-radius-md': '3px',
  '--glia-radius-sm': '2px',
  '--glia-shadow-hud-panel': '0 4px 16px rgba(0, 0, 0, 0.5)',
  '--glia-font-display': "'Cinzel', serif",
  '--glia-font-mono': "'JetBrains Mono', monospace",
  '--glia-spacing-taskbar-height': '48px',
  '--glia-duration-fast': '100ms',
};

const wrapperStyle: CSSProperties = {
  width: '100vw',
  height: '100vh',
  background: '#010100',
  position: 'relative',
};

function DesktopDecorator(Story: React.ComponentType) {
  return (
    <div style={{ ...wrapperStyle, ...desktopVars } as CSSProperties}>
      <Story />
      {/* Fake taskbar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '48px',
          background: 'rgba(17, 17, 17, 0.8)',
          borderTop: '1px solid #333333',
          zIndex: 9000,
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sample data
// ═══════════════════════════════════════════════════════════════════════════

const sampleCategories: StartMenuCategory[] = [
  { id: 'productivity', label: 'Productivity', icon: undefined },
  { id: 'utilities', label: 'Utilities', icon: undefined },
  { id: 'media', label: 'Media', icon: undefined },
  { id: 'system', label: 'System', icon: undefined },
];

const sampleApps: StartMenuApp[] = [
  {
    id: 'notepad',
    name: 'Notepad',
    categoryId: 'productivity',
    description: 'Simple text editor',
    pinned: true,
  },
  {
    id: 'terminal',
    name: 'Terminal',
    categoryId: 'utilities',
    description: 'Command line interface',
    pinned: true,
  },
  {
    id: 'file-explorer',
    name: 'File Explorer',
    categoryId: 'utilities',
    description: 'Browse and manage files',
    pinned: true,
  },
  {
    id: 'settings',
    name: 'Settings',
    categoryId: 'system',
    description: 'System configuration',
    pinned: true,
  },
  {
    id: 'media-player',
    name: 'Media Player',
    categoryId: 'media',
    description: 'Audio and video playback',
    recent: true,
  },
  {
    id: 'calculator',
    name: 'Calculator',
    categoryId: 'utilities',
    description: 'Math and calculations',
    recent: true,
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    categoryId: 'system',
    description: 'Security monitoring agent',
  },
  {
    id: 'comms',
    name: 'Communications',
    categoryId: 'productivity',
    description: 'Encrypted messaging',
  },
  {
    id: 'ledger',
    name: 'Ledger',
    categoryId: 'productivity',
    description: 'Financial transactions',
  },
  {
    id: 'gallery',
    name: 'Gallery',
    categoryId: 'media',
    description: 'Image viewer',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// Meta
// ═══════════════════════════════════════════════════════════════════════════

const meta: Meta<typeof StartMenu> = {
  title: 'Desktop/Shell/StartMenu',
  component: StartMenu,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
  decorators: [DesktopDecorator as any],
};

export default meta;
type Story = StoryObj<typeof StartMenu>;

// ═══════════════════════════════════════════════════════════════════════════
// Stories
// ═══════════════════════════════════════════════════════════════════════════

export const Default: Story = {
  args: {
    isOpen: true,
    categories: sampleCategories,
    apps: sampleApps,
    onClose: () => {},
    onLaunchApp: (appId: string) => console.log('Launch:', appId),
  },
};

export const WithSearch: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <StartMenu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        categories={sampleCategories}
        apps={sampleApps}
        onLaunchApp={(appId) => console.log('Launch:', appId)}
      />
    );
  },
};

export const PinnedApps: Story = {
  args: {
    isOpen: true,
    categories: [],
    apps: sampleApps.map((app) => ({ ...app, pinned: true })),
    onClose: () => {},
    onLaunchApp: (appId: string) => console.log('Launch:', appId),
  },
};

export const EmptyState: Story = {
  args: {
    isOpen: true,
    categories: [],
    apps: [],
    onClose: () => {},
  },
};

export const CustomFooter: Story = {
  args: {
    isOpen: true,
    categories: sampleCategories,
    apps: sampleApps,
    onClose: () => {},
    onLaunchApp: (appId: string) => console.log('Launch:', appId),
    footer: (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--glia-font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: 'var(--glia-color-text-soft, #888888)',
          }}
        >
          operator_01
        </span>
        <button
          style={{
            padding: '4px 10px',
            background: 'transparent',
            border: '1px solid var(--glia-color-border, #333333)',
            borderRadius: 'var(--glia-radius-sm, 2px)',
            fontFamily: 'var(--glia-font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: 'var(--glia-color-accent-destructive, #c44444)',
            cursor: 'pointer',
          }}
        >
          Shutdown
        </button>
      </div>
    ),
  },
};

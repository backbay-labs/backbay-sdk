import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { GlassMenubar, type MenubarItem } from './GlassMenubar';

const meta: Meta<typeof GlassMenubar> = {
  title: 'Desktop/Shell/GlassMenubar',
  component: GlassMenubar,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div
        style={{
          background: '#111111',
          minHeight: '400px',
          padding: '16px',
          fontFamily: 'monospace',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlassMenubar>;

// ── Sample Menus ──────────────────────────────────────────────────────────

const defaultMenus: MenubarItem[] = [
  {
    id: 'file',
    label: 'File',
    items: [
      { id: 'new', label: 'New' },
      { id: 'open', label: 'Open' },
      { id: 'save', label: 'Save' },
      { id: 'save-as', label: 'Save As' },
      { id: 'sep1', label: '', separator: true },
      { id: 'close', label: 'Close', danger: true },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    items: [
      { id: 'undo', label: 'Undo' },
      { id: 'redo', label: 'Redo' },
      { id: 'sep1', label: '', separator: true },
      { id: 'cut', label: 'Cut' },
      { id: 'copy', label: 'Copy' },
      { id: 'paste', label: 'Paste' },
    ],
  },
  {
    id: 'view',
    label: 'View',
    items: [
      { id: 'zoom-in', label: 'Zoom In' },
      { id: 'zoom-out', label: 'Zoom Out' },
      { id: 'reset-zoom', label: 'Reset Zoom' },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    items: [
      { id: 'docs', label: 'Documentation' },
      { id: 'about', label: 'About' },
    ],
  },
];

// ── Default ───────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    menus: defaultMenus,
    onAction: (menuId, itemId) =>
      console.log(`[GlassMenubar] ${menuId} > ${itemId}`),
  },
};

// ── WithShortcuts ─────────────────────────────────────────────────────────

const shortcutMenus: MenubarItem[] = [
  {
    id: 'file',
    label: 'File',
    items: [
      { id: 'new', label: 'New', shortcut: '\u2318N' },
      { id: 'open', label: 'Open', shortcut: '\u2318O' },
      { id: 'save', label: 'Save', shortcut: '\u2318S' },
      { id: 'save-as', label: 'Save As', shortcut: '\u21E7\u2318S' },
      { id: 'sep1', label: '', separator: true },
      { id: 'close', label: 'Close Window', shortcut: '\u2318W', danger: true },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    items: [
      { id: 'undo', label: 'Undo', shortcut: '\u2318Z' },
      { id: 'redo', label: 'Redo', shortcut: '\u21E7\u2318Z' },
      { id: 'sep1', label: '', separator: true },
      { id: 'cut', label: 'Cut', shortcut: '\u2318X' },
      { id: 'copy', label: 'Copy', shortcut: '\u2318C' },
      { id: 'paste', label: 'Paste', shortcut: '\u2318V' },
      { id: 'select-all', label: 'Select All', shortcut: '\u2318A' },
    ],
  },
  {
    id: 'view',
    label: 'View',
    items: [
      { id: 'zoom-in', label: 'Zoom In', shortcut: '\u2318+' },
      { id: 'zoom-out', label: 'Zoom Out', shortcut: '\u2318-' },
      { id: 'reset-zoom', label: 'Actual Size', shortcut: '\u23180' },
      { id: 'sep1', label: '', separator: true },
      { id: 'fullscreen', label: 'Fullscreen', shortcut: 'F11' },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    items: [
      { id: 'docs', label: 'Documentation', shortcut: 'F1' },
      { id: 'about', label: 'About' },
    ],
  },
];

export const WithShortcuts: Story = {
  args: {
    menus: shortcutMenus,
    onAction: (menuId, itemId) =>
      console.log(`[GlassMenubar] ${menuId} > ${itemId}`),
  },
};

// ── WithSubmenus ──────────────────────────────────────────────────────────

const submenuMenus: MenubarItem[] = [
  {
    id: 'file',
    label: 'File',
    items: [
      { id: 'new', label: 'New', shortcut: '\u2318N' },
      {
        id: 'open-recent',
        label: 'Open Recent',
        children: [
          { id: 'recent-1', label: 'Project Alpha' },
          { id: 'recent-2', label: 'Untitled Document' },
          { id: 'recent-3', label: 'Config.json' },
          { id: 'sep1', label: '', separator: true },
          { id: 'clear-recent', label: 'Clear Recent', danger: true },
        ],
      },
      { id: 'sep1', label: '', separator: true },
      {
        id: 'export',
        label: 'Export As',
        children: [
          { id: 'export-pdf', label: 'PDF' },
          { id: 'export-png', label: 'PNG' },
          { id: 'export-svg', label: 'SVG' },
        ],
      },
      { id: 'sep2', label: '', separator: true },
      { id: 'close', label: 'Close', danger: true },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    items: [
      { id: 'undo', label: 'Undo', shortcut: '\u2318Z' },
      { id: 'redo', label: 'Redo', shortcut: '\u21E7\u2318Z' },
      { id: 'sep1', label: '', separator: true },
      { id: 'find', label: 'Find', shortcut: '\u2318F' },
      {
        id: 'find-replace',
        label: 'Find & Replace',
        children: [
          { id: 'find-text', label: 'Find Text' },
          { id: 'replace-text', label: 'Replace Text' },
          { id: 'replace-all', label: 'Replace All' },
        ],
      },
    ],
  },
];

export const WithSubmenus: Story = {
  args: {
    menus: submenuMenus,
    onAction: (menuId, itemId) =>
      console.log(`[GlassMenubar] ${menuId} > ${itemId}`),
  },
};

// ── WithCheckboxes ────────────────────────────────────────────────────────

function WithCheckboxesRender() {
  const [wordWrap, setWordWrap] = useState(true);
  const [minimap, setMinimap] = useState(false);
  const [lineNumbers, setLineNumbers] = useState(true);

  const menus: MenubarItem[] = [
    {
      id: 'view',
      label: 'View',
      items: [
        {
          id: 'word-wrap',
          label: 'Word Wrap',
          checked: wordWrap,
          action: () => setWordWrap((v) => !v),
        },
        {
          id: 'minimap',
          label: 'Minimap',
          checked: minimap,
          action: () => setMinimap((v) => !v),
        },
        {
          id: 'line-numbers',
          label: 'Line Numbers',
          checked: lineNumbers,
          action: () => setLineNumbers((v) => !v),
        },
        { id: 'sep1', label: '', separator: true },
        { id: 'zoom-in', label: 'Zoom In', shortcut: '\u2318+' },
        { id: 'zoom-out', label: 'Zoom Out', shortcut: '\u2318-' },
      ],
    },
    {
      id: 'help',
      label: 'Help',
      items: [{ id: 'about', label: 'About' }],
    },
  ];

  return <GlassMenubar menus={menus} />;
}

export const WithCheckboxes: Story = {
  render: () => <WithCheckboxesRender />,
};

// ── InsideWindow ──────────────────────────────────────────────────────────

export const InsideWindow: Story = {
  render: () => (
    <div
      style={{
        width: '600px',
        border: '1px solid var(--bb-color-window-border, #333333)',
        borderRadius: 'var(--bb-radius-window, 6px)',
        overflow: 'hidden',
        background: 'var(--bb-color-window-bg, #0a0a0a)',
      }}
    >
      {/* Titlebar mock */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '36px',
          padding: '0 12px',
          background: 'var(--bb-color-titlebar-bg, #111111)',
          borderBottom: '1px solid var(--bb-color-window-border, #333333)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--bb-font-display, sans-serif)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--bb-color-text-primary, #ffffff)',
          }}
        >
          Text Editor
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              background: '#333',
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              background: '#333',
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              background: '#333',
            }}
          />
        </div>
      </div>

      {/* Menubar */}
      <div
        style={{
          borderBottom: '1px solid var(--bb-color-window-border, #333333)',
          padding: '0 4px',
        }}
      >
        <GlassMenubar
          menus={shortcutMenus}
          onAction={(menuId, itemId) =>
            console.log(`[GlassMenubar] ${menuId} > ${itemId}`)
          }
        />
      </div>

      {/* Content area mock */}
      <div
        style={{
          padding: '16px',
          height: '200px',
          fontFamily: 'var(--bb-font-mono)',
          fontSize: '12px',
          color: 'var(--bb-color-text-secondary, #cccccc)',
          lineHeight: 1.6,
        }}
      >
        <div style={{ opacity: 0.4 }}>1</div>
        <div>
          <span style={{ color: '#c586c0' }}>import</span>{' '}
          <span style={{ color: '#9cdcfe' }}>React</span>{' '}
          <span style={{ color: '#c586c0' }}>from</span>{' '}
          <span style={{ color: '#ce9178' }}>&apos;react&apos;</span>;
        </div>
        <div style={{ opacity: 0.4 }}>3</div>
        <div>
          <span style={{ color: '#c586c0' }}>export function</span>{' '}
          <span style={{ color: '#dcdcaa' }}>App</span>() {'{'}
        </div>
        <div>
          {'  '}
          <span style={{ color: '#c586c0' }}>return</span>{' '}
          <span style={{ color: '#808080' }}>&lt;</span>
          <span style={{ color: '#4ec9b0' }}>div</span>
          <span style={{ color: '#808080' }}>&gt;</span>Hello
          <span style={{ color: '#808080' }}>&lt;/</span>
          <span style={{ color: '#4ec9b0' }}>div</span>
          <span style={{ color: '#808080' }}>&gt;</span>;
        </div>
        <div>{'}'}</div>
      </div>
    </div>
  ),
};

// ── Disabled ──────────────────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    menus: defaultMenus,
    disabled: true,
  },
};

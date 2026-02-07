import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FileBrowser } from './FileBrowser';
import type { FileItem } from '../../core/desktop/fileBrowserTypes';
import type { ContextMenuItem } from '../../core/shell/types';

// ═══════════════════════════════════════════════════════════════════════════
// Sample Data
// ═══════════════════════════════════════════════════════════════════════════

const now = Date.now();
const DAY = 86400000;

const sampleFiles: FileItem[] = [
  // Root folders
  { id: 'docs', name: 'Documents', type: 'folder', parentId: null, modifiedAt: now - DAY, createdAt: now - 30 * DAY },
  { id: 'images', name: 'Images', type: 'folder', parentId: null, modifiedAt: now - 2 * DAY, createdAt: now - 60 * DAY },
  { id: 'projects', name: 'Projects', type: 'folder', parentId: null, modifiedAt: now - DAY * 3, createdAt: now - 90 * DAY },
  { id: 'music', name: 'Music', type: 'folder', parentId: null, modifiedAt: now - 5 * DAY, createdAt: now - 120 * DAY },

  // Root files
  { id: 'readme', name: 'README.md', type: 'document', parentId: null, size: 2048, modifiedAt: now - DAY, createdAt: now - 10 * DAY },
  { id: 'config', name: 'config.json', type: 'code', parentId: null, size: 512, modifiedAt: now - 2 * DAY, createdAt: now - 20 * DAY },
  { id: 'archive', name: 'backup.tar.gz', type: 'archive', parentId: null, size: 10485760, modifiedAt: now - 7 * DAY, createdAt: now - 14 * DAY },

  // Documents subfolder
  { id: 'doc-report', name: 'Q4 Report.pdf', type: 'document', parentId: 'docs', size: 524288, modifiedAt: now - DAY },
  { id: 'doc-notes', name: 'Meeting Notes.md', type: 'document', parentId: 'docs', size: 4096, modifiedAt: now - 2 * DAY },
  { id: 'doc-spec', name: 'API Spec.yaml', type: 'code', parentId: 'docs', size: 8192, modifiedAt: now - 3 * DAY },

  // Images subfolder
  { id: 'img-logo', name: 'logo.png', type: 'image', parentId: 'images', size: 65536, modifiedAt: now - DAY },
  { id: 'img-hero', name: 'hero-banner.jpg', type: 'image', parentId: 'images', size: 2097152, modifiedAt: now - 5 * DAY },
  { id: 'img-screenshot', name: 'screenshot.png', type: 'image', parentId: 'images', size: 1048576, modifiedAt: now - 2 * DAY },

  // Projects subfolder
  { id: 'proj-src', name: 'src', type: 'folder', parentId: 'projects', modifiedAt: now - DAY },
  { id: 'proj-pkg', name: 'package.json', type: 'code', parentId: 'projects', size: 1024, modifiedAt: now - 2 * DAY },
  { id: 'proj-tsconfig', name: 'tsconfig.json', type: 'code', parentId: 'projects', size: 512, modifiedAt: now - 3 * DAY },

  // Projects/src subfolder
  { id: 'src-index', name: 'index.ts', type: 'code', parentId: 'proj-src', size: 256, modifiedAt: now - DAY },
  { id: 'src-app', name: 'App.tsx', type: 'code', parentId: 'proj-src', size: 2048, modifiedAt: now - DAY },
  { id: 'src-utils', name: 'utils.ts', type: 'code', parentId: 'proj-src', size: 1024, modifiedAt: now - 2 * DAY },

  // Music subfolder
  { id: 'audio-track1', name: 'Ambient 01.mp3', type: 'audio', parentId: 'music', size: 5242880, modifiedAt: now - 10 * DAY },
  { id: 'audio-track2', name: 'Ambient 02.flac', type: 'audio', parentId: 'music', size: 31457280, modifiedAt: now - 10 * DAY },
  { id: 'video-clip', name: 'Demo.mp4', type: 'video', parentId: 'music', size: 52428800, modifiedAt: now - 15 * DAY },
];

function generateLargeDataset(count: number): FileItem[] {
  const types: FileItem['type'][] = ['file', 'folder', 'image', 'document', 'code', 'archive', 'audio', 'video'];
  const extensions: Record<string, string[]> = {
    file: ['.txt', '.log', '.dat'],
    folder: [''],
    image: ['.png', '.jpg', '.svg'],
    document: ['.pdf', '.md', '.docx'],
    code: ['.ts', '.tsx', '.js', '.py'],
    archive: ['.zip', '.tar.gz', '.7z'],
    audio: ['.mp3', '.flac', '.wav'],
    video: ['.mp4', '.webm', '.mov'],
  };

  return Array.from({ length: count }, (_, i) => {
    const type = types[i % types.length];
    const ext = extensions[type][i % extensions[type].length];
    return {
      id: `file-${i}`,
      name: `${type === 'folder' ? 'Folder' : 'File'}-${String(i).padStart(4, '0')}${ext}`,
      type,
      parentId: null,
      size: type === 'folder' ? undefined : Math.floor(Math.random() * 10485760),
      modifiedAt: now - Math.floor(Math.random() * 365) * DAY,
      createdAt: now - Math.floor(Math.random() * 730) * DAY,
    };
  });
}

const largeDataset = generateLargeDataset(200);

// ═══════════════════════════════════════════════════════════════════════════
// Decorator - dark wrapper with CSS variables
// ═══════════════════════════════════════════════════════════════════════════

const darkWrapper = (Story: React.ComponentType) => (
  <div
    style={{
      '--glia-color-bg-panel': '#0a0a0a',
      '--glia-color-border': '#333333',
      '--glia-color-bg-panel': '#111111',
      '--glia-color-text-primary': '#cccccc',
      '--glia-color-accent': '#d4a84b',
      '--glia-glass-hover-bg': 'rgba(212, 168, 75, 0.1)',
      '--glia-color-text-primary': '#ffffff',
      '--glia-color-text-muted': '#cccccc',
      '--glia-color-text-soft': '#888888',
      '--glia-color-text-muted': '#cccccc',
      '--glia-glass-hover-bg': 'rgba(212, 168, 75, 0.08)',
      '--glia-color-bg-body': '#010100',
      '--glia-color-bg-elevated': '#111111',
      '--glia-glass-hover-bg': 'rgba(212, 168, 75, 0.10)',
      '--glia-color-accent-destructive': '#c44444',
      '--glia-font-display': '"Cinzel", serif',
      '--glia-font-mono': '"JetBrains Mono", "Fira Code", monospace',
      '--glia-font-body': '"Inter", sans-serif',
      '--glia-radius-sm': '3px',
      '--glia-radius-md': '3px',
      '--glia-radius-sm': '3px',
      '--glia-radius-lg': '4px',
      background: '#010100',
      width: '100%',
      height: '500px',
      padding: '0',
    } as React.CSSProperties}
  >
    <Story />
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Meta
// ═══════════════════════════════════════════════════════════════════════════

const meta: Meta<typeof FileBrowser> = {
  title: 'Desktop OS/FileBrowser',
  component: FileBrowser,
  decorators: [darkWrapper],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;
type Story = StoryObj<typeof FileBrowser>;

// ═══════════════════════════════════════════════════════════════════════════
// Stories
// ═══════════════════════════════════════════════════════════════════════════

export const GridView: Story = {
  args: {
    files: sampleFiles,
    defaultViewMode: 'grid',
  },
};

export const ListView: Story = {
  args: {
    files: sampleFiles,
    defaultViewMode: 'list',
  },
};

export const Navigation: Story = {
  name: 'Navigation (folders)',
  render: () => (
    <FileBrowser
      files={sampleFiles}
      defaultViewMode="grid"
      onFileActivate={(file) => console.log('Activated:', file.name)}
    />
  ),
};

export const Selection: Story = {
  render: () => {
    const SelectionDemo = () => {
      const [selected, setSelected] = useState<string[]>([]);
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '8px 12px',
            fontFamily: 'monospace',
            fontSize: '10px',
            color: '#888',
            borderBottom: '1px solid #333',
            background: '#0a0a0a',
          }}>
            SELECTED: {selected.length > 0 ? selected.join(', ') : 'none'} | Ctrl+Click for multi-select | Ctrl+A for select all
          </div>
          <div style={{ flex: 1 }}>
            <FileBrowser
              files={sampleFiles}
              defaultViewMode="grid"
              onSelectionChange={setSelected}
            />
          </div>
        </div>
      );
    };
    return <SelectionDemo />;
  },
};

export const WithContextMenu: Story = {
  render: () => (
    <FileBrowser
      files={sampleFiles}
      defaultViewMode="grid"
      getContextMenuItems={(file) => {
        if (!file) {
          return [
            { id: 'new-folder', label: 'New Folder', icon: '\u{1F4C1}', action: () => console.log('New folder') },
            { id: 'new-file', label: 'New File', icon: '\u{1F4C4}', action: () => console.log('New file') },
            { id: 'sep1', label: '', separator: true },
            { id: 'paste', label: 'Paste', shortcut: '\u2318V', disabled: true, action: () => {} },
          ];
        }
        const items: ContextMenuItem[] = [
          { id: 'open', label: 'Open', action: () => console.log('Open:', file.name) },
          { id: 'sep1', label: '', separator: true },
          { id: 'copy', label: 'Copy', shortcut: '\u2318C', action: () => console.log('Copy:', file.name) },
          { id: 'cut', label: 'Cut', shortcut: '\u2318X', action: () => console.log('Cut:', file.name) },
          { id: 'sep2', label: '', separator: true },
          { id: 'rename', label: 'Rename', action: () => console.log('Rename:', file.name) },
          { id: 'delete', label: 'Delete', danger: true, shortcut: '\u232B', action: () => console.log('Delete:', file.name) },
        ];
        return items;
      }}
      onFileActivate={(file) => console.log('Activated:', file.name)}
    />
  ),
};

export const Search: Story = {
  render: () => (
    <FileBrowser
      files={sampleFiles}
      defaultViewMode="list"
      onFileActivate={(file) => console.log('Activated:', file.name)}
    />
  ),
  name: 'Search (type in search box)',
};

export const InWindow: Story = {
  render: () => (
    <div style={{
      width: '600px',
      height: '420px',
      margin: '20px auto',
      border: '1px solid var(--glia-color-border, #333)',
      borderRadius: 'var(--glia-radius-lg, 4px)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    }}>
      {/* Mock titlebar */}
      <div style={{
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        background: 'var(--glia-color-bg-panel, #111)',
        borderBottom: '1px solid var(--glia-color-border, #333)',
        fontFamily: 'var(--glia-font-display, serif)',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--glia-color-accent, #d4a84b)',
      }}>
        FILE BROWSER
      </div>
      <div style={{ flex: 1 }}>
        <FileBrowser
          files={sampleFiles}
          defaultViewMode="grid"
          onFileActivate={(file) => console.log('Activated:', file.name)}
        />
      </div>
    </div>
  ),
};

export const Empty: Story = {
  args: {
    files: [],
    defaultViewMode: 'grid',
  },
};

export const LargeDataset: Story = {
  args: {
    files: largeDataset,
    defaultViewMode: 'list',
    defaultSort: { field: 'name', order: 'asc' },
  },
  name: 'Large Dataset (200 items)',
};

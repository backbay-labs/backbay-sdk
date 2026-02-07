import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { desktopThemeFromUiTheme } from './bridge';
import { nebulaTheme } from './nebula';
import { solarpunkTheme } from './solarpunk';
import type { UiTheme } from './types';
import type { DesktopOSTheme } from '../desktop/themes/types';

const meta: Meta = {
  title: 'Theme/Bridge',
};

export default meta;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DarkWrapper = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      background: '#02040a',
      color: '#E5E7EB',
      padding: 40,
      fontFamily: 'monospace',
      fontSize: 12,
    }}
  >
    {children}
  </div>
);

function ColorSwatch({ label, value }: { label: string; value: string }) {
  const isTransparent =
    value.startsWith('rgba') || value.startsWith('hsla');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 4,
          background: value,
          border: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
          ...(isTransparent
            ? {
                backgroundImage: `linear-gradient(45deg, #222 25%, transparent 25%, transparent 75%, #222 75%), linear-gradient(45deg, #222 25%, transparent 25%, transparent 75%, #222 75%)`,
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 4px 4px',
                backgroundBlendMode: 'normal',
              }
            : {}),
        }}
      >
        {isTransparent && (
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 4,
              background: value,
            }}
          />
        )}
      </div>
      <span style={{ color: '#94A3B8', minWidth: 180 }}>{label}</span>
      <span style={{ color: '#64748B' }}>{value}</span>
    </div>
  );
}

function ShadowSwatch({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div
        style={{
          width: 60,
          height: 28,
          borderRadius: 4,
          background: '#0f1218',
          boxShadow: value,
          border: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}
      />
      <span style={{ color: '#94A3B8', minWidth: 140 }}>{label}</span>
      <span style={{ color: '#64748B', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  );
}

function TokenValue({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
      <span style={{ color: '#94A3B8', minWidth: 140 }}>{label}</span>
      <span style={{ color: '#64748B' }}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 10px', fontSize: 13, color: '#E5E7EB', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 6 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panels
// ---------------------------------------------------------------------------

function UiThemePanel({ theme }: { theme: UiTheme }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: 14, color: '#E5E7EB' }}>
        UiTheme: {theme.name}
      </h2>

      <Section title="Backgrounds">
        <ColorSwatch label="bg.body" value={theme.color.bg.body} />
        <ColorSwatch label="bg.panel" value={theme.color.bg.panel} />
        <ColorSwatch label="bg.elevated" value={theme.color.bg.elevated} />
      </Section>

      <Section title="Text">
        <ColorSwatch label="text.primary" value={theme.color.text.primary} />
        <ColorSwatch label="text.muted" value={theme.color.text.muted} />
        <ColorSwatch label="text.soft" value={theme.color.text.soft} />
      </Section>

      <Section title="Accents">
        <ColorSwatch label="accent.primary" value={theme.color.accent.primary} />
        <ColorSwatch label="accent.secondary" value={theme.color.accent.secondary} />
        <ColorSwatch label="accent.positive" value={theme.color.accent.positive} />
        <ColorSwatch label="accent.warning" value={theme.color.accent.warning} />
        <ColorSwatch label="accent.destructive" value={theme.color.accent.destructive} />
      </Section>

      <Section title="Glass">
        <ColorSwatch label="glass.panelBg" value={theme.glass.panelBg} />
        <ColorSwatch label="glass.hoverBg" value={theme.glass.hoverBg} />
        <ColorSwatch label="glass.activeBorder" value={theme.glass.activeBorder} />
      </Section>

      <Section title="Elevation">
        <ShadowSwatch label="softDrop" value={theme.elevation.softDrop} />
        <ShadowSwatch label="hudPanel" value={theme.elevation.hudPanel} />
        <ShadowSwatch label="modal" value={theme.elevation.modal} />
      </Section>

      <Section title="Motion">
        <TokenValue label="fast" value={`${theme.motion.fast.duration}s ${String(theme.motion.fast.ease)}`} />
        <TokenValue label="normal" value={`${theme.motion.normal.duration}s ${String(theme.motion.normal.ease)}`} />
        <TokenValue label="panelBlur" value={theme.glass.panelBlur} />
      </Section>
    </div>
  );
}

function DesktopThemePanel({ theme }: { theme: DesktopOSTheme }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: 14, color: '#E5E7EB' }}>
        DesktopOSTheme: {theme.name}
      </h2>

      <Section title="Colors">
        <ColorSwatch label="--glia-color-bg-panel" value={theme.colors.windowBg} />
        <ColorSwatch label="--glia-color-border" value={theme.colors.windowBorder} />
        <ColorSwatch label="--glia-glass-active-border" value={theme.colors.windowBorderFocused} />
        <ColorSwatch label="--glia-color-bg-panel" value={theme.colors.titlebarBg} />
        <ColorSwatch label="--glia-color-text-primary" value={theme.colors.titlebarText} />
        <ColorSwatch label="--glia-color-accent" value={theme.colors.accent} />
        <ColorSwatch label="--glia-glass-hover-bg" value={theme.colors.accentMuted} />
        <ColorSwatch label="--glia-glass-active-shadow" value={theme.colors.accentGlow} />
        <ColorSwatch label="--glia-glass-panel-bg" value={theme.colors.taskbarBg} />
        <ColorSwatch label="--glia-color-text-muted" value={theme.colors.taskbarText} />
        <ColorSwatch label="--glia-color-bg-elevated" value={theme.colors.startMenuBg} />
        <ColorSwatch label="--glia-color-bg-elevated" value={theme.colors.contextMenuBg} />
        <ColorSwatch label="--glia-glass-hover-bg" value={theme.colors.contextMenuHover} />
        <ColorSwatch label="--glia-color-bg-body" value={theme.colors.desktopBg} />
        <ColorSwatch label="--glia-color-text-muted" value={theme.colors.iconText} />
        <ColorSwatch label="--glia-glass-hover-bg" value={theme.colors.iconSelected} />
        <ColorSwatch label="--glia-color-accent-destructive" value={theme.colors.destructive} />
        <ColorSwatch label="--glia-color-accent-positive" value={theme.colors.success} />
        <ColorSwatch label="--glia-color-accent-warning" value={theme.colors.warning} />
        <ColorSwatch label="--glia-color-text-primary" value={theme.colors.textPrimary} />
        <ColorSwatch label="--glia-color-text-muted" value={theme.colors.textSecondary} />
        <ColorSwatch label="--glia-color-text-soft" value={theme.colors.textMuted} />
      </Section>

      <Section title="Shadows">
        <ShadowSwatch label="--glia-shadow-hud-panel" value={theme.shadows.window} />
        <ShadowSwatch label="--glia-shadow-modal" value={theme.shadows.windowFocused} />
        <ShadowSwatch label="--glia-shadow-hud-panel" value={theme.shadows.menu} />
        <ShadowSwatch label="--glia-shadow-soft" value={theme.shadows.tooltip} />
      </Section>

      <Section title="Animation">
        <TokenValue label="--glia-duration-fast" value={theme.animation.duration.fast} />
        <TokenValue label="--glia-duration-normal" value={theme.animation.duration.normal} />
        <TokenValue label="--glia-duration-slow" value={theme.animation.duration.slow} />
        <TokenValue label="--glia-easing-default" value={theme.animation.easing.default} />
        <TokenValue label="--glia-easing-spring" value={theme.animation.easing.spring} />
      </Section>

      <Section title="Other">
        <TokenValue label="--glia-blur-backdrop" value={theme.blur.backdrop} />
        <TokenValue label="--glia-font-display" value={theme.fonts.display} />
        <TokenValue label="--glia-radius-lg" value={theme.radii.window} />
        <TokenValue label="--glia-spacing-taskbar-height" value={theme.spacing.taskbarHeight} />
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

function BridgeView({ uiTheme }: { uiTheme: UiTheme }) {
  const desktopTheme = desktopThemeFromUiTheme(uiTheme);
  return (
    <DarkWrapper>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        <UiThemePanel theme={uiTheme} />
        <DesktopThemePanel theme={desktopTheme} />
      </div>
    </DarkWrapper>
  );
}

export const SideBySide: StoryObj = {
  render: () => <BridgeView uiTheme={nebulaTheme} />,
};

export const NebulaBridged: StoryObj = {
  render: () => {
    const desktopTheme = desktopThemeFromUiTheme(nebulaTheme);
    return (
      <DarkWrapper>
        <h2 style={{ margin: '0 0 20px', fontSize: 14 }}>
          Nebula --&gt; Bridged Desktop Theme
        </h2>
        <DesktopThemePanel theme={desktopTheme} />
      </DarkWrapper>
    );
  },
};

export const SolarpunkBridged: StoryObj = {
  render: () => {
    const desktopTheme = desktopThemeFromUiTheme(solarpunkTheme);
    return (
      <DarkWrapper>
        <h2 style={{ margin: '0 0 20px', fontSize: 14 }}>
          Solarpunk Observatory --&gt; Bridged Desktop Theme
        </h2>
        <DesktopThemePanel theme={desktopTheme} />
      </DarkWrapper>
    );
  },
};

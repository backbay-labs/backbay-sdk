/**
 * @backbay/bb-ui Desktop OS - Default Theme
 *
 * A sophisticated dark theme inspired by the Backbay "Gold + Steel" aesthetic.
 * Features gold accent colors, refined typography, and subtle glass effects.
 */

import type { DesktopOSTheme } from './types';

/**
 * Default desktop OS theme - "Gold + Steel"
 *
 * A dark, refined theme with:
 * - Gold primary accent (#d4a84b)
 * - Steel secondary accent (#4a6fa5)
 * - Elegant display fonts (Cinzel)
 * - Subtle shadows and glass effects
 */
export const defaultTheme: DesktopOSTheme = {
  id: 'gold-steel',
  name: 'Gold + Steel',

  colors: {
    // Window
    windowBg: '#0a0a0a',
    windowBorder: '#333333',
    windowBorderFocused: 'rgba(212, 168, 75, 0.25)',
    titlebarBg: '#111111',
    titlebarText: '#ffffff',

    // Accent
    accent: '#d4a84b',
    accentMuted: '#a67c35',
    accentGlow: 'rgba(212, 168, 75, 0.2)',

    // Taskbar
    taskbarBg: 'rgba(17, 17, 17, 0.8)',
    taskbarText: '#888888',

    // Menus
    startMenuBg: '#111111',
    contextMenuBg: '#111111',
    contextMenuHover: '#1a1a1a',

    // Desktop
    desktopBg: '#010100',
    iconText: '#cccccc',
    iconSelected: 'rgba(212, 168, 75, 0.15)',

    // Semantic
    destructive: '#c44444',
    success: '#4a9f5a',
    warning: '#d4a84b',

    // Text
    textPrimary: '#ffffff',
    textSecondary: '#cccccc',
    textMuted: '#888888',
  },

  fonts: {
    display: "'Cinzel', serif",
    body: "'Rajdhani', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },

  radii: {
    window: '3px',
    button: '2px',
    menu: '3px',
    input: '2px',
  },

  shadows: {
    window: '0 8px 32px rgba(0, 0, 0, 0.6)',
    windowFocused:
      '0 32px 80px -12px rgba(0, 0, 0, 0.6), 0 16px 40px -8px rgba(0, 0, 0, 0.4), 0 0 80px -20px rgba(212, 168, 75, 0.15)',
    menu: '0 4px 16px rgba(0, 0, 0, 0.5)',
    tooltip: '0 2px 8px rgba(0, 0, 0, 0.4)',
  },

  spacing: {
    windowPadding: '12px',
    taskbarHeight: '48px',
    iconSize: '64px',
    iconGap: '16px',
    titlebarHeight: '36px',
    windowBorderWidth: '2px',
  },

  animation: {
    duration: {
      fast: '100ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  blur: {
    backdrop: 'blur(12px)',
  },
};

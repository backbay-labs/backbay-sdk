/**
 * @backbay/glia Desktop OS - Clock Component
 *
 * System clock for the taskbar. Displays time in Roman numerals (Backbay style)
 * with a tooltip showing the full date on hover.
 *
 * Can be used standalone or within the DesktopOSProvider context.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Clock />
 *
 * // With custom format
 * <Clock format="standard" />
 *
 * // Styled with CSS variables
 * <Clock style={{ '--glia-font-mono': 'Monaco, monospace' }} />
 * ```
 */

import { useState, useEffect, type CSSProperties } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface ClockProps {
  /** Time display format */
  format?: 'roman' | 'standard' | '24h';
  /** Whether to show seconds */
  showSeconds?: boolean;
  /** Whether to show date tooltip on hover */
  showTooltip?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

// ═══════════════════════════════════════════════════════════════════════════
// Roman Numeral Conversion
// ═══════════════════════════════════════════════════════════════════════════

const ROMAN_NUMERALS: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

function toRomanNumeral(num: number): string {
  if (num <= 0) return 'N'; // nulla (0)
  let result = '';
  let remaining = num;
  for (const [value, symbol] of ROMAN_NUMERALS) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════

const styles: Record<string, CSSProperties> = {
  wrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    height: '100%',
  },
  clock: {
    fontFamily: 'var(--glia-font-mono)',
    fontSize: '13px',
    color: 'var(--glia-color-text-soft)',
    padding: '0 12px',
    letterSpacing: '0.05em',
    cursor: 'default',
    userSelect: 'none',
    transition: 'color var(--glia-duration-fast, 100ms) ease',
  },
  clockHover: {
    color: 'var(--glia-color-text-muted)',
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: '8px',
    padding: '8px 12px',
    background: 'var(--glia-color-bg-elevated, #111111)',
    border: '1px solid var(--glia-color-border, #333333)',
    borderRadius: 'var(--glia-radius-md, 3px)',
    fontFamily: 'var(--glia-font-body)',
    fontSize: '12px',
    color: 'var(--glia-color-text-muted)',
    whiteSpace: 'nowrap',
    boxShadow: 'var(--glia-shadow-soft)',
    zIndex: 10000,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export function Clock({
  format = 'roman',
  showSeconds = false,
  showTooltip: enableTooltip = true,
  className,
  style,
}: ClockProps) {
  const [time, setTime] = useState<Date | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Initialize on client side only (SSR-safe)
  useEffect(() => {
    setTime(new Date());

    const interval = setInterval(() => {
      setTime(new Date());
    }, showSeconds ? 1000 : 60000);

    return () => clearInterval(interval);
  }, [showSeconds]);

  // Don't render until client-side hydrated
  if (!time) return null;

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  let formattedTime: string;

  switch (format) {
    case 'roman': {
      const romanHours = toRomanNumeral(hours === 0 ? 24 : hours);
      const romanMinutes = toRomanNumeral(minutes);
      formattedTime = showSeconds
        ? `${romanHours}:${romanMinutes}:${toRomanNumeral(seconds)}`
        : `${romanHours}:${romanMinutes || 'N'}`;
      break;
    }
    case '24h': {
      const pad = (n: number) => n.toString().padStart(2, '0');
      formattedTime = showSeconds
        ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        : `${pad(hours)}:${pad(minutes)}`;
      break;
    }
    case 'standard':
    default: {
      const h = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const pad = (n: number) => n.toString().padStart(2, '0');
      formattedTime = showSeconds
        ? `${h}:${pad(minutes)}:${pad(seconds)} ${ampm}`
        : `${h}:${pad(minutes)} ${ampm}`;
      break;
    }
  }

  const fullDate = time.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      style={{ ...styles.wrapper, ...style }}
      className={className}
      onMouseEnter={() => {
        setShowTooltip(true);
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setShowTooltip(false);
        setIsHovered(false);
      }}
    >
      <div
        style={{
          ...styles.clock,
          ...(isHovered ? styles.clockHover : {}),
        }}
      >
        {formattedTime}
      </div>
      {enableTooltip && showTooltip && (
        <div style={styles.tooltip}>{fullDate}</div>
      )}
    </div>
  );
}

/**
 * Threat types detected by the radar system
 */
export type ThreatType = 'malware' | 'intrusion' | 'anomaly' | 'ddos' | 'phishing';

/**
 * Represents a single threat detected by the radar
 */
export interface Threat {
  /** Unique identifier for the threat */
  id: string;
  /** Angle in radians (0-2π) - position around the radar */
  angle: number;
  /** Distance from center 0-1 (0=center, 1=edge) */
  distance: number;
  /** Severity level 0-1 (0=low, 1=critical) */
  severity: number;
  /** Classification of the threat */
  type: ThreatType;
  /** Whether the threat is actively attacking */
  active: boolean;
  /** Optional label for the threat */
  label?: string;
  /** Timestamp when threat was first detected */
  detectedAt?: number;
}

/**
 * Props for the ThreatRadar component
 */
export interface ThreatRadarProps {
  /** List of detected threats to display */
  threats: Threat[];
  /** Radar scan speed in rotations per second (default: 0.5) */
  scanSpeed?: number;
  /** Radar radius in world units (default: 3) */
  radius?: number;
  /** Position of the radar in 3D space */
  position?: [number, number, number];
  /** Whether to show threat type labels (default: false) */
  showLabels?: boolean;
  /** Callback when a threat is clicked */
  onThreatClick?: (threat: Threat) => void;
  /** Callback when a threat is hovered */
  onThreatHover?: (threat: Threat | null) => void;
  /** Color of the radar sweep line and trail */
  sweepColor?: string;
  /** Color scheme for the radar grid */
  gridColor?: string;
  /** Whether to show the stats HUD (default: true) */
  showStats?: boolean;
  /** Enable ambient glow effects (default: true) */
  enableGlow?: boolean;
  /** Rotation offset for the entire radar */
  rotation?: [number, number, number];
}

/**
 * Internal props for the ThreatDot sub-component
 */
export interface ThreatDotProps {
  threat: Threat;
  radarRadius: number;
  showLabel: boolean;
  sweepAngle: number;
  onThreatClick?: (threat: Threat) => void;
  onThreatHover?: (threat: Threat | null) => void;
}

/**
 * Color mapping for different threat types
 */
export const THREAT_TYPE_COLORS: Record<ThreatType, string> = {
  malware: '#ff3344',
  intrusion: '#ff6622',
  anomaly: '#ffcc11',
  ddos: '#ff0088',
  phishing: '#aa44ff',
};

/**
 * Icons/labels for threat types
 */
export const THREAT_TYPE_LABELS: Record<ThreatType, string> = {
  malware: 'MALWARE',
  intrusion: 'INTRUSION',
  anomaly: 'ANOMALY',
  ddos: 'DDoS',
  phishing: 'PHISH',
};

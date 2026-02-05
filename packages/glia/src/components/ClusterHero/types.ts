export type ClusterId = 'alexandria' | 'alpha' | 'opus' | 'baia' | 'kdot' | 'aegis' | 'providence';

export type LiveModuleType = 'market' | 'live' | 'governance' | 'progress';

export interface ClusterConfig {
  id: ClusterId;
  name: string;
  tagline: string;
  latinMotto?: string;
  sigilSrc: string;
  videoSrc: string;
  videoPoster: string;
  accentColor: string;
  accentColorRGB: string;
  atmosphere: AtmosphereConfig;
  buttons: ButtonConfig[];

  // Briefing panel
  description: string;
  capabilities: [string, string, string];
  fastPath: { label: string; href: string };
  status: { network: string; verification: string; fees: string };

  // Live strip
  liveModule: LiveModuleType;
  liveContent?: string;

  // Metrics
  metrics: {
    realms: number;
    output24h: string;
    rank?: number;
  };
}

export interface AtmosphereConfig {
  dustMotes?: { colors: string[]; density: number; speed: number };
  fog?: { type: 'volumetric' | 'depth' | 'mist'; color: string; intensity: number };
  light?: { type: 'godrays' | 'bloom' | 'caustics'; color: string; intensity: number; source?: { x: number; y: number } };
}

export interface ButtonConfig {
  label: string;
  href: string;
  variant: 'primary' | 'secondary' | 'ghost';
  /** If true, opens in new tab with external link attributes */
  external?: boolean;
}

export interface ClusterHeroProps {
  cluster: ClusterId;
  className?: string;
}

export interface BriefingPanelProps {
  description: string;
  capabilities: [string, string, string];
  fastPath: { label: string; href: string };
  status: { network: string; verification: string; fees: string };
  accentColor: string;
  className?: string;
}

export interface SigilMonumentProps {
  name: string;
  tagline: string;
  latinMotto?: string;
  sigilSrc: string;
  accentColor: string;
  className?: string;
}

export interface LiveStripProps {
  moduleType: LiveModuleType;
  content?: string;
  accentColor: string;
  className?: string;
}

export interface ClusterRailProps {
  name: string;
  tagline: string;
  metrics: { realms: number; output24h: string; rank?: number };
  buttons: ButtonConfig[];
  accentColor: string;
  className?: string;
}

export interface StructuralElementsProps {
  accentColor: string;
  className?: string;
}

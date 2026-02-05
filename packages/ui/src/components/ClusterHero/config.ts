import type { ClusterConfig, ClusterId } from './types.js';

/**
 * Local development ports for each cluster app.
 * Used when NODE_ENV=development to route to localhost instead of subdomains.
 */
export const CLUSTER_DEV_PORTS: Record<ClusterId, number> = {
  alexandria: 3001,
  alpha: 3002,
  opus: 3003,
  baia: 3004,
  kdot: 3005,
  aegis: 3006,
  providence: 3007,
};

/**
 * Returns the docs URL for a cluster, respecting development vs production.
 * In development: http://localhost:{port}
 * In production: https://{cluster}.backbay.io
 */
export function getClusterDocsUrl(clusterId: ClusterId): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return `http://localhost:${CLUSTER_DEV_PORTS[clusterId]}`;
  }
  return `https://${clusterId}.backbay.io`;
}

export const CLUSTER_CONFIGS: Record<ClusterId, ClusterConfig> = {
  alexandria: {
    id: 'alexandria',
    name: 'Alexandria',
    tagline: 'Where knowledge compounds',
    latinMotto: 'SEQUERE FILUM',
    sigilSrc: '/sigils/alexandria.svg',
    videoSrc: '/videos/clusters/alexandria.mp4',
    videoPoster: '/videos/clusters/alexandria-poster.jpg',
    accentColor: '#C9A227',
    accentColorRGB: '201, 162, 39',
    atmosphere: {
      dustMotes: {
        colors: ['#C9A227', '#E8D5A3', '#8B7355'],
        density: 0.6,
        speed: 0.3,
      },
      light: {
        type: 'godrays',
        color: '#C9A227',
        intensity: 0.7,
        source: { x: 0.8, y: 0.1 },
      },
    },
    buttons: [
      { label: 'Launch', href: '/clusters/alexandria', variant: 'primary' },
      { label: 'Docs', href: 'https://alexandria.backbay.io', variant: 'secondary', external: true },
      { label: 'Governance', href: '/governance/alexandria', variant: 'ghost' },
    ],
    // Briefing
    description: 'The decentralized knowledge marketplace. Publish, lease, and compound intelligence artifacts.',
    capabilities: ['PUBLISH', 'LEASE', 'COMPOUND'],
    fastPath: { label: 'Start a Knowledge Compound', href: '/clusters/alexandria/compound/new' },
    status: { network: 'STABLE', verification: 'ON', fees: '2%' },
    // Live
    liveModule: 'market',
    liveContent: '3 new blueprints published today',
    // Metrics
    metrics: { realms: 847, output24h: '2.4M', rank: 12 },
  },

  alpha: {
    id: 'alpha',
    name: 'Alpha',
    tagline: 'Where signals become strategy',
    latinMotto: 'ALPHA IN MOTU',
    sigilSrc: '/sigils/alpha.svg',
    videoSrc: '/videos/clusters/alpha.mp4',
    videoPoster: '/videos/clusters/alpha-poster.jpg',
    accentColor: '#E8E8E8',
    accentColorRGB: '232, 232, 232',
    atmosphere: {
      fog: {
        type: 'volumetric',
        color: '#E8E8E8',
        intensity: 0.5,
      },
    },
    buttons: [
      { label: 'Launch', href: '/clusters/alpha', variant: 'primary' },
      { label: 'Docs', href: 'https://alpha.backbay.io', variant: 'secondary', external: true },
      { label: 'Governance', href: '/governance/alpha', variant: 'ghost' },
    ],
    // Briefing
    description: 'A social exchange for research-grade finance. Models, signals, and playbooks—shared, challenged, and refined in public.',
    capabilities: ['BACKTEST', 'PRICE', 'EXECUTE'],
    fastPath: { label: 'Explore strategy marketplace', href: '/clusters/alpha/market' },
    status: { network: 'STABLE', verification: 'ON', fees: '1.5%' },
    // Live
    liveModule: 'live',
    liveContent: 'Live: 218 strategies • 24h volume $3.1B',
    // Metrics
    metrics: { realms: 234, output24h: '4.8M', rank: 3 },
  },

  opus: {
    id: 'opus',
    name: 'Opus',
    tagline: 'Where care meets code',
    latinMotto: 'SALUS PER MACHINAM',
    sigilSrc: '/sigils/opus.svg',
    videoSrc: '/videos/clusters/opus.mp4',
    videoPoster: '/videos/clusters/opus-poster.jpg',
    accentColor: '#B87333',
    accentColorRGB: '184, 115, 51',
    atmosphere: {
      dustMotes: {
        colors: ['#B87333', '#D4956A', '#8B5A2B'],
        density: 0.8,
        speed: 0.2,
      },
      light: {
        type: 'bloom',
        color: '#B87333',
        intensity: 0.6,
      },
    },
    buttons: [
      { label: 'Launch', href: '/clusters/opus', variant: 'primary' },
      { label: 'Docs', href: 'https://opus.backbay.io', variant: 'secondary', external: true },
      { label: 'Governance', href: '/governance/opus', variant: 'ghost' },
    ],
    // Briefing
    description: 'The clinic-to-code commons. Practical health systems, shared and iterated together.',
    capabilities: ['DIAGNOSE', 'COORDINATE', 'PRODUCE'],
    fastPath: { label: 'Explore the Exchange', href: '/clusters/opus/exchange' },
    status: { network: 'STABLE', verification: 'HIPAA', fees: '2%' },
    // Live
    liveModule: 'live',
    liveContent: 'New: Autonomous diagnostic pipeline • 12 protocols deployed',
    // Metrics
    metrics: { realms: 156, output24h: '892K' },
  },

  baia: {
    id: 'baia',
    name: 'Baia',
    tagline: 'Where imagination renders',
    latinMotto: 'ARS EX MACHINA',
    sigilSrc: '/sigils/baia.svg',
    videoSrc: '/videos/clusters/baia.mp4',
    videoPoster: '/videos/clusters/baia-poster.jpg',
    accentColor: '#D4AF37',
    accentColorRGB: '212, 175, 55',
    atmosphere: {
      light: {
        type: 'godrays',
        color: '#D4AF37',
        intensity: 0.8,
        source: { x: 0.5, y: 0 },
      },
    },
    buttons: [
      { label: 'Launch', href: '/clusters/baia', variant: 'primary' },
      { label: 'Docs', href: 'https://baia.backbay.io', variant: 'secondary', external: true },
      { label: 'Governance', href: '/governance/baia', variant: 'ghost' },
    ],
    // Briefing
    description: 'A social market for generative culture. Artists and builders publish, collaborate, and curate evolving collections.',
    capabilities: ['GENERATE', 'COMPOSE', 'RENDER'],
    fastPath: { label: 'Open the Studio', href: '/clusters/baia/studio' },
    status: { network: 'STABLE', verification: 'ON', fees: '2.5%' },
    // Live
    liveModule: 'market',
    liveContent: 'Trending: Neural symphony generator • 847 works minted today',
    // Metrics
    metrics: { realms: 89, output24h: '124K', rank: 47 },
  },

  kdot: {
    id: 'kdot',
    name: 'KDoT',
    tagline: 'Kernel design of thought',
    latinMotto: 'MENS • MACHINA • DEUS',
    sigilSrc: '/sigils/kdot.svg',
    videoSrc: '/videos/clusters/kdot.mp4',
    videoPoster: '/videos/clusters/kdot-poster.jpg',
    accentColor: '#00D4AA',
    accentColorRGB: '0, 212, 170',
    atmosphere: {
      fog: {
        type: 'mist',
        color: '#00D4AA',
        intensity: 0.4,
      },
    },
    buttons: [
      { label: 'Launch', href: '/clusters/kdot', variant: 'primary' },
      { label: 'Docs', href: 'https://kdot.backbay.io', variant: 'secondary', external: true },
      { label: 'Status', href: '/status/kdot', variant: 'ghost' },
    ],
    // Briefing
    description: 'Compile thought into territory. Ship verifiable services. Forge living culture. Spin up economies.\nKernel Design of Thought: where creativity becomes industry.',
    capabilities: ['DESIGN', 'SYNTHESIZE', 'ALIGN'],
    fastPath: { label: 'Open the Kernel', href: '/clusters/kdot/topology' },
    status: { network: 'OPTIMAL', verification: 'ON', fees: '0.1%' },
    // Live
    liveModule: 'live',
    liveContent: 'The Cathedral awakens • 12 kernels compiled today',
    // Metrics
    metrics: { realms: 1247, output24h: '8.4PB', rank: 1 },
  },

  aegis: {
    id: 'aegis',
    name: 'Aegis',
    tagline: 'Shield of the realm',
    latinMotto: 'TUTELA PERPETUA',
    sigilSrc: '/sigils/aegis.svg',
    videoSrc: '/videos/clusters/aegis.mp4',
    videoPoster: '/videos/clusters/aegis-poster.jpg',
    accentColor: '#4A7BF7',
    accentColorRGB: '74, 123, 247',
    atmosphere: {
      light: {
        type: 'bloom',
        color: '#4A7BF7',
        intensity: 0.5,
      },
    },
    buttons: [
      { label: 'Launch', href: '/clusters/aegis', variant: 'primary' },
      { label: 'Docs', href: 'https://aegis.backbay.io', variant: 'secondary', external: true },
      { label: 'Audit', href: '/audit/aegis', variant: 'ghost' },
    ],
    // Briefing
    description: 'The EDR layer for agent economies. Aegis is a trust-minimized distributed security mesh to enable autonomous production at scale.',
    capabilities: ['PROTECT', 'DETECT', 'RESPOND'],
    fastPath: { label: 'View threat dashboard', href: '/clusters/aegis/threats' },
    status: { network: 'SECURE', verification: 'ENFORCED', fees: '1%' },
    // Live
    liveModule: 'governance',
    liveContent: 'Security Proposal #7 — Policy update pending review',
    // Metrics
    metrics: { realms: 312, output24h: '2.1B threats blocked', rank: 2 },
  },

  providence: {
    id: 'providence',
    name: 'Providence',
    tagline: 'Foresight is defense',
    latinMotto: 'PRAEVIDEO ERGO PROTEGO',
    sigilSrc: '/sigils/providence.svg',
    videoSrc: '/videos/clusters/providence.mp4',
    videoPoster: '/videos/clusters/providence-poster.jpg',
    accentColor: '#00D4AA',
    accentColorRGB: '0, 212, 170',
    atmosphere: {
      light: {
        type: 'godrays',
        color: '#00D4AA',
        intensity: 0.5,
        source: { x: 0.55, y: 0.05 },
      },
      fog: {
        type: 'mist',
        color: '#00D4AA',
        intensity: 0.25,
      },
    },
    buttons: [
      { label: 'Launch', href: '/clusters/providence', variant: 'primary' },
      { label: 'Docs', href: 'https://providence.backbay.io', variant: 'secondary', external: true },
      { label: 'Threat Intel', href: '/providence/threats', variant: 'ghost' },
    ],
    description: 'The EDR layer for agent economies. Aegis is a trust-minimized security distributed security for autonomous production.',
    capabilities: ['PREDICT', 'RESPOND', 'DEFEND'],
    fastPath: { label: 'View threat dashboard', href: '/clusters/providence/threats' },
    status: { network: 'SECURE', verification: 'ENFORCED', fees: '1%' },
    liveModule: 'live',
    liveContent: '24/7 monitoring active • 847K threats analyzed today',
    metrics: { realms: 96, output24h: '38K', rank: 19 },
  },
};

export function getClusterConfig(clusterId: ClusterId): ClusterConfig {
  return CLUSTER_CONFIGS[clusterId];
}

/**
 * Returns cluster config with docs URLs resolved for the current environment.
 * Call this on the client side to get URLs that work in development.
 */
export function getClusterConfigWithResolvedUrls(clusterId: ClusterId): ClusterConfig {
  const config = CLUSTER_CONFIGS[clusterId];
  const docsUrl = getClusterDocsUrl(clusterId);

  return {
    ...config,
    buttons: config.buttons.map(button =>
      button.label === 'Docs'
        ? { ...button, href: docsUrl }
        : button
    ),
  };
}

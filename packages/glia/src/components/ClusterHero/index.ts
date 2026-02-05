// Types
export type {
  ClusterId,
  ClusterConfig,
  AtmosphereConfig,
  ButtonConfig,
  ClusterHeroProps,
  ClusterRailProps,
  BriefingPanelProps,
  SigilMonumentProps,
  LiveStripProps,
  LiveModuleType,
} from './types.js';

// Config
export {
  CLUSTER_CONFIGS,
  CLUSTER_DEV_PORTS,
  getClusterConfig,
  getClusterDocsUrl,
  getClusterConfigWithResolvedUrls,
} from './config.js';

// Sub-components
export { ClusterAtmosphere, type ClusterAtmosphereProps } from './ClusterAtmosphere.js';
export { GradientVeil, type GradientVeilProps } from './GradientVeil.js';
export { HeroContent, type HeroContentProps } from './HeroContent.js';
export { ScrollIndicator, type ScrollIndicatorProps } from './ScrollIndicator.js';
export { StructuralElements, type StructuralElementsProps } from './StructuralElements.js';
export { VideoBackground, type VideoBackgroundProps } from './VideoBackground.js';
export { ClusterRail } from './ClusterRail.js';
export { BriefingPanel } from './BriefingPanel.js';
export { SigilMonument } from './SigilMonument.js';
export { LiveStrip } from './LiveStrip.js';

// Hooks
export {
  useVideoPreload,
  type UseVideoPreloadOptions,
  type UseVideoPreloadResult,
} from './useVideoPreload.js';

// Section components
export {
  FeatureCardsSection,
  ClusterStatsSection,
  CTASection,
  ClusterHeroPage,
  type ClusterHeroPageProps,
} from './ClusterHeroPage.js';

// Main component
export { ClusterHero } from './ClusterHero.js';
export { default } from './ClusterHero.js';

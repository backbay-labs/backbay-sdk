import { PERFORMANCE_PRESETS, type PerformanceTier, type PerformanceConfig } from './types';

export function detectPerformanceTier(): PerformanceTier {
  if (typeof window === 'undefined') return 'medium';

  // Check reduced motion first
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'minimal';
  }

  // Check device memory (Chrome only)
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (nav.deviceMemory && nav.deviceMemory < 4) {
    return 'low';
  }

  // Check hardware concurrency
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    return 'low';
  }

  // Check if mobile
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) return 'low';

  // Default to medium
  return 'medium';
}

export function getPerformanceConfig(tier?: PerformanceTier): PerformanceConfig {
  const detected = tier ?? detectPerformanceTier();
  return PERFORMANCE_PRESETS[detected];
}

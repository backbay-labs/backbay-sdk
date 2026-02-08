export interface MetricNode {
  id: string;
  label: string;
  value: number;
  unit: string;          // "%", "ms", "MB", "req/s"
  trend: number;         // positive = up, negative = down
  threshold?: { warn: number; critical: number };
  history?: number[];    // sparkline data (last N values)
  category?: string;     // for grouping/coloring
}

export interface MetricConnection {
  from: string;
  to: string;
  strength?: number;     // 0-1, affects line opacity
}

export interface MetricsGalaxyProps {
  metrics: MetricNode[];
  connections?: MetricConnection[];
  layout?: "galaxy" | "grid" | "radial";
  onMetricClick?: (id: string) => void;
  onMetricHover?: (id: string | null) => void;
  highlightedId?: string | null;
  autoRotate?: boolean;
}

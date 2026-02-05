/**
 * IntelFeed Types
 *
 * Type definitions for threat intelligence feed visualization.
 */

export interface IntelItem {
  id: string;
  source: string;
  type: "ioc" | "vulnerability" | "campaign" | "actor" | "tool" | "report";
  severity: "info" | "low" | "medium" | "high" | "critical";
  title: string;
  summary?: string;
  timestamp: Date;
  relevance?: number;
  actionRequired?: boolean;
}

export interface IntelSource {
  id: string;
  name: string;
  type: "commercial" | "osint" | "isac" | "government" | "internal";
  reliability: number;
  logo?: string;
}

export interface IntelFeedProps {
  items: IntelItem[];
  sources: IntelSource[];
  maxItems?: number;
  filterSeverity?: string[];
  filterSources?: string[];
  onItemClick?: (item: IntelItem) => void;
  layout?: "waterfall" | "timeline" | "grid";
  autoScroll?: boolean;
  bounds?: { width: number; height: number };
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const INTEL_SEVERITY_COLORS: Record<IntelItem["severity"], string> = {
  info: "#5eead4",
  low: "#60a5fa",
  medium: "#fbbf24",
  high: "#f97316",
  critical: "#ef4444",
};

export const INTEL_TYPE_LABELS: Record<IntelItem["type"], string> = {
  ioc: "IOC",
  vulnerability: "Vuln",
  campaign: "Campaign",
  actor: "Actor",
  tool: "Tool",
  report: "Report",
};

/**
 * FirewallBarrier Types
 *
 * Type definitions for firewall rule visualization component.
 */

export interface FirewallRule {
  id: string;
  name: string;
  action: "allow" | "deny" | "log";
  source: string;
  destination: string;
  port?: number | "any";
  protocol: "tcp" | "udp" | "icmp" | "any";
  hits: number;
  lastHit?: Date;
}

export interface FirewallTraffic {
  id: string;
  source: string;
  destination: string;
  port: number;
  protocol: string;
  action: "allowed" | "blocked";
  timestamp: Date;
  ruleId?: string;
}

export interface FirewallBarrierProps {
  rules: FirewallRule[];
  recentTraffic?: FirewallTraffic[];
  orientation?: "vertical" | "horizontal";
  showRuleLabels?: boolean;
  animateTraffic?: boolean;
  onRuleClick?: (rule: FirewallRule) => void;
  blockedColor?: string;
  allowedColor?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

export const FIREWALL_ACTION_COLORS: Record<FirewallRule["action"], string> = {
  allow: "#22ff88",
  deny: "#ff4455",
  log: "#ffb347",
};

export const FIREWALL_TRAFFIC_COLORS: Record<FirewallTraffic["action"], string> = {
  allowed: "#22ff88",
  blocked: "#ff4455",
};

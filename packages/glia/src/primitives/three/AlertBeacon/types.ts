export type AlertSeverity = "info" | "warning" | "critical" | "resolved";

export interface AlertBeaconProps {
  severity: AlertSeverity;
  label?: string;
  message?: string;
  pulse?: boolean;         // default true
  ripples?: boolean;       // expanding ring ripples
  size?: number;           // base scale, default 1
  onClick?: () => void;
}

export interface ResourceMeterProps {
  value: number;           // 0-100 percentage
  label: string;
  unit?: string;           // "GB", "%", "tokens"
  maxValue?: number;       // display value (e.g., 8 for 8GB)
  currentValue?: number;   // display value (e.g., 5.2 for 5.2GB)
  thresholds?: { warn: number; critical: number };  // percentage thresholds
  showLabel?: boolean;
  animate?: boolean;
  size?: "sm" | "md" | "lg";
}

export type EventType = "info" | "success" | "warning" | "error" | "system";

export interface StreamEvent {
  id: string;
  type: EventType;
  label: string;
  timestamp: number; // unix ms
  value?: number; // optional magnitude
  metadata?: Record<string, string>;
}

export interface DataStreamProps {
  events: StreamEvent[];
  maxVisible?: number; // how many events visible at once (default 50)
  speed?: number; // flow speed multiplier (default 1)
  streamShape?: "ribbon" | "helix" | "arc";
  onEventClick?: (id: string) => void;
  onEventHover?: (id: string | null) => void;
  highlightType?: EventType | null;
  paused?: boolean;
}

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  info: "#22D3EE", // cyan
  success: "#10B981", // emerald
  warning: "#F59E0B", // amber
  error: "#F43F5E", // red/magenta
  system: "#8B5CF6", // violet
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  info: "INFO",
  success: "SUCCESS",
  warning: "WARNING",
  error: "ERROR",
  system: "SYSTEM",
};

export type EventCategory = "MARKET" | "OPS" | "VERIFY" | "SECURITY" | "PLAY";
export type EventSeverity = "info" | "warn" | "critical";

export interface EventRef {
  app: string;
  entity_type: string;
  entity_id: string;
}

export interface LiveEvent {
  event_id: string;
  category: EventCategory;
  title: string;
  severity: EventSeverity;
  timestamp: string;
  ref: EventRef;
}

export function generateEventId(): string {
  return `EVT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export function nowTimestamp(): string {
  return new Date().toISOString();
}


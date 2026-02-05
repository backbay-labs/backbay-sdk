export type HealthStatus = "healthy" | "degraded" | "unhealthy";
export type DatabaseStatus = "connected" | "disconnected";

export interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  version: string;
  database: DatabaseStatus;
  uptime: number;
}

export interface ReadyResponse {
  ready: boolean;
  timestamp: string;
}

export type IdentityKind = "user" | "guest";

export interface MeResponse {
  kind: IdentityKind;
  userId: string;
  isGuest: boolean;
  role: string;
  email: string | null;
}


/**
 * Mission domain contracts for Origin (Out-of-Scope).
 * Dates are represented as ISO strings for client/server interoperability.
 */
export type MissionStatus = "active" | "completed" | "paused" | "archived";

export type MissionMode =
  | "exam_prep"
  | "foundational"
  | "maintenance"
  | "deep_dive";

export type MissionSeason = "STUDY" | "SHIP" | "RECOVER";

export interface MissionSummary {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: MissionStatus;
  startDate: string;
  endDate: string | null;
  mode?: MissionMode;
  season?: MissionSeason;
  domainIds: string[];
  objectiveIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMissionRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  mode?: string;
  season?: string;
  priority?: string;
  domainIds?: string[];
  objectiveIds?: string[];
}

export interface MissionItem {
  id: string;
  missionId: string;
  type: string;
  title: string | null;
  description: string | null;
  orderIndex: number;
  status: string;
  phase: string | null;
  estimatedMinutes: number | null;
  isRequired: boolean;
  topicId: string | null;
  objectiveId: string | null;
  createdAt: string;
  updatedAt: string;
}

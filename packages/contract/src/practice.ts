/**
 * Practice domain contracts for Origin (Out-of-Scope).
 * Dates are represented as ISO strings for client/server interoperability.
 */

// ─────────────────────────────────────────────────────────────
// Session enums
// ─────────────────────────────────────────────────────────────

export type PracticeSessionStatus = "in_progress" | "completed" | "abandoned";

// ─────────────────────────────────────────────────────────────
// Event enums
// ─────────────────────────────────────────────────────────────

export type PracticeEventType =
  | "SESSION_STARTED"
  | "SESSION_COMPLETED"
  | "SESSION_ABANDONED"
  | "QUESTION_ANSWERED"
  | "HINT_USED"
  | "OBJECTIVE_MASTERED"
  | "DOMAIN_MILESTONE_REACHED"
  | "STREAK_EXTENDED"
  | "STREAK_BROKEN";

// ─────────────────────────────────────────────────────────────
// Practice Session
// ─────────────────────────────────────────────────────────────

export interface PracticeSession {
  id: string;
  userId: string;
  studyPlanId: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  score: number | null;
  status: PracticeSessionStatus;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Answer
// ─────────────────────────────────────────────────────────────

export interface Answer {
  id: string;
  sessionId: string;
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  hintsUsed: number;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Practice Event
// ─────────────────────────────────────────────────────────────

export interface PracticeEvent {
  id: string;
  userId: string;
  type: PracticeEventType;
  occurredAt: string;
  practiceSessionId: string | null;
  questionId: string | null;
  metadata: unknown | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// Request types
// ─────────────────────────────────────────────────────────────

export interface StartSessionRequest {
  missionId?: string;
  missionItemId?: string;
  scheduledBlockId?: string;
  objectiveIds?: string[];
}

export interface SubmitAnswerRequest {
  questionId: string;
  userAnswer: string;
  timeSpent: number;
  hintsUsed?: number;
}

/**
 * Progress domain contracts for Origin (Out-of-Scope).
 * Dates are represented as ISO strings for client/server interoperability.
 */

// ─────────────────────────────────────────────────────────────
// Mastery level enum
// ─────────────────────────────────────────────────────────────

export type MasteryLevel = "none" | "learning" | "familiar" | "mastered";

// ─────────────────────────────────────────────────────────────
// Streak metric enum
// ─────────────────────────────────────────────────────────────

export type StreakMetric = "DAILY_STUDY" | "QUESTIONS_PER_DAY";

// ─────────────────────────────────────────────────────────────
// Progress Summary (legacy/simple)
// ─────────────────────────────────────────────────────────────

export interface ProgressSummary {
  readinessPct: number;
  daysToExam: number;
  weakestDomain: string;
  streak: number;
}

// ─────────────────────────────────────────────────────────────
// Progress Overview
// ─────────────────────────────────────────────────────────────

export interface ProgressOverview {
  totalQuestions: number;
  totalTimeSpent: number;
  accuracy: number;
  currentStreak: number;
  sessionsCompleted: number;
}

// ─────────────────────────────────────────────────────────────
// Domain Progress
// ─────────────────────────────────────────────────────────────

export interface DomainProgress {
  domainId: string;
  domainName: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  objectiveCount: number;
}

// ─────────────────────────────────────────────────────────────
// Objective Progress
// ─────────────────────────────────────────────────────────────

export interface ObjectiveProgress {
  objectiveId: string;
  objectiveTitle: string;
  domainId: string;
  domainName: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  masteryLevel: MasteryLevel;
}

// ─────────────────────────────────────────────────────────────
// Streak
// ─────────────────────────────────────────────────────────────

export interface StreakInfo {
  metric: StreakMetric;
  length: number;
  isActive?: boolean;
}

export interface StreaksResponse {
  current: StreakInfo;
  best: StreakInfo;
}

// ─────────────────────────────────────────────────────────────
// Milestone
// ─────────────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  name: string;
  achievedAt: string;
}

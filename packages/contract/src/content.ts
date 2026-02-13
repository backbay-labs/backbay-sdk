/**
 * Content domain contracts for Origin (Out-of-Scope).
 * Dates are represented as ISO strings for client/server interoperability.
 */

// ─────────────────────────────────────────────────────────────
// Question enums
// ─────────────────────────────────────────────────────────────

export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "ESSAY"
  | "CASE_STEP";

export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";

// ─────────────────────────────────────────────────────────────
// Resource enums
// ─────────────────────────────────────────────────────────────

export type ResourceType =
  | "QUESTION"
  | "FLASHCARD"
  | "CASE"
  | "READING"
  | "VIDEO"
  | "IMAGE"
  | "LINK";

// ─────────────────────────────────────────────────────────────
// Domain
// ─────────────────────────────────────────────────────────────

export interface ContentDomain {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Topic
// ─────────────────────────────────────────────────────────────

export interface Topic {
  id: string;
  domainId: string;
  title: string;
  description: string | null;
  parentTopicId: string | null;
  color: string | null;
  icon: string | null;
  slug: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Learning Objective
// ─────────────────────────────────────────────────────────────

export interface Objective {
  id: string;
  domainId: string;
  topicId: string | null;
  title: string;
  description: string | null;
  difficulty: string;
  estimatedHours: number | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Question
// ─────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  objectiveId: string;
  type: QuestionType;
  question: string;
  options: unknown | null;
  correctAnswer: string | null;
  explanation: string | null;
  difficulty: QuestionDifficulty;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Resource
// ─────────────────────────────────────────────────────────────

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  description: string | null;
  uri: string | null;
  metadata: unknown | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Tag
// ─────────────────────────────────────────────────────────────

export interface ContentTag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

/**
 * @file Types for appeal-related components and pages.
 */

// Common types used in both console and student-ui
export enum AppealStatus {
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  PENDING = "PENDING",
}

export type AppealAttempt = {
  id: number;
  newFileSubmissionId?: number;
  assignmentConfigId: number;
  userId: number;
  createdAt: string;
  status: AppealStatus;
  updatedAt: string;
};

export type AppealMessage = {
  id: number;
  message: string;
  createdAt: string;
  senderId: number;
  attemptId: number;
  isRead: boolean;
};

export type ChangeLog = {
  id: number;
  createdAt: string;
  type: ChangeLogTypes;
  originalState: { score: number } | { status: string } | { submission: number };
  updatedState: { score: number } | { status: string } | { submission: number };
  initiatedBy: number; // User ID
  reason: string;
  appealId?: number;
  assignmentConfigId: number;
  userId: number;
};

export enum ChangeLogTypes {
  APPEAL_STATUS = "APPEAL_STATUS",
  SCORE = "SCORE",
  SUBMISSION = "SUBMISSION",
}

// Unique types in student-ui
export type AppealLog = {
  id: number;
  appealId?: number;
  type: ChangeLogTypes | "APPEAL_SUBMISSION";
  date: string;
  originalState?: string;
  updatedState?: string;
  reason?: string;
};

export type DisplayMessageType = {
  id: number;
  content: string;
  name: string;
  type: "Student" | "Teaching Assistant";
  time: string;
};

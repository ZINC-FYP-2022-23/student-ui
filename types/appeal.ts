// Common types used in both console and student-ui
export enum AppealStatus {
  Accept = "Accepted",
  Reject = "Rejected",
  Pending = "Pending",
}

// Any updates on `AppealAttempt` have to update function `isAppealAttempt()`
export type AppealAttempt = {
  id: number;
  newFileSubmissionId?: string;
  submissionId: number;
  createdAt: Date;
  latestStatus: AppealStatus;
  changeLog: ChangeLog[];
  decisionTimestamp?: Date;
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
  createdAt: Date;
  type: ChangeLogTypes;
  originalState: string;
  updatedState: string;
  initiatedBy: number; // User ID
  reason?: string;

  appealId?: number;
};

export enum ChangeLogTypes {
  APPEAL_STATUS,
  SCORE,
  SUBMISSION,
}

// Unique types in student-ui
export type AppealLog = {
  id: number;
  type: ChangeLogTypes | "APPEAL_SUBMISSION";
  date: Date;
  updatedState?: string;
};

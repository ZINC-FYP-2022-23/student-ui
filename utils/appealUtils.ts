import { Submission as SubmissionType } from "types";
import {
  AppealAttempt,
  AppealLog,
  AppealMessage,
  DisplayMessageType,
  ChangeLog,
  ChangeLogTypes,
  AppealStatus,
} from "@/types/appeal";
import { DataResult } from "@remix-run/router/dist/utils";

export function isAppealLog(obj: any): obj is AppealLog {
  return "id" in obj && "type" in obj && "date" in obj;
}

export function isDisplayMessageType(obj: any): obj is DisplayMessageType {
  return "id" in obj && "content" in obj && "name" in obj && "type" in obj && "time" in obj;
}

export function isAppealMessage(obj: any): obj is AppealMessage {
  return (
    "id" in obj && "message" in obj && "createdAt" in obj && "senderId" in obj && "attemptId" in obj && "isRead" in obj
  );
}

interface sortProps {
  submissions?: SubmissionType[];
  messages?: DisplayMessageType[];
  appealLog: AppealLog[];
}

export function sort({ submissions, messages, appealLog }: sortProps) {
  let allLog: (
    | (SubmissionType & { _type: "submission" })
    | (DisplayMessageType & { _type: "appealMessage" })
    | (AppealLog & { _type: "appealLog" })
  )[] = [];

  if (messages) allLog = allLog.concat(messages.map((m) => ({ ...m, _type: "appealMessage" })));
  if (appealLog) allLog = allLog.concat(appealLog.map((a) => ({ ...a, _type: "appealLog" })));
  if (submissions) allLog = allLog.concat(submissions.map((s) => ({ ...s, _type: "submission" })));

  allLog = allLog.sort((a, b) => {
    const getDate = (
      x:
        | (SubmissionType & { _type: "submission" })
        | (DisplayMessageType & { _type: "appealMessage" })
        | (AppealLog & { _type: "appealLog" }),
    ) => {
      if (x._type === "appealMessage") return new Date(x.time);
      else if (x._type === "submission") return new Date(x.created_at);
      else return new Date(x.date);
    };

    let aDate: Date = getDate(a);
    let bDate: Date = getDate(b);

    if (aDate > bDate) {
      return -1;
    } else if (aDate < bDate) {
      return 1;
    } else {
      return 0;
    }
  });

  return allLog;
}

interface transformStateType {
  type: ChangeLogTypes | "APPEAL_SUBMISSION";
  state: string;
}

function transformState({ type, state }: transformStateType) {
  if (type === ChangeLogTypes.APPEAL_STATUS) {
    if (state === "[{'status':ACCEPTED}]") {
      return AppealStatus.Accept;
    } else if (state === "[{'status':REJECTED}]") {
      return AppealStatus.Reject;
    } else if (state === "[{'status':PENDING}]") {
      return AppealStatus.Pending;
    } else {
      return "Error: Appeal Status is unknown: " + state;
    }
  }

  if (type === ChangeLogTypes.SCORE) {
    let score = state.match(/(\d+)/);
    if (score && score[0]) {
      return score[0].toString();
    } else {
      return "Error: Score change is unknown: " + state;
    }
  }

  return state;
}

interface transformToAppealLogProps {
  appeals: AppealAttempt[];
  changeLog: ChangeLog[];
}

export function transformToAppealLog({ appeals, changeLog }: transformToAppealLogProps): AppealLog[] {
  let appealLog: AppealLog[] = [];
  let log: AppealLog;

  appeals.forEach((appeal) => {
    appealLog.push({
      id: appeal.id,
      type: "APPEAL_SUBMISSION",
      date: appeal.createdAt,
    });
  });

  changeLog.forEach((log) => {
    let originalState: AppealStatus | string = transformState({ type: log.type, state: log.originalState });
    let updatedStatus: AppealStatus | string = transformState({ type: log.type, state: log.updatedState });

    appealLog.push({
      id: log.id,
      type: log.type,
      date: log.createdAt,
      originalState: originalState,
      updatedState: updatedStatus,
    });
  });

  appealLog = appealLog.sort((a, b) => {
    if (a.date > b.date) {
      return -1;
    } else if (a.date < b.date) {
      return 1;
    } else {
      return 0;
    }
  });

  return appealLog;
}

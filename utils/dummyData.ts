import { AppealStatus, AppealAttempt, DisplayMessageType, ChangeLog, ChangeLogTypes } from "@/types/appeal";

// TODO(BRYAN): Remove the dummy data and replace with GraphQL codes
//The followings is dummy data for the student UI.

export const numAppealsLeft: number = 1;

export const appealStatus: AppealStatus = AppealStatus.Accept;

export const appeal: AppealAttempt | null = {
  id: 1,
  assignmentConfigAndUserId: 999,
  createdAt: "2022-12-20",
  latestStatus: AppealStatus.Reject,
  updatedAt: "2022-12-21",
};

export const messageList: DisplayMessageType[] = [
  {
    id: 1,
    name: "Lo Kwok Yan Bryan",
    type: "Student",
    time: "14 Nov 2022, 18:11",
    content: "Hi TA, I want to submit a grade appeal.",
  },
  {
    id: 2,
    name: "Gilbert Chan",
    type: "Teaching Assistant",
    time: "15 Nov 2022, 20:59",
    content: "Dear Bryan, Nice to Meet You!",
  },
  {
    id: 3,
    name: "Lo Kwok Yan Bryan",
    type: "Student",
    time: "14 Nov 2022, 18:11",
    content: "Hi TA, I want to submit a grade appeal.",
  },
  {
    id: 4,
    name: "Gilbert Chan",
    type: "Teaching Assistant",
    time: "15 Nov 2022, 20:59",
    content: "Okie, chekcing!",
  },
  {
    id: 5,
    name: "Lo Kwok Yan Bryan",
    type: "Student",
    time: "14 Nov 2022, 18:11",
    content: "Thank you.",
  },
  {
    id: 6,
    name: "Gilbert Chan",
    type: "Teaching Assistant",
    time: "15 Nov 2022, 20:59",
    content: "Still in process!",
  },
];

export const appealAttempts: AppealAttempt[] = [
  {
    id: 1001,
    assignmentConfigAndUserId: 999,
    createdAt: "2022-11-13",
    latestStatus: AppealStatus.Reject,
    updatedAt: "2022-11-14",
  },
  {
    id: 1002,
    assignmentConfigAndUserId: 999,
    createdAt: "2022-11-15",
    latestStatus: AppealStatus.Accept,
    updatedAt: "2022-11-16",
  },
];

export const changeLogList: ChangeLog[] = [
  {
    id: 2001,
    createdAt: "2022-11-14",
    type: ChangeLogTypes.APPEAL_STATUS,
    originalState: "[{'status':PENDING}]",
    updatedState: "[{'status':REJECTED}]",
    initiatedBy: 2,
  },
  {
    id: 2002,
    createdAt: "2022-11-15",
    type: ChangeLogTypes.APPEAL_STATUS,
    originalState: "[{'status':REJECTED}]",
    updatedState: "[{'status':ACCEPTED}]",
    initiatedBy: 2,
  },
  {
    id: 2003,
    createdAt: "2022-11-16",
    type: ChangeLogTypes.SCORE,
    originalState: "[{'score':80}]",
    updatedState: "[{'score':100}]",
    initiatedBy: 2,
  },
  {
    id: 2004,
    createdAt: "2022-11-17",
    type: ChangeLogTypes.SUBMISSION,
    originalState: "[{'submission':'old'}]",
    updatedState: "[{'submission':'new'}]",
    initiatedBy: 2,
  },
];

import { gql } from "@apollo/client";

/* Queries used in `Assignment Page` */
export const GET_APPEALS_DETAILS_BY_ASSIGNMENT_ID = gql`
  subscription getAppealDetailsList($userId: bigint!, $assignmentConfigId: bigint!) {
    appeals(
      where: { userId: { _eq: $userId }, assignmentConfigId: { _eq: $assignmentConfigId } }
      order_by: { createdAt: desc }
    ) {
      createdAt
      id
      newFileSubmissionId
      status
      updatedAt
      userId
      assignmentConfigId
      user {
        id
        name
        itsc
        submissions(
          where: { assignment_config_id: { _eq: $assignmentConfigId }, user_id: { _eq: $userId } }
          order_by: { created_at: desc }
        ) {
          id
          reports(order_by: { createdAt: desc }, limit: 1) {
            grade
          }
        }
      }
      submission {
        reports(order_by: { createdAt: desc }, limit: 1) {
          grade
        }
      }
    }
  }
`;

export const GET_APPEAL_CHANGE_LOGS_BY_ASSIGNMENT_ID = gql`
  subscription getChangeLogs($userId: bigint!, $assignmentConfigId: bigint!) {
    changeLogs(
      where: { userId: { _eq: $userId }, assignmentConfigId: { _eq: $assignmentConfigId } }
      order_by: { createdAt: desc }
    ) {
      appealId
      assignmentConfigId
      createdAt
      id
      initiatedBy
      originalState
      reason
      reportId
      submissionId
      type
      updatedState
      userId
    }
  }
`;
/* End of Queries used in `Assignment Page */

export const GET_APPEAL_CONFIG = gql`
  query getAppealConfig($assignmentConfigId: bigint!) {
    assignmentConfig(id: $assignmentConfigId) {
      appealLimits
      isAppealAllowed
      isAppealStudentReplyAllowed
      appealStartAt
      appealStopAt
      isAppealViewReportAllowed
    }
  }
`;

/* Queries used in `Appeal Details Page` */
export const GET_ASSIGNMENT_CONFIG_ID_BY_APPEAL_ID = gql`
  query getAppealDetails($appealId: bigint!) {
    appeal(id: $appealId) {
      assignmentConfigId
    }
  }
`;

export const GET_APPEAL_DETAILS_BY_APPEAL_ID = gql`
  subscription getAppealDetails($appealId: bigint!) {
    appeal(id: $appealId) {
      id
      assignmentConfigId
      createdAt
      newFileSubmissionId
      status
      updatedAt
      userId
      user {
        name
        itsc
        hasTeachingRole
        isAdmin
      }
    }
  }
`;

export const GET_APPEAL_CHANGE_LOGS_BY_APPEAL_ID = gql`
  subscription getChangeLogs($appealId: bigint!) {
    changeLogs(where: { appealId: { _eq: $appealId } }, order_by: { createdAt: desc }) {
      assignmentConfigId
      appealId
      createdAt
      id
      initiatedBy
      originalState
      reason
      reportId
      submissionId
      type
      updatedState
      userId
    }
  }
`;

export const GET_APPEAL_MESSAGES = gql`
  subscription getAppealMessages($appealId: bigint!) {
    appealMessages(where: { appealId: { _eq: $appealId } }, order_by: { createdAt: desc }) {
      createdAt
      id
      isRead
      message
      senderId
      user {
        isAdmin
        name
        itsc
        hasTeachingRole
      }
    }
  }
`;
/* End of Queries used in `Appeal Details Page` */

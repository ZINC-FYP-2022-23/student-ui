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

export const GET_APPEALS_BY_USER_ID_AND_ASSIGNMENT_ID = gql`
  subscription getAllUserAppeals($userId: bigint!, $assignmentConfigId: bigint!) {
    appeals(
      order_by: { createdAt: desc }
      where: { userId: { _eq: $userId }, assignmentConfigId: { _eq: $assignmentConfigId } }
    ) {
      id
      newFileSubmissionId
      assignmentConfigId
      createdAt
      status
      updatedAt
      userId
    }
  }
`;

export const GET_SUBMISSIONS_BY_ASSIGNMENT_AND_USER_ID = gql`
  query getAssignmentSubmissions($assignmentConfigId: bigint!, $userId: bigint!) {
    submissions(
      where: { assignment_config_id: { _eq: $assignmentConfigId }, user_id: { _eq: $userId } }
      order_by: { created_at: desc }
    ) {
      id
      assignment_config_id
      reports(order_by: { createdAt: desc }, limit: 1) {
        id
        grade
      }
    }
  }
`;

export const GET_IDS_BY_APPEAL_ID = gql`
  query getIds($appealId: bigint!) {
    appeal(id: $appealId) {
      id
      assignmentConfigId
      assignment_config {
        id
        assignment {
          id
          course_id
        }
      }
      newFileSubmissionId
      userId
      submission {
        reports(order_by: { createdAt: desc }, limit: 1) {
          grade
          id
        }
      }
    }
  }
`;
/* End of Queries used in `Appeal Details Page` */

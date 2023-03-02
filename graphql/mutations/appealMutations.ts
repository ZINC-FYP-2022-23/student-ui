import { gql } from "@apollo/client";

export const CREATE_APPEAL = gql`
  mutation createAppeal($input: assignment_appeals_insert_input!) {
    createAppeal(object: $input) {
      id
    }
  }
`;

export const CREATE_APPEAL_MESSAGE = gql`
  mutation createAppealMessage($input: assignment_appeal_messages_insert_input!) {
    createAppealMessage(object: $input) {
      id
    }
  }
`;

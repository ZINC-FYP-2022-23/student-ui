import { AppealLogMessage } from "@/components/Appeal/AppealLogMessage";
import { AppealResult } from "@/components/Appeal/AppealResult";
import { AppealTextMessage } from "@/components/Appeal/AppealTextMessage";
import { AssignmentSection } from "@/components/Assignment/List";
import { Modal } from "@/components/Modal";
import { ReportSlideOver } from "@/components/Report";
import RichTextEditor from "@/components/RichTextEditor";
import { SlideOver } from "@/components/SlideOver";
import { Spinner } from "@/components/Spinner";
import { LayoutProvider, useLayoutDispatch } from "@/contexts/layout";
import {
  GET_APPEALS_BY_USER_ID_AND_ASSIGNMENT_ID,
  GET_APPEAL_CHANGE_LOGS_BY_APPEAL_ID,
  GET_APPEAL_CONFIG,
  GET_APPEAL_DETAILS_BY_APPEAL_ID,
  GET_APPEAL_MESSAGES,
  GET_ASSIGNMENT_CONFIG_ID_BY_APPEAL_ID,
  GET_IDS_BY_APPEAL_ID,
  GET_SUBMISSIONS_BY_ASSIGNMENT_AND_USER_ID,
} from "@/graphql/queries/appealQueries";
import { Layout } from "@/layout";
import { AppealAttempt, AppealLog, AppealStatus, DisplayMessageType } from "@/types/appeal";
import { Appeal, AppealMessage, AssignmentConfig, ChangeLog, Submission as SubmissionType } from "@/types/tables";
import { isInputEmpty, mergeDataToActivityLogList, transformToAppealAttempt } from "@/utils/appealUtils";
import { useQuery, useSubscription } from "@apollo/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tab } from "@headlessui/react";
import { Alert, clsx, createStyles } from "@mantine/core";
import axios from "axios";
import { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { ModalContent } from "pages/assignments/[assignmentId]";
import { useState } from "react";
import { ReactGhLikeDiff } from "react-gh-like-diff";
import { initializeApollo } from "../../../lib/apollo";

interface ButtonProps {
  comments: string; // The text message sent to the TA when submitting the appeal
  setComments: (x: string) => void;
  userId: number;
}

/**
 * Returns a appeal submission button
 */
function AppealMessageButton({ userId, comments, setComments }: ButtonProps) {
  const dispatch = useLayoutDispatch();
  const router = useRouter();
  const { appealId } = router.query;

  return (
    <button
      className="px-4 py-1 rounded-md bg-green-500 text-white hover:bg-green-600 active:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition ease-in-out duration-150"
      // Disable the Send Message Button if the text editor is empty
      disabled={isInputEmpty(comments)}
      onClick={async () => {
        // Check if the text message blank. The student should filled in something for the appeal.
        if (isInputEmpty(comments)) {
          alert("Cannot submit empty message");
        } else {
          try {
            await axios({
              method: "POST",
              url: `/api/appeals/messages`,
              data: {
                message: comments,
                senderId: userId,
                appealId,
              },
            });

            setComments("");
            return;
          } catch (error: any) {
            const { status: statusCode, data: responseJson } = error.response;
            if (statusCode === 403) {
              // 403 Forbidden
              dispatch({
                type: "showNotification",
                payload: {
                  title: "Appeal message denied",
                  message: responseJson.error,
                  success: false,
                },
              });
              return;
            }
            dispatch({
              type: "showNotification",
              payload: {
                title: "Unable to send appeal message",
                message: "Failed to send appeal message due to network/server issues. Please submit again.\n" + error,
                success: false,
              },
            });
          }
        }
      }}
    >
      Send Message
    </button>
  );
}

interface ActivityLogTabProps {
  /** Allow student to send further replies or not. */
  isAppealStudentReplyAllowed: boolean;
  /** A list of logs that may include appeal messages and appeal logs */
  activityLogList: (
    | (SubmissionType & { _type: "submission" })
    | (DisplayMessageType & { _type: "appealMessage" })
    | (AppealLog & { _type: "appealLog" })
  )[];
}

/**
 * Return a component that shows the Activity Log under the Activity Log Tab to show all appeal messages and appeal logs
 */
function ActivityLogTab({ activityLogList }: ActivityLogTabProps) {
  return (
    <div className="flex flex-col">
      {activityLogList.map(
        (
          log:
            | (SubmissionType & { _type: "submission" })
            | (DisplayMessageType & { _type: "appealMessage" })
            | (AppealLog & { _type: "appealLog" }),
        ) => {
          if (log._type === "appealLog") {
            return (
              <div key={`log-${log.id}`} className="px-3">
                <AppealLogMessage log={log} showReason showSubmissionButtons showViewAppealButton={false} />
              </div>
            );
          } else if (log._type === "appealMessage") {
            return <AppealTextMessage key={`msg-${log.id}`} message={log} />;
          }
        },
      )}
      <div className="h-8" />
    </div>
  );
}

type CodeComparisonTabProps = {
  diffData: DiffSubmissionsData;
};

/**
 * Data returned by the webhook `/diffSubmissions` endpoint, which compares two assignment submissions.
 */
type DiffSubmissionsData = {
  /** Diff output between the old submission and the new submission. */
  diff: string;
  /** Error message if any. */
  error: string | null;
  /** HTTP status of the API call. */
  status: number;
};

/**
 * Show the difference between new and old file submissions under the Code Comparison Tab by using ReactGhLikeDiff
 */
function CodeComparisonTab({ diffData }: CodeComparisonTabProps) {
  const useStyles = createStyles(() => ({
    diffView: {
      "& .d2h-file-name": {
        // Overrides the hidden file name in `index.css`
        display: "block !important",
      },
      "& .d2h-file-list-wrapper": {
        display: "none",
      },
    },
  }));

  const { classes } = useStyles();
  const { diff, error, status } = diffData;

  if (status === -1) {
    return <p className="py-8 text-center text-gray-600">This appeal attempt does not include a file submission.</p>;
  }

  if (status !== 200) {
    return (
      <div className="py-8 flex flex-col items-center space-y-5 text-red-500">
        <FontAwesomeIcon icon={["far", "circle-exclamation"]} size="3x" />
        <div className="space-y-2 text-center">
          <p>An error occurred while comparing old and new submissions.</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  if (diff === "") {
    return (
      <p className="py-8 text-center text-gray-600">The new appeal submission is the same as the old submission.</p>
    );
  }
  return (
    <div className={clsx("relative p-3", classes.diffView)}>
      <ReactGhLikeDiff
        options={{
          outputFormat: "side-by-side",
          showFiles: true,
        }}
        diffString={diff}
      />
    </div>
  );
}

interface AppealResultBoxProps {
  appealResult: AppealStatus; // The latest appeal status
}

/**
 * Returns the component that shows the latest appeal status at the top of the page
 */
function AppealResultBox({ appealResult }: AppealResultBoxProps) {
  switch (appealResult) {
    case AppealStatus.ACCEPTED:
      return (
        <div className="bg-green-50 py-3 rounded-md">
          <AppealResult appealResult={appealResult} />
        </div>
      );
    case AppealStatus.REJECTED:
      return (
        <div className="bg-red-50 py-3 rounded-md">
          <AppealResult appealResult={appealResult} />
        </div>
      );
    case AppealStatus.PENDING:
      return (
        <div className="bg-yellow-50 py-3 rounded-md">
          <AppealResult appealResult={appealResult} />
        </div>
      );
    default:
      return <></>;
  }
}

interface DisplayErrorProps {
  assignmentId: number;
  errorMessage: string; // Message shown to the user when encountering an error
}

/**
 * Returns an error page
 */
function DisplayError({ assignmentId, errorMessage }: DisplayErrorProps) {
  return (
    <LayoutProvider>
      <Layout title="Grade Appeal Details">
        <main className="flex-1 flex bg-gray-200 overflow-y-auto">
          <AssignmentSection />
          <div className="p-5 flex flex-1 flex-col h-full w-max">
            <div className="pb-3">
              <div className="my-1 flex items-center">
                <Link href={`/assignments/${assignmentId}`}>
                  <a className="max-w-max-content w-max px-3 py-1.5 border border-gray-300 text-sm leading-4 font-medium rounded-lg text-blue-700 bg-white hover:text-blue-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-blue-800 active:bg-gray-50 transition ease-in-out duration-150">
                    <FontAwesomeIcon icon={["far", "chevron-left"]} className="mr-2" />
                    Back
                  </a>
                </Link>
                <h1 className="flex-1 font-semibold text-2xl text-center">Grade Appeal</h1>
              </div>
              <div className="my-6 mt-8 flex flex-col items-center self-center mb-4">
                <Alert
                  icon={<FontAwesomeIcon icon={["far", "circle-exclamation"]} />}
                  title="Appeal Unavailable"
                  color="red"
                  variant="filled"
                >
                  {errorMessage}
                </Alert>
              </div>
            </div>
          </div>
        </main>
      </Layout>
    </LayoutProvider>
  );
}

/**
 * Returns a loading page to show fetching data is in progress
 */
function DisplayLoading() {
  return (
    <LayoutProvider>
      <Layout title="Grade Appeal Details">
        <main className="flex-1 flex bg-gray-200 overflow-y-auto">
          <AssignmentSection />
          <div className="w-full my-20 flex justify-center">
            <Spinner className="h-16 w-16 text-cse-500" />
          </div>
        </main>
      </Layout>
    </LayoutProvider>
  );
}

interface AppealDetailsProps {
  appealId: number;
  userId: number;
  assignmentId: number; // The assignment ID that the appeal is related to
  diffSubmissionsData: DiffSubmissionsData;
}

/**
 * Returns the entire Appeal Details page
 */
function AppealDetails({ appealId, userId, assignmentId, diffSubmissionsData }: AppealDetailsProps) {
  // Fetch data with GraphQL
  const {
    data: appealConfigData,
    loading: appealConfigLoading,
    error: appealConfigError,
  } = useQuery<{ assignmentConfig: AssignmentConfig }>(GET_APPEAL_CONFIG, {
    variables: { assignmentConfigId: assignmentId },
  });
  const {
    data: appealsDetailsData,
    loading: appealDetailsLoading,
    error: appealDetailsError,
  } = useSubscription<{ appeal: Appeal }>(GET_APPEAL_DETAILS_BY_APPEAL_ID, { variables: { appealId: appealId } });
  const {
    data: appealChangeLogData,
    loading: appealChangeLogLoading,
    error: appealChangeLogError,
  } = useSubscription<{ changeLogs: ChangeLog[] }>(GET_APPEAL_CHANGE_LOGS_BY_APPEAL_ID, {
    variables: { appealId: appealId },
  });
  const {
    data: appealMessagesData,
    loading: appealMessagesLoading,
    error: appealMessagesError,
  } = useSubscription<{ changeLogs: AppealMessage[] }>(GET_APPEAL_MESSAGES, { variables: { appealId: appealId } });
  const {
    data: appealsData,
    loading: appealsLoading,
    error: appealsError,
  } = useSubscription<{ appeals: Appeal[] }>(GET_APPEALS_BY_USER_ID_AND_ASSIGNMENT_ID, {
    variables: { userId: userId, assignmentConfigId: assignmentId },
  });

  const [comments, setComments] = useState("");

  // Display Loading if data fetching is still in-progress
  if (
    appealConfigLoading ||
    appealDetailsLoading ||
    appealChangeLogLoading ||
    appealMessagesLoading ||
    appealsLoading
  ) {
    return <DisplayLoading />;
  }

  // Display error if it occurred
  let errorMessage: string | null = null;
  if (appealConfigError || appealDetailsError || appealChangeLogData || appealMessagesError) {
    errorMessage = "Failed to fetch appeal details.";
  } else if (!appealsDetailsData || !appealsDetailsData.appeal) {
    // Check if the appeal details is available, if not, there is no such appeal
    errorMessage = "Invalid appeal. Please check the appeal ID.";
  } else if (!appealConfigData!.assignmentConfig.isAppealAllowed) {
    // Check if the appeal submission is allowed
    errorMessage = "The assignment does not allow any appeals.";
  } else if (appealsDetailsData.appeal.userId !== userId) {
    // Check if the student has access to the appeal
    errorMessage = "Access Denied. You don't have permission to access this appeal.";
  }
  if (errorMessage) {
    <DisplayError assignmentId={assignmentId} errorMessage={errorMessage} />;
  }

  // Translate `appealDetailsData` to `AppealAttempt[]`
  let appealAttempt: AppealAttempt[] = transformToAppealAttempt({ appealsDetailsData });

  // Merge the data and create a log list
  let activityLogList: (
    | (SubmissionType & { _type: "submission" })
    | (DisplayMessageType & { _type: "appealMessage" })
    | (AppealLog & { _type: "appealLog" })
  )[] = mergeDataToActivityLogList({ appealAttempt, appealChangeLogData, appealMessagesData });

  // Only allow reply if config set as true AND it's the latest appeal
  let isAppealStudentReplyAllowed: boolean = false;
  if (
    appealsData!.appeals[0].createdAt === appealAttempt[0].createdAt &&
    appealConfigData!.assignmentConfig.isAppealStudentReplyAllowed
  ) {
    isAppealStudentReplyAllowed = true;
  }

  return (
    <LayoutProvider>
      <Layout title="Grade Appeal Details">
        <main className="flex-1 flex bg-gray-200 overflow-y-auto">
          <AssignmentSection />
          <div className="mb-2 p-5 flex flex-1 flex-col w-max space-y-3">
            <div>
              <div className="my-1 relative">
                <Link href={`/assignments/${assignmentId}`}>
                  <a className="absolute left-0 max-w-max-content w-max px-3 py-1.5 border border-gray-300 text-sm leading-4 font-medium rounded-lg text-blue-700 bg-white hover:text-blue-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-blue-800 active:bg-gray-50 transition ease-in-out duration-150">
                    <FontAwesomeIcon icon={["far", "chevron-left"]} className="mr-2" />
                    Back
                  </a>
                </Link>
                <h1 className="flex-1 font-semibold text-2xl text-center">Grade Appeal</h1>
              </div>
              <div className="w-full mt-3">
                <AppealResultBox appealResult={appealAttempt[0].status} />
              </div>
            </div>
            {isAppealStudentReplyAllowed && (
              <div className="p-3 flex-row justify-between bg-white rounded-md">
                <RichTextEditor
                  id="rte"
                  value={comments}
                  onChange={setComments}
                  controls={[
                    ["bold", "italic", "underline"],
                    ["h1", "h2", "h3", "unorderedList", "orderedList", "codeBlock"],
                  ]}
                  styles={{ toolbar: { position: "relative" } }}
                />
                <div className="mt-2 flex justify-end">
                  <AppealMessageButton userId={userId} comments={comments} setComments={setComments} />
                </div>
              </div>
            )}
            <div className="flex-shrink-0 overflow-y-auto bg-gray-200">
              <Tab.Group>
                <Tab.List className="flex bg-blue-100 text-sm">
                  <Tab
                    className={({ selected }) =>
                      clsx(
                        "py-3 px-5 border-b-2 font-semibold transition rounded-md rounded-b-none",
                        selected
                          ? "bg-blue-200 text-cse-600 border-cse-600"
                          : "text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none",
                      )
                    }
                  >
                    Activity Log
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      clsx(
                        "py-3 px-5 border-b-2 font-semibold transition rounded-md rounded-b-none",
                        selected
                          ? "bg-blue-200 text-cse-600 border-cse-600"
                          : "text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none",
                      )
                    }
                  >
                    Code Comparison
                  </Tab>
                </Tab.List>
                <Tab.Panels className="bg-gray-100 rounded-b-md">
                  {/* "Messaging" tab panel */}
                  <Tab.Panel>
                    <ActivityLogTab
                      activityLogList={activityLogList}
                      isAppealStudentReplyAllowed={isAppealStudentReplyAllowed}
                    />
                  </Tab.Panel>
                  {/* "Code Comparison" tab panel */}
                  <Tab.Panel>
                    <CodeComparisonTab diffData={diffSubmissionsData} />
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </div>
            <div className="h-2 flex-shrink-0" />
          </div>
        </main>
      </Layout>
      <SlideOver>
        <ReportSlideOver />
      </SlideOver>
      <Modal>
        <ModalContent />
      </Modal>
    </LayoutProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, query }) => {
  const apolloClient = initializeApollo(req.headers.cookie!);
  const userId = parseInt(req.cookies.user);
  let assignmentId = parseInt(query.assignmentId as string);
  const appealId = parseInt(query.appealId as string);

  if (!assignmentId) {
    const { data } = await apolloClient.query({
      query: GET_ASSIGNMENT_CONFIG_ID_BY_APPEAL_ID,
      variables: {
        appealId,
      },
    });

    if (data.appeal.assignmentConfigId) {
      assignmentId = data.appeal.assignmentConfigId;
    }
  }

  const { data: idData } = await apolloClient.query<{ appeal: Appeal }>({
    query: GET_IDS_BY_APPEAL_ID,
    variables: {
      appealId: appealId,
    },
  });
  const { data: submissionsData } = await apolloClient.query<{ submissions: SubmissionType[] }>({
    query: GET_SUBMISSIONS_BY_ASSIGNMENT_AND_USER_ID,
    variables: { assignmentConfigId: idData.appeal.assignmentConfigId, userId },
  });

  // Obtain the submission IDs from the backend
  const newSubmissionId: number = idData.appeal.newFileSubmissionId || -1;
  const oldSubmissionId: number = submissionsData.submissions.filter((e) => !e.isAppeal)[0].id;

  let diffSubmissionsData: DiffSubmissionsData;
  if (newSubmissionId === -1) {
    diffSubmissionsData = { diff: "", status: -1, error: null };
  } else {
    try {
      const response = await fetch(
        `http://${process.env.WEBHOOK_ADDR}/diffSubmissions?oldId=${oldSubmissionId}&newId=${newSubmissionId}`,
        {
          method: "GET",
        },
      );
      const { status } = response;
      const { diff, error } = await response.json();
      diffSubmissionsData = { diff, error, status };
    } catch (error) {
      diffSubmissionsData = { diff: "", status: 500, error: "An unknown error has occurred." };
    }
  }

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
      appealId,
      userId,
      assignmentId,
      diffSubmissionsData,
    },
  };
};

export default AppealDetails;

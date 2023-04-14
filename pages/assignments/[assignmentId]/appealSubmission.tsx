import { AssignmentSection } from "@/components/Assignment/List";
import RichTextEditor from "@/components/RichTextEditor";
import { LayoutProvider, useLayoutDispatch } from "@/contexts/layout";
import { useZinc } from "@/contexts/zinc";
import {
  GET_APPEALS_DETAILS_BY_ASSIGNMENT_ID,
  GET_APPEAL_CHANGE_LOGS_BY_ASSIGNMENT_ID,
  GET_APPEAL_CONFIG,
} from "@/graphql/queries/appealQueries";
import { SUBMISSION_QUERY } from "@/graphql/queries/user";
import { Layout } from "@/layout";
import { initializeApollo } from "@/lib/apollo";
import { Appeal, AssignmentConfig, ChangeLog, Submission } from "@/types/tables";
import { getMaxScore, isInputEmpty } from "@/utils/appealUtils";
import { getLocalDateFromString } from "@/utils/date";
import { useQuery, useSubscription } from "@apollo/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Alert } from "@mantine/core";
import axios from "axios";
import { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface AppealButtonProps {
  /** The text message sent to the TA when submitting the appeal. */
  comments: string;
  userId: number;
  assignmentConfigId: number;
  files: File[];
}

/**
 * Returns a appeal submission button
 */
function AppealButton({ userId, assignmentConfigId, comments, files }: AppealButtonProps) {
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(false);
  const { submitFile } = useZinc();
  const dispatch = useLayoutDispatch();
  const router = useRouter();
  let newFileSubmissionId: number | null = null;

  const buttonStyle = buttonDisabled
    ? "px-4 py-1 rounded-md text-lg bg-gray-300 text-white transition ease-in-out duration-150"
    : "px-4 py-1 rounded-md text-lg bg-green-500 text-white hover:bg-green-600 active:bg-green-700 transition ease-in-out duration-150";

  return (
    <div>
      <button
        className={buttonStyle}
        disabled={buttonDisabled}
        onClick={async () => {
          // Check if the text message blank. The student should filled in something for the appeal.
          if (isInputEmpty(comments)) {
            alert("Please Fill All Required Field");
          } else {
            // Let student double check if they included submission file
            if (
              files.length === 0 &&
              !confirm("You are filing this appeal without submission file(s). Are you sure?")
            ) {
              return;
            }

            // Disable the button
            setButtonDisabled(true);

            // Submit the new file(s)
            if (files.length) {
              await submitFile(files, true)
                .then(async ({ status, id }: any) => {
                  if (status === "success") {
                    newFileSubmissionId = id;
                  }
                })
                .catch((error) => {
                  dispatch({
                    type: "showNotification",
                    payload: { title: "Failed to upload submission files", message: error.message, success: false },
                  });
                  setButtonDisabled(false);
                  return;
                });
            }

            // Submit appeal
            try {
              const { data } = await axios({
                method: "POST",
                url: `/api/appeals`,
                data: {
                  assignmentConfigId,
                  userId,
                  newFileSubmissionId,
                  assignmentAppealMessages: {
                    data: [
                      {
                        message: comments,
                        senderId: userId,
                      },
                    ],
                  },
                },
              });

              // Notify success
              dispatch({
                type: "showNotification",
                payload: {
                  title: "Appeal submitted",
                  message: "Your appeal will be reviewed.",
                  success: true,
                },
              });

              // Redirect to appeal page
              router.push(`/appeals/${data.data.createAppeal.id}`);
            } catch (error: any) {
              const { status: statusCode, data: responseJson } = error.response;
              setButtonDisabled(false);
              if (statusCode === 403) {
                // 403 Forbidden
                dispatch({
                  type: "showNotification",
                  payload: {
                    title: "Appeal denied",
                    message: responseJson.error,
                    success: false,
                  },
                });
                return;
              }
              // Other errors
              dispatch({
                type: "showNotification",
                payload: {
                  title: "Unable to submit appeal",
                  message:
                    "Failed to submit appeal due to network/server issues. Please submit again. Note that there is no need to submit the file again.\n" +
                    error,
                  success: false,
                },
              });
            }
          }
        }}
      >
        Submit
      </button>
    </div>
  );
}

interface DisplayLoadingProps {
  assignmentId: number;
}

/**
 * Returns a loading page to show fetching data is in progress
 */
function DisplayLoading({ assignmentId }: DisplayLoadingProps) {
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
              <div>Loading Data...</div>
            </div>
          </div>
        </main>
      </Layout>
    </LayoutProvider>
  );
}

interface DisplayErrorProps {
  assignmentId: number;
  /** Message shown to the user when encountering an error. */
  errorMessage: string;
}

/**
 * Returns an error page
 */
function DisplayError({ assignmentId, errorMessage }: DisplayErrorProps) {
  return (
    <LayoutProvider>
      <Layout title="Grade Appeal Submission">
        <main className="flex-1 flex bg-gray-200">
          <AssignmentSection />
          <div className="p-5 flex flex-1 flex-col overflow-y-auto">
            <Link href={`/assignments/${assignmentId}`}>
              <a className="max-w-max-content w-max px-3 py-1.5 mb-3 border border-gray-300 text-sm leading-4 font-medium rounded-lg text-blue-700 bg-white hover:text-blue-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-blue-800 active:bg-gray-50 transition ease-in-out duration-150">
                <FontAwesomeIcon icon={["far", "chevron-left"]} className="mr-2" />
                Back
              </a>
            </Link>
            <div>
              <div className="my-6 mt-8 flex flex-col items-center self-center mb-4">
                <Alert
                  icon={<FontAwesomeIcon icon={["far", "circle-exclamation"]} />}
                  title="Appeal Unavailable"
                  color="red"
                  variant="filled"
                >
                  <strong>{errorMessage}</strong>
                </Alert>
              </div>
            </div>
          </div>
        </main>
      </Layout>
    </LayoutProvider>
  );
}

interface AppealSubmissionProps {
  userId: number;
  assignmentId: number;
}

/**
 * The Appeal Submission page
 */
function AppealSubmission({ userId, assignmentId }: AppealSubmissionProps) {
  const [comments, setComments] = useState<string>("");
  const dispatch = useLayoutDispatch();
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length === 0) {
        dispatch({
          type: "showNotification",
          payload: {
            title: "Invalid file type",
            message: "Your submission contains file that are not supported, please try again",
            success: false,
          },
        });
      }
    },
    [dispatch],
  );

  const { acceptedFiles, getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ".h,.cpp,.rar,.zip,application/octet-stream,application/zip,application/x-zip,application/x-zip-compressed",
  });
  const now = new Date();

  // Fetch data with GraphQL
  const {
    data: appealConfigData,
    loading: appealConfigLoading,
    error: appealConfigError,
  } = useQuery<{ assignmentConfig: AssignmentConfig }>(GET_APPEAL_CONFIG, {
    variables: { assignmentConfigId: assignmentId },
  });
  const {
    data: submissionsData,
    loading: submissionLoading,
    error: submissionsError,
  } = useQuery<{ submissions: Submission[] }>(SUBMISSION_QUERY, {
    variables: { userId, assignmentConfigId: assignmentId },
  });
  const {
    data: appealDetailsData,
    loading: appealDetailsLoading,
    error: appealDetailsError,
  } = useSubscription<{ appeals: Appeal[] }>(GET_APPEALS_DETAILS_BY_ASSIGNMENT_ID, {
    variables: { userId, assignmentConfigId: assignmentId },
  });
  const {
    data: appealChangeLogData,
    loading: appealChangeLogLoading,
    error: appealChangeLogError,
  } = useSubscription<{ changeLogs: ChangeLog[] }>(GET_APPEAL_CHANGE_LOGS_BY_ASSIGNMENT_ID, {
    variables: { userId, assignmentConfigId: assignmentId },
  });

  // Display Loading if data fetching is still in-progress
  if (appealConfigLoading || appealDetailsLoading || submissionLoading || appealChangeLogLoading) {
    return <DisplayLoading assignmentId={assignmentId} />;
  }

  const appealStartAt = getLocalDateFromString(appealConfigData?.assignmentConfig.appealStartAt ?? null);
  const appealStopAt = getLocalDateFromString(appealConfigData?.assignmentConfig.appealStopAt ?? null);

  // Display error if it occurred
  let errorMessage: string | null = null;
  if (appealConfigError || appealDetailsError) {
    errorMessage = "Failed to fetch appeal details.";
  } else if (submissionsError || appealChangeLogError) {
    errorMessage = "Failed to fetch submission details.";
  } else if (!appealConfigData?.assignmentConfig) {
    // Error if `assignmentConfig` is undefined
    errorMessage = "Assignment config data is not available.";
  } else if (!appealConfigData.assignmentConfig.isAppealAllowed) {
    // Check if the appeal submission is allowed
    errorMessage = "The assignment does not allow any appeals.";
  } else if (appealStartAt && now < appealStartAt) {
    errorMessage = "Time period for appeal submission has not started yet.";
  } else if (appealStopAt && now > appealStopAt) {
    errorMessage = "Time period for appeal submission has passed.";
  } else if (!submissionsData || submissionsData?.submissions.length === 0) {
    // Error if there's no submission
    errorMessage = "You have not submitted anything yet for this assignment.";
  } else if (
    appealDetailsData?.appeals &&
    appealDetailsData.appeals[0] &&
    appealDetailsData.appeals[0].status === "PENDING"
  ) {
    // Does not allow appeal submission if another appeal is `PENDING`
    errorMessage = "You are not allowed to submit a new appeal while having a pending appeal.";
  }

  /** How many appeal attempts left that can be made. */
  let numAppealsLeft: number | null = appealConfigData?.assignmentConfig.appealLimits
    ? appealDetailsData?.appeals.length
      ? appealConfigData.assignmentConfig.appealLimits - appealDetailsData.appeals.length
      : appealConfigData.assignmentConfig.appealLimits
    : null;

  // New appeal cannot be submitted if numAppealsLeft < 1
  if (!numAppealsLeft || numAppealsLeft < 1) {
    errorMessage = "You cannot submit anymore new appeals.";
  }

  if (errorMessage) {
    return <DisplayError assignmentId={assignmentId} errorMessage={errorMessage} />;
  }

  // Get the latest score
  // 1. Get score from latest, non-appeal submission
  const nonAppealSubmissions = submissionsData!.submissions.filter(
    (e) => !e.isAppeal && e.reports && e.reports.length > 0,
  );
  const reports =
    nonAppealSubmissions.length > 0 ? nonAppealSubmissions[0].reports.filter((e) => e.grade && e.grade.score) : null;

  let score = reports && reports.length > 0 ? reports[0].grade.score : null;

  const latestAppeal = appealDetailsData?.appeals[0];
  const latestAppealUpdateDate = latestAppeal?.updatedAt ? new Date(latestAppeal.updatedAt) : null;

  if (latestAppeal && appealChangeLogData?.changeLogs) {
    for (const changeLog of appealChangeLogData.changeLogs) {
      const logDate = new Date(changeLog.createdAt);
      if (
        latestAppealUpdateDate &&
        logDate < latestAppealUpdateDate &&
        latestAppeal.status === "ACCEPTED" &&
        latestAppeal.newFileSubmissionId &&
        latestAppeal.submission &&
        latestAppeal.submission.reports.length > 0
      ) {
        score = latestAppeal.submission.reports[0].grade.score;
        break;
      } else if (changeLog.type === "SCORE") {
        score = changeLog.updatedState["score"];
        break;
      }
    }
  }

  const maxScore = getMaxScore(submissionsData?.submissions);

  /** Whether student got full mark in the latest submission */
  const isFullMark = score === maxScore;

  return (
    <LayoutProvider>
      <Layout title="Grade Appeal Submission">
        <main className="flex-1 flex bg-gray-200">
          <AssignmentSection />
          <div className="p-5 flex flex-1 flex-col overflow-y-auto">
            {/* Back Button */}
            <Link href={`/assignments/${assignmentId}`}>
              <a className="max-w-max-content w-max px-3 py-1.5 mb-3 border border-gray-300 text-sm leading-4 font-medium rounded-lg text-blue-700 bg-white hover:text-blue-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-blue-800 active:bg-gray-50 transition ease-in-out duration-150">
                <FontAwesomeIcon icon={["far", "chevron-left"]} className="mr-2" />
                Back
              </a>
            </Link>
            <>
              {/* Justification and Comments */}
              <h1 className="mb-2 font-semibold text-2xl text-center">Submit Grade Appeal</h1>
              <div className="my-6">
                <h2 className="mb-2 font-semibold text-lg">
                  Justification and comments<span className="ml-0.5 text-red-600">*</span>
                </h2>
                {/* @ts-ignore */}
                <RichTextEditor
                  id="rte"
                  value={comments}
                  onChange={setComments}
                  controls={[
                    ["bold", "italic", "underline"],
                    ["h1", "h2", "h3", "unorderedList", "orderedList"],
                  ]}
                />
                {/* End of Justification and Comments */}
              </div>
              {/* Upload Code */}
              <div className="my-6">
                <h2 className="mb-2 font-semibold text-lg">Upload fixed code</h2>
                <p className="mb-4 text-sm text-gray-600">
                  Do NOT upload specific fixed files. Upload as if you are submitting for the whole assignment. The
                  system will find out the fixed codes automatically.
                </p>
                <div className="bg-white p-4 rounded-md">
                  <div
                    {...getRootProps()}
                    className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 focus:outline-none w-full ${
                      isDragActive ? "border-blue-400" : "border-gray-300"
                    } border-dashed rounded-md`}
                  >
                    <div className="text-center">
                      <FontAwesomeIcon icon={["fad", "upload"]} size="2x" />
                      <p className="mt-1 text-sm text-gray-600">
                        <input {...getInputProps()} />
                        <button className="mr-1 font-medium text-cse-600 hover:text-cse-500 focus:outline-none focus:underline transition duration-150 ease-in-out">
                          Upload a file
                        </button>
                        or drag and drop
                      </p>
                      <p className="mt-1 text-xs text-gray-500">ZIP file up to 10MB</p>
                    </div>
                  </div>
                </div>
                {acceptedFiles.length !== 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 font-semibold">Uploaded Files:</h4>
                    {acceptedFiles.map((file) => (
                      // TODO: add download button for each file
                      <li key={file.name} className="ml-4">
                        {file.name} - {file.size} bytes
                      </li>
                    ))}
                  </div>
                )}
              </div>
              {/* Show number of appeal attempts left and submit button */}
              <div className="mt-3 flex flex-col items-center self-center w-full">
                <div className="flex items-center mb-4">
                  <FontAwesomeIcon icon={["far", "exclamation-triangle"]} className="text-orange-600 mr-2 text-lg" />
                  <p className="text-orange-600">
                    You have <strong>{numAppealsLeft}</strong> appeal(s) attempts left. You may not change any details
                    after submission.
                  </p>
                </div>
                {isFullMark ? (
                  <div className="flex flex-col items-center w-full py-3 bg-red-50 rounded-lg mt-4 mb-4">
                    <div className="flex items-center mt-4 mb-4">
                      <FontAwesomeIcon icon={["far", "octagon-exclamation"]} className="text-red-600 mr-2 text-lg" />
                      <p className="text-red-600 text-lg font-medium">
                        Your assignment got full marks. Are you sure to submit a grade appeal?
                      </p>
                    </div>
                    <AppealButton
                      userId={userId}
                      assignmentConfigId={assignmentId}
                      comments={comments}
                      files={acceptedFiles}
                    />
                  </div>
                ) : (
                  <AppealButton
                    userId={userId}
                    assignmentConfigId={assignmentId}
                    comments={comments}
                    files={acceptedFiles}
                  />
                )}
              </div>
            </>
          </div>
        </main>
      </Layout>
    </LayoutProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, query }) => {
  const userId = parseInt(req.cookies.user);
  const assignmentId = parseInt(query.assignmentId as string);
  const apolloClient = initializeApollo(req.headers.cookie as string);

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
      userId,
      assignmentId,
    },
  };
};

export default AppealSubmission;

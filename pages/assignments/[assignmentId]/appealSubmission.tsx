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
import { Submission } from "@/types";
import { useQuery, useSubscription } from "@apollo/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Alert } from "@mantine/core";
import axios from "axios";
import { zonedTimeToUtc } from "date-fns-tz";
import { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

// TODO(BRYAN): Remove this when it's done
/*const onDrop = useCallback(
  (files) => {
    setButtonDisabled(true);
    submitFile(files, true)
      .then(async ({ status, id }: any) => {
        if (status === "success") {
          setNewFileSubmissionId(id);
          dispatch({
            type: "showNotification",
            payload: {
              title: "Upload success",
              message: "Submission files for appeal uploaded.",
              success: true,
            },
          });
        }
      })
      .catch((error) => {
        dispatch({
          type: "showNotification",
          payload: { title: "Failed to upload submission files", message: error.message, success: false },
        });
      });
    setButtonDisabled(false);
  }, [configId],
);*/

interface AppealButtonProps {
  comments: string; // The text message sent to the TA when submitting the appeal
  userId: number;
  assignmentConfigId: number;
  disabled: boolean;
  setButtonDisabled;
  files: File[];
}

/**
 * Returns a appeal submission button
 */
function AppealButton({ userId, assignmentConfigId, comments, disabled, setButtonDisabled, files }: AppealButtonProps) {
  const { submitFile } = useZinc();
  const dispatch = useLayoutDispatch();
  const router = useRouter();
  let newFileSubmissionId: number | null = null;

  const buttonStyle = disabled
    ? "px-4 py-1 rounded-md text-lg bg-gray-300 text-white transition ease-in-out duration-150"
    : "px-4 py-1 rounded-md text-lg bg-green-500 text-white hover:bg-green-600 active:bg-green-700 transition ease-in-out duration-150";

  return (
    <div>
      <button
        className={buttonStyle}
        disabled={disabled}
        onClick={async () => {
          // Check if the text message blank. The student should filled in something for the appeal.
          if (comments === null || comments === "") {
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

            const now: Date = new Date();

            // Submit the new file(s)
            await submitFile(files, true)
              .then(async ({ status, id }: any) => {
                if (status === "success") {
                  newFileSubmissionId = id;
                  dispatch({
                    type: "showNotification",
                    payload: {
                      title: "Upload success",
                      message: "Submission files for appeal uploaded.",
                      success: true,
                    },
                  });
                }
              })
              .catch((error) => {
                dispatch({
                  type: "showNotification",
                  payload: { title: "Failed to upload submission files", message: error.message, success: false },
                });
              });

            // GraphQL mutation
            try {
              const { data } = await axios({
                method: "POST",
                url: `/api/appeals`,
                data: {
                  assignmentConfigId,
                  createdAt: zonedTimeToUtc(now, "Asia/Hong_Kong"),
                  status: "PENDING",
                  updatedAt: zonedTimeToUtc(now, "Asia/Hong_Kong"),
                  userId,
                  newFileSubmissionId,
                  assignment_appeal_messages: {
                    data: [
                      {
                        message: comments,
                        senderId: userId,
                        createdAt: zonedTimeToUtc(now, "Asia/Hong_Kong"),
                      },
                    ],
                  },
                },
              });

              // Notify error (if any)
              if (data.error) {
                dispatch({
                  type: "showNotification",
                  payload: {
                    title: "Appeal denied",
                    message: data.error,
                    success: false,
                  },
                });
                return;
              }

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
              // router.push(`/assignments/${assignmentConfigId}`);
              router.push(`/appeals/${data.data.createAppeal.id}`);
            } catch (error) {
              dispatch({
                type: "showNotification",
                payload: {
                  title: "Unable to submit appeal",
                  message: "Failed to submit appeal due to network issues. Please submit again.\n" + error,
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
                {/* TODO(BRYAN): Query the assignment ID instead of passing its value from getServerSideProps(). */}
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
  errorMessage: string; // Message shown to the user when encountering an error
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
  const [disabled, setDisabled] = useState<boolean>(false); // Set the Appeal Button to enable or disabled
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
    [assignmentId],
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
  } = useQuery(GET_APPEAL_CONFIG, { variables: { assignmentConfigId: assignmentId } });
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
  } = useSubscription(GET_APPEALS_DETAILS_BY_ASSIGNMENT_ID, {
    variables: { userId, assignmentConfigId: assignmentId },
  });
  const {
    data: appealChangeLogData,
    loading: appealChangeLogLoading,
    error: appealChangeLogError,
  } = useSubscription(GET_APPEAL_CHANGE_LOGS_BY_ASSIGNMENT_ID, {
    variables: { userId, assignmentConfigId: assignmentId },
  });

  // Display Loading if data fetching is still in-progress
  if (appealConfigLoading || appealDetailsLoading || submissionLoading || appealChangeLogLoading) {
    return <DisplayLoading assignmentId={assignmentId} />;
  }

  // Display error if it occurred
  if (appealConfigError) {
    const errorMessage = "Unable to Fetch appeal details with `GET_APPEAL_CONFIG`";
    return <DisplayError assignmentId={assignmentId} errorMessage={errorMessage} />;
  } else if (appealDetailsError) {
    const errorMessage = "Unable to Fetch appeal details with `GET_APPEALS_DETAILS_BY_ASSIGNMENT_ID`";
    return <DisplayError assignmentId={assignmentId} errorMessage={errorMessage} />;
  } else if (submissionsError) {
    const errorMessage = "Unable to Fetch submission details with `SUBMISSION_SUBSCRIPTION`";
    return <DisplayError assignmentId={assignmentId} errorMessage={errorMessage} />;
  } else if (appealChangeLogError) {
    const errorMessage = "Unable to Fetch submission details with `GET_APPEAL_CHANGE_LOGS_BY_ASSIGNMENT_ID`";
    return <DisplayError assignmentId={assignmentId} errorMessage={errorMessage} />;
  } else if (!appealConfigData.assignmentConfig) {
    // Error if `assignmentConfig` is undefined
    const errorMessage = "`assignmentConfig` is not available";
    return <DisplayError assignmentId={assignmentId} errorMessage={errorMessage} />;
  } else if (!appealConfigData.assignmentConfig.isAppealAllowed) {
    // Check if the appeal submission is allowed
    const errorMessage = "The assignment does not allow any appeals.";
    return <DisplayError assignmentId={assignmentId} errorMessage={errorMessage} />;
  } else if (now < appealConfigData.assignmentConfig.appealStartAt) {
    const errorMessage = "Time period for appeal submission has not started yet.";
    return <DisplayError assignmentId={assignmentId} errorMessage={errorMessage} />;
  } else if (now > appealConfigData.assignmentConfig.appealStopAt) {
    const errorMessage = "Time period for appeal submission has passed.";
    return <DisplayError assignmentId={assignmentId} errorMessage={errorMessage} />;
  } else if (!submissionsData || submissionsData?.submissions.length === 0) {
    // Error if there's no submission
    const errorMessage = "You have not submitted anything yet for this assignment.";
    return <DisplayError assignmentId={assignmentId} errorMessage={errorMessage} />;
  } else if (submissionsData?.submissions[0].reports.length === 0) {
    // Error if submission is still being processed
    const errorMessage =
      "Submission is still being processed. Please wait for a few seconds and do not refresh the page.";
    return <DisplayError assignmentId={assignmentId} errorMessage={errorMessage} />;
  } else if (
    appealDetailsData.appeals &&
    appealDetailsData.appeals[0] &&
    appealDetailsData.appeals[0].status === "PENDING"
  ) {
    // Does not allow appeal submission if another appeal is `PENDING`
    const errorMessage = "You are not allowed to submit a new appeal while having a pending appeal.";
    return <DisplayError assignmentId={assignmentId} errorMessage={errorMessage} />;
  }

  // Get how many appeal attempts left that can be made
  let numAppealsLeft: number = appealConfigData.assignmentConfig.appealLimits - appealDetailsData.appeals.length;

  // New appeal cannot be submitted if numAppealsLeft < 1
  if (numAppealsLeft < 1) {
    const errorMessage = "You cannot submit anymore new appeals.";
    return <DisplayError assignmentId={assignmentId} errorMessage={errorMessage} />;
  }

  // Get the latest score
  // 1. Get score from latest, non-appeal submission
  const nonAppealSubmissions = submissionsData.submissions.filter(
    (e) => !e.isAppeal && e.reports && e.reports.length > 0,
  );
  const reports =
    nonAppealSubmissions.length > 0 ? nonAppealSubmissions[0].reports.filter((e) => e.grade && e.grade.score) : null;

  let score = reports && reports.length > 0 ? reports[0].grade.score : null;
  /* let cont: boolean = true;
  // for (let i = 0; submissionsData && cont && i < submissionsData.submissions.length; i++) {
  //   cont = false;
  //   for (let j = 0; j < appealDetailsData.appeals.length; j++) {
  //     if (submissionsData.submissions[i].id === appealDetailsData.appeals[j].newFileSubmissionId) {
  //       cont = true;
  //       break;
  //     }
  //   }
  //   if (!cont) {
  //     // TODO(Owen): grade can be null
  //     score = submissionsData.submissions[i].reports[0].grade?.score;
  //     break;
  //   }
  // }*/
  // 2. Replace with score from appeal or `SCORE` change log (if any)
  const latestAppealUpdateDate = appealDetailsData.appeals[0] ? new Date(appealDetailsData.appeals[0].updatedAt) : null;

  for (let i = 0; i < appealChangeLogData.changeLogs.length; i++) {
    const logDate: Date = new Date(appealChangeLogData.changeLogs[i].createdAt);
    if (
      latestAppealUpdateDate &&
      logDate < latestAppealUpdateDate &&
      appealDetailsData.appeals[0].latestStatus === "ACCEPTED" &&
      appealDetailsData.appeals[0].newFileSubmissionId &&
      appealDetailsData.appeals[0].submission &&
      appealDetailsData.appeals[0].submission.reports.length > 0
    ) {
      score = appealDetailsData.appeals[0].submission.reports[0].grade.score;
      break;
    } else if (appealChangeLogData.changeLogs[i].type === "SCORE") {
      score = appealChangeLogData.changeLogs[i].updatedState.replace(/[^0-9]/g, "");
      break;
    }
  }
  const maxScore = submissionsData?.submissions
    .filter((e) => !e.isAppeal)[0]
    .reports.filter((e) => e.grade && e.grade.details)[0].grade.details.accTotal;

  // Determine whether student got full mark in the latest submission
  const isFullMark = score === maxScore ? true : false;

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
                {acceptedFiles.length != 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 font-semibold">Uploaded Files:</h4>
                    {acceptedFiles.map((file) => (
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
                        Your have got Full Mark. Are you sure you wish to submit a grade appeal?
                      </p>
                    </div>
                    <AppealButton
                      // 3. TODO(Bryan) Pass `acceptedFiles` from `useDropzone()` hook
                      userId={userId}
                      assignmentConfigId={assignmentId}
                      comments={comments}
                      disabled={disabled}
                      setButtonDisabled={setDisabled}
                      files={acceptedFiles}
                    />
                  </div>
                ) : (
                  <AppealButton
                    userId={userId}
                    assignmentConfigId={assignmentId}
                    comments={comments}
                    disabled={disabled}
                    setButtonDisabled={setDisabled}
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

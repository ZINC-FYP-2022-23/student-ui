import {
  GET_APPEALS_DETAILS_BY_ASSIGNMENT_ID,
  GET_APPEAL_CHANGE_LOGS_BY_ASSIGNMENT_ID,
  GET_APPEAL_CONFIG,
} from "@/graphql/queries/appealQueries";
import { AppealAttempt, AppealLog, AppealStatus, DisplayMessageType } from "@/types/appeal";
import { AssignmentConfig, Submission as SubmissionType } from "@/types/tables";
import { mergeDataToActivityLogList, transformToAppealAttempt } from "@/utils/appealUtils";
import { useQuery, useSubscription } from "@apollo/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Alert } from "@mantine/core";
import Link from "next/link";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useLayoutDispatch } from "../../contexts/layout";
import { useZinc } from "../../contexts/zinc";
import { SUBMISSION_SUBSCRIPTION } from "../../graphql/queries/user";
import { AppealLogMessage } from "../Appeal/AppealLogMessage";
import { AppealResult } from "../Appeal/AppealResult";
import { Submission } from "../Submission";
import { SubmissionCollectionStatus } from "../SubmissionCollectionStatus";
import { SubmissionLoader } from "../SubmissionLoader";
// import { Notification, SubmissionNotification } from "../Notification";
// import toast from "react-hot-toast";
// import { useMutation} from "@apollo/client";
// import { UPDATE_SUBMISSION_NOTI } from "../../graphql/mutations/user";

/**
 * Returns a component of the file submission area, where students can drag-and-drop their files to be submitted.
 * @param {boolean} isOpen - Is the submission opened yet.
 * @param {boolean} submissionClosed - Is the submission closed already.
 * @param {number} configId - Configuration ID
 */
function AssignmentSubmission({ submissionClosed, configId, isOpen }) {
  const { user, submitFile } = useZinc();
  // const [updateSubmissionNoti] = useMutation(UPDATE_SUBMISSION_NOTI)
  const dispatch = useLayoutDispatch();
  const onDrop = useCallback(
    (files) => {
      if (files.length === 0) {
        dispatch({
          type: "showNotification",
          payload: {
            title: "Invalid file type",
            message: "Your submission contains file that are not supported, please try again",
            success: false,
          },
        });
      } else {
        submitFile(files)
          .then(async ({ status }: any) => {
            if (status === "success") {
              /* 
              // start
              // console.log(id)
              //add data in database
              // const notiConfigUpdateResult = await updateSubmissionNoti({
              //   variables: {
              //     userId: user,
              //     submissionId: id,
              //     submissionIdForCheck: id
              //   }
              // })
              // console.log(notiConfigUpdateResult)
              // subscribe to topic (s-userid-submissionId)
              // get registrationToken of recevier
              // const notiRes = await fetch(`/api/notification/getNotification?&id=${user}`,{
              //   method: 'GET'
              // });
              // const noti = await notiRes.json()
              // const token = noti.notification

              // const response = await fetch(`/api/notification/subscription/${'s'+user.toString()+'-'+id.toString()}`,{
              //   method: 'POST',
              //   body: JSON.stringify({
              //     registrationToken: token,
              //     userId: id
              //   })
              // })
              // end

              // if success 
              */
              dispatch({
                type: "showNotification",
                payload: {
                  title: "Submission upload completed",
                  message: "Your work has been submitted successfully.",
                  success: true,
                },
              });
            }
          })
          .catch((error) => {
            dispatch({
              type: "showNotification",
              payload: { title: "Submission failed", message: error.message, success: false },
            });
          });
      }
    },
    [configId],
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ".h,.cpp,.rar,.zip,application/octet-stream,application/zip,application/x-zip,application/x-zip-compressed",
  });

  if (submissionClosed) {
    return (
      <div className="rounded-lg bg-gray-200 w-full py-4 flex flex-col items-center justify-center">
        <FontAwesomeIcon className="text-gray-500" icon={["fad", "calendar-exclamation"]} size="3x" />
        <h4 className="mt-4 font-medium text-gray-500">Submission Deadline has passed</h4>
        <p className="text-sm text-gray-400">No new submission is allowed after the submission deadline is due</p>
      </div>
    );
  } else if (!isOpen) {
    return (
      <div className="rounded-lg bg-gray-200 w-full py-4 flex flex-col items-center justify-center">
        <FontAwesomeIcon className="text-gray-500" icon={["fad", "calendar-exclamation"]} size="3x" />
        <h4 className="mt-4 font-medium text-gray-500">Submission not available</h4>
        <p className="text-sm text-gray-400">
          Your instructor has not made this assignment available for submission yet
        </p>
      </div>
    );
  } else {
    return (
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
    );
  }
}

interface AssignmentGradeButtonProps {
  assignmentId: number;
  disabled: boolean; // Is the button disabled.
}

/**
 * Returns the button that directs to the Appeal Submission page.
 */
function AppealGradeButton({ assignmentId, disabled }: AssignmentGradeButtonProps) {
  if (disabled) {
    return (
      <button
        disabled
        className="px-3 py-1.5 mt-3 border border-gray-300 text-sm leading-4 font-medium rounded-lg text-gray-400 bg-gray-100 cursor-not-allowed"
      >
        Appeal your grade
      </button>
    );
  }
  return (
    <Link href={`/assignments/${assignmentId}/appealSubmission`}>
      <a className="px-3 py-1.5 mt-3 border border-gray-300 text-sm leading-4 font-medium rounded-lg text-blue-700 bg-white hover:text-blue-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-blue-800 active:bg-gray-50 transition ease-in-out duration-150">
        <span>Appeal your grade</span>
      </a>
    </Link>
  );
}

/**
 * Returns the button that directs to the Appeal Details page of a submitted appeal.
 * @param {number} appealId
 */
function AppealDetailsButton({ appealId }: { appealId: number }) {
  return (
    <Link href={`/appeals/${appealId}`}>
      <a className="px-3 py-1.5 mt-3 mb-3 border border-gray-300 text-sm leading-4 font-medium rounded-lg text-green-700 bg-white hover:text-blue-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-blue-800 active:bg-gray-50 transition ease-in-out duration-150">
        <span>Check Appeal Details</span>
      </a>
    </Link>
  );
}

interface GradePanelProps {
  content: AssignmentConfig;
  assignmentId: number;
  score: number;
  maxScore: number;
  appealAttemptLeft: number; // Number of appeals attempt that can be made left
  appealAttempt: AppealAttempt; // The latest appeal attempt
  appealConfigData; // Raw data of appeal configs
}

/**
 * Returns a component of a box that shows the Final Grade and Appeal Status (if any)
 */
function GradePanel({
  content,
  assignmentId,
  score,
  maxScore,
  appealAttemptLeft,
  appealAttempt,
  appealConfigData,
}: GradePanelProps) {
  const appealId: number = appealAttempt.id;
  const appealStatus: AppealStatus = appealAttempt.latestStatus; // Latest status of the submitted appeal (if any)
  const now = new Date();

  // Error if appealConfigData is undefined or null
  if (!appealConfigData) {
    const errorMessage = "Appeal Config Data is not available.";
    return <DisplayError content={content} errorMessage={errorMessage} />;
  } else if (!appealConfigData.assignmentConfig) {
    const errorMessage = "Assignment configs are not available.";
    return <DisplayError content={content} errorMessage={errorMessage} />;
  }

  // Check if new appeal can be submitted
  let appealGradeButtonDisabled = false;
  if (
    appealAttemptLeft <= 0 ||
    !appealConfigData.assignmentConfig.isAppealAllowed ||
    now < appealConfigData.assignmentConfig.appealStartAt ||
    now > appealConfigData.assignmentConfig.appealStopAt
  )
    appealGradeButtonDisabled = true;

  // Handling color based on appeal status of the latest appeal
  let backgroundColor: string = "";
  let gradeTextColor: string = "";
  let attemptLeftTextColor: string = "";
  switch (appealStatus) {
    case AppealStatus.Accept:
      backgroundColor = "bg-green-50";
      gradeTextColor = "text-green-800";
      attemptLeftTextColor = "text-green-600";
      break;

    case AppealStatus.Reject:
      backgroundColor = "bg-red-50";
      gradeTextColor = "text-red-800";
      attemptLeftTextColor = "text-red-600";
      break;

    case AppealStatus.Pending:
      backgroundColor = "bg-yellow-50";
      gradeTextColor = "text-yellow-800";
      break;

    default:
      return (
        <div>
          <p>Error: Appeal Status is undefined!</p>
        </div>
      );
      break;
  }
  const divCss = "w-full mt-4 py-3 flex flex-col items-center rounded-lg " + backgroundColor;
  const gradeTextCss = "font-medium " + gradeTextColor;
  const attemptLeftTextCss = "font-medium text-xs mt-2 " + attemptLeftTextColor;

  return (
    <div className={divCss}>
      <p className={gradeTextCss}>
        Your Grade: <span className="font-bold">{score}</span>/{maxScore}
      </p>
      <AppealDetailsButton appealId={appealId} />
      <AppealResult appealResult={appealStatus} />
      {/* Only allow students to submit an appeal if latest appeal has been accepted or rejected */}
      {appealStatus != AppealStatus.Pending && (
        <>
          <AppealGradeButton assignmentId={assignmentId} disabled={appealGradeButtonDisabled} />
          <p className={attemptLeftTextCss}>Appeal Attempts Left: {appealAttemptLeft}</p>
        </>
      )}
    </div>
  );
}

interface DisplayLoadingProps {
  content: AssignmentConfig; // Assignment the page is showing
}

/**
 * Returns a loading page to show fetching data is in progress
 */
function DisplayLoading({ content }: DisplayLoadingProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div>
        <ul className="my-6">
          <li>
            <div className="flex flex-col items-center p-6 border bg-white mt-5 mx-5 rounded-lg overflow-y-scroll">
              <div className="flex w-full justify-between">
                <h1 className="text-lg font-light leading-5">{content.assignment.name}</h1>
              </div>
              <div className="mt-4 w-full">
                <SubmissionCollectionStatus closed={content.submissionWindowPassed} dueAt={content.dueAt} />
              </div>
              <div className="my-6" dangerouslySetInnerHTML={{ __html: content.assignment.description }} />
              <AssignmentSubmission
                configId={content.id}
                submissionClosed={content.submissionWindowPassed}
                isOpen={content.openForSubmission}
              />
            </div>
          </li>
          <SubmissionLoader />
        </ul>
      </div>
    </div>
  );
}

interface DisplayErrorProps {
  content: AssignmentConfig;
  errorMessage: string; // Message shown to the user when encountering an error
}

/**
 * Returns an error page
 */
function DisplayError({ content, errorMessage }: DisplayErrorProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div>
        <ul className="my-6">
          <li>
            <div className="flex flex-col items-center p-6 border bg-white mt-5 mx-5 rounded-lg overflow-y-scroll">
              <div className="flex w-full justify-between">
                <h1 className="text-lg font-light leading-5">{content.assignment.name}</h1>
              </div>
              <div className="mt-4 w-full">
                <SubmissionCollectionStatus closed={content.submissionWindowPassed} dueAt={content.dueAt} />
              </div>
              <div className="my-6" dangerouslySetInnerHTML={{ __html: content.assignment.description }} />
              <AssignmentSubmission
                configId={content.id}
                submissionClosed={content.submissionWindowPassed}
                isOpen={content.openForSubmission}
              />
            </div>
          </li>
          <div className="p-5 flex flex-1 flex-col h-full w-max">
            <div className="pb-3">
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
        </ul>
      </div>
    </div>
  );
}

interface AssignmentContentProps {
  content: AssignmentConfig; // Assignment the page is showing
}

/**
 * Returns a component that show the core content of the assignment page
 */
export function AssignmentContent({ content }: AssignmentContentProps) {
  const assignmentCreatedDate = new Date(content.createdAt);
  assignmentCreatedDate.setTime(assignmentCreatedDate.getTime() + 8 * 60 * 60 * 1000);
  const { user } = useZinc();

  // Fetch data with GraphQL
  const {
    data: submissionData,
    loading: submissionLoading,
    error: submissionError,
  } = useSubscription<{ submissions: SubmissionType[] }>(SUBMISSION_SUBSCRIPTION, {
    variables: { userId: user, assignmentConfigId: content.id },
  });
  const {
    data: appealsDetailsData,
    loading: appealDetailsLoading,
    error: appealDetailsError,
  } = useSubscription(GET_APPEALS_DETAILS_BY_ASSIGNMENT_ID, {
    variables: { userId: user, assignmentConfigId: content.id },
  });
  const {
    data: appealChangeLogData,
    loading: appealChangeLogLoading,
    error: appealChangeLogError,
  } = useSubscription(GET_APPEAL_CHANGE_LOGS_BY_ASSIGNMENT_ID, {
    variables: { userId: user, assignmentConfigId: content.id },
  });
  const {
    data: appealConfigData,
    loading: appealConfigLoading,
    error: appealConfigError,
  } = useQuery(GET_APPEAL_CONFIG, { variables: { assignmentConfigId: content.id } });

  // Display Loading if data fetching is still in-progress
  if (submissionLoading || appealConfigLoading || appealDetailsLoading || appealChangeLogLoading) {
    return <DisplayLoading content={content} />;
  }

  // Display Error if data cannot be fetched
  if (submissionError) {
    const errorMessage = "Unable to Fetch submission details with `SUBMISSION_SUBSCRIPTION`";
    return <DisplayError content={content} errorMessage={errorMessage} />;
  } else if (appealConfigError) {
    const errorMessage = "Unable to Fetch appeal details with `GET_APPEAL_CONFIG`";
    return <DisplayError content={content} errorMessage={errorMessage} />;
  } else if (appealDetailsError) {
    const errorMessage = "Unable to Fetch appeal details with `GET_APPEALS_DETAILS_BY_ASSIGNMENT_ID`";
    return <DisplayError content={content} errorMessage={errorMessage} />;
  } else if (appealChangeLogError) {
    const errorMessage = "Unable to Fetch appeal details with `GET_APPEAL_CHANGE_LOGS_BY_ASSIGNMENT_ID`";
    return <DisplayError content={content} errorMessage={errorMessage} />;
  }

  // Translate `appealDetailsData` to `AppealAttempt[]`
  let appealAttempts: AppealAttempt[] = transformToAppealAttempt({ appealsDetailsData });

  // Transform and sort the lists
  let message: (
    | (SubmissionType & { _type: "submission" })
    | (DisplayMessageType & { _type: "appealMessage" })
    | (AppealLog & { _type: "appealLog" })
  )[] = mergeDataToActivityLogList({ appealAttempt: appealAttempts, appealChangeLogData, submissionData });

  // Get number of appeal attempt left
  let appealAttemptLeft: number = appealConfigData.assignmentConfig.appealLimits - appealAttempts.length;
  if (appealAttemptLeft < 0) appealAttemptLeft = 0;

  // Get the latest score
  let score: number = -1;
  // 1. Get score from latest, non-appeal submission
  let cont: boolean = true;
  for (let i = 0; submissionData && cont && i < submissionData.submissions.length; i++) {
    cont = false;
    for (let j = 0; j < appealAttempts.length; j++) {
      if (submissionData.submissions[i].id == appealAttempts[j].newFileSubmissionId) {
        cont = true;
        break;
      }
    }
    if (!cont) {
      score = submissionData.submissions[i].reports[0].grade.score;
      break;
    }
  }
  // 2. Replace with score from appeal or `SCORE` change log (if any)
  const latestAppealUpdateDate: Date = new Date(appealAttempts[0].updatedAt);
  for (let i = 0; i < appealChangeLogData.changeLogs.length; i++) {
    const logDate: Date = new Date(appealChangeLogData.changeLogs[i].createdAt);
    if (
      logDate < latestAppealUpdateDate &&
      appealAttempts[0].latestStatus === AppealStatus.Accept &&
      appealAttempts[0].newFileSubmissionId &&
      appealsDetailsData.appeals[0].submission &&
      appealsDetailsData.appeals[0].submission.reports.length > 0
    ) {
      score = appealsDetailsData.appeals[0].submission.reports[0].grade.score;
      break;
    } else if (appealChangeLogData.changeLogs[i].type === "SCORE") {
      score = appealChangeLogData.changeLogs[i].updatedState.replace(/[^0-9]/g, "");
      break;
    }
  }

  const maxScore: number = appealsDetailsData.appeals[0].user.submissions[0].reports[0].grade.maxTotal;

  return (
    <div className="flex-1 overflow-y-auto">
      <div>
        <>
          {/* <div className="flex items-center justify-between py-4 px-6 bg-gray-100">
            <div className="flex items-center space-x-6">
              <Link href={content.assignment.course.website}>
                <a
                  target="_blank"
                  aria-label="Visit Course Website"
                  data-flow="right"
                  className="h-10 w-10 flex justify-center items-center rounded-full text-gray-500 hover:text-gray-600 focus:bg-gray-300 focus:outline-none transition duration-150 ease-in-out">
                  <label htmlFor="download" className="sr-only">Visit Course Website</label>
                  <FontAwesomeIcon icon={['fad', 'browser']} size="lg"/>
                </a>
              </Link>
              <button
                aria-label="View Teaching Staff"
                data-flow="right"
                className="h-10 w-10 flex justify-center items-center rounded-full text-gray-500 hover:text-gray-600 focus:bg-gray-300 focus:outline-none transition duration-150 ease-in-out">
                <label htmlFor="download" className="sr-only">View Teaching Staffs</label>
                <FontAwesomeIcon icon={['fad', 'users']} size="lg"/>
              </button>
              <button className="h-10 w-10 flex justify-center items-center rounded-full text-gray-500 hover:text-gray-600 focus:bg-gray-300 focus:outline-none transition duration-150 ease-in-out">
                <label htmlFor="download" className="sr-only">List of files</label>
                <FontAwesomeIcon icon={['fad', 'folder-tree']} size="lg"/>
              </button>
              <button 
                aria-label="Download Skeleton Code"
                data-flow="right"
                className="h-10 w-10 flex justify-center items-center rounded-full text-gray-500 hover:text-gray-600 focus:bg-gray-300 focus:outline-none transition duration-150 ease-in-out">
                <label htmlFor="download" className="sr-only">Download Skeleton Code</label>
                <FontAwesomeIcon icon={['fad', 'folder-download']} size="lg"/>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex justify-center items-center text-gray-500 w-8 h-8 rounded-full focus:bg-gray-300 focus:outline-none hover:text-gray-600 transition duration-150 ease-in-out">
                <label htmlFor="download" className="sr-only">Download Skeleton Code</label>
                <FontAwesomeIcon icon={['far', 'angle-up']} size="lg"/>
              </button>
              <button className="flex justify-center items-center text-gray-500 w-8 h-8 rounded-full focus:bg-gray-300 focus:outline-none hover:text-gray-600 transition duration-150 ease-in-out">
                <label htmlFor="download" className="sr-only">Download Skeleton Code</label>
                <FontAwesomeIcon icon={['far', 'angle-down']} size="lg"/>
              </button>
            </div>
          </div> */}
        </>
        <ul className="my-6">
          <li>
            <div className="flex flex-col items-center p-6 border bg-white mt-5 mx-5 rounded-lg overflow-y-scroll">
              <div className="flex w-full justify-between">
                <h1 className="text-lg font-light leading-5">{content.assignment.name}</h1>
                <span className="text-gray-400 text-sm">Released on {assignmentCreatedDate.toDateString()}</span>
              </div>
              <div className="mt-4 w-full">
                <SubmissionCollectionStatus closed={content.submissionWindowPassed} dueAt={content.dueAt} />
              </div>
              <div className="my-6" dangerouslySetInnerHTML={{ __html: content.assignment.description }} />
              <AssignmentSubmission
                configId={content.id}
                submissionClosed={content.submissionWindowPassed}
                isOpen={content.openForSubmission}
              />
              {score && maxScore && (
                <GradePanel
                  content={content}
                  assignmentId={content.id}
                  score={score}
                  maxScore={maxScore}
                  appealAttemptLeft={appealAttemptLeft}
                  appealAttempt={appealAttempts[0]}
                  appealConfigData={appealConfigData}
                />
              )}
            </div>
          </li>
          {submissionLoading && <SubmissionLoader />}
          {message &&
            message.map((log) => {
              if (log._type === "appealLog") {
                return <AppealLogMessage key={log.id} log={log} showButton={true} />;
              } else if (log._type === "submission") {
                return <Submission key={log.id} submission={log} />;
              }
            })}
        </ul>
      </div>
    </div>
  );
}

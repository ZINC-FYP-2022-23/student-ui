import {
  GET_APPEALS_DETAILS_BY_ASSIGNMENT_ID,
  GET_APPEAL_CHANGE_LOGS_BY_ASSIGNMENT_ID,
  GET_APPEAL_CONFIG,
} from "@/graphql/queries/appealQueries";
import { AppealAttempt, AppealLog, AppealStatus, ChangeLogTypes, DisplayMessageType } from "@/types/appeal";
import { Appeal, AssignmentConfig, ChangeLog, Submission as SubmissionType } from "@/types/tables";
import { getMaxScore, mergeDataToActivityLogList, transformToAppealAttempt } from "@/utils/appealUtils";
import { getLocalDateFromString } from "@/utils/date";
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
 * @param isOpen - Is the submission opened yet.
 * @param submissionClosed - Is the submission closed already.
 */
function AssignmentSubmission({ submissionClosed, isOpen }) {
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
        // @ts-ignore
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
    [dispatch, submitFile],
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
}

/**
 * Returns the button that directs to the Appeal Submission page.
 */
function AppealGradeButton({ assignmentId }: AssignmentGradeButtonProps) {
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
  /** Number of appeals attempt that can be made left. */
  appealAttemptsLeft: number | null;
  /** The latest appeal attempt. */
  appealAttempt: AppealAttempt;
  /** Raw data of appeal configs. */
  appealConfigData: { assignmentConfig: AssignmentConfig } | undefined;
}

/**
 * Returns a component of a box that shows the Final Grade and Appeal Status (if any)
 */
function GradePanel({
  content,
  assignmentId,
  score,
  maxScore,
  appealAttemptsLeft,
  appealAttempt,
  appealConfigData,
}: GradePanelProps) {
  let appealId: number | null = null;
  let appealStatus: AppealStatus | null = null; // Latest status of the submitted appeal (if any)
  if (appealAttempt) {
    appealId = appealAttempt.id;
    appealStatus = appealAttempt.status;
  }
  const now = new Date();
  const appealStartAt = getLocalDateFromString(appealConfigData?.assignmentConfig.appealStartAt ?? null);
  const appealStopAt = getLocalDateFromString(appealConfigData?.assignmentConfig.appealStopAt ?? null);

  // Error if appealConfigData is undefined or null
  if (!appealConfigData) {
    const errorMessage = "Appeal Config Data is not available.";
    return <DisplayError content={content} errorMessage={errorMessage} />;
  } else if (!appealConfigData.assignmentConfig) {
    const errorMessage = "Assignment configs are not available.";
    return <DisplayError content={content} errorMessage={errorMessage} />;
  }

  // Check if new appeal can be submitted
  const isAppealAllowed = appealConfigData.assignmentConfig.isAppealAllowed;
  const canAppeal =
    isAppealAllowed &&
    (appealAttemptsLeft === null || appealAttemptsLeft > 0) &&
    appealStartAt &&
    now >= appealStartAt &&
    appealStopAt &&
    now <= appealStopAt &&
    appealStatus !== AppealStatus.PENDING;

  // Handling color based on appeal status of the latest appeal
  let backgroundColor: string = "";
  let gradeTextColor: string = "";
  let attemptLeftTextColor: string = "";
  switch (appealStatus) {
    case AppealStatus.REJECTED:
      backgroundColor = "bg-red-50";
      gradeTextColor = "text-red-800";
      attemptLeftTextColor = "text-red-600";
      break;

    case AppealStatus.PENDING:
      backgroundColor = "bg-yellow-50";
      gradeTextColor = "text-yellow-800";
      break;

    default:
      backgroundColor = "bg-green-50";
      gradeTextColor = "text-green-800";
      attemptLeftTextColor = "text-green-600";
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
      {isAppealAllowed && appealStartAt && now >= appealStartAt && (
        <>
          {appealId && appealStatus && (
            <>
              <AppealDetailsButton appealId={appealId} />
              <AppealResult appealResult={appealStatus} />
            </>
          )}
          {/* Only allow students to submit an appeal if not appealed before or latest appeal has been accepted or rejected */}
          {canAppeal && <AppealGradeButton assignmentId={assignmentId} />}
          {appealStatus !== AppealStatus.PENDING && (
            <p className={attemptLeftTextCss}>
              {appealAttemptsLeft !== null
                ? `Appeal Attempts Left: ${appealAttemptsLeft}`
                : "Unlimited Appeal Attempts."}
            </p>
          )}
          {appealStopAt && now > appealStopAt && <p className={attemptLeftTextCss}>Appeal deadline passed.</p>}
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

function getScore(appeals: Appeal[], changeLogs: ChangeLog[], submissions: SubmissionType[]) {
  /* *** Logic of how to get the score: ***
   * Note: latest valid appeal refers to latest `ACCEPTED` appeal containing file submission, i.e. newFileSubmission is not null
   * If the `updatedAt` of the latest valid appeal later than the date of the latest `SCORE` change:
   *    >>> use the score of the `newFileSubmission`.
   * If the date of the latest `SCORE` change later than the `updatedAt` of the latest valid appeal:
   *    >>> use the score of latest `SCORE` change.
   * If there is a valid appeal AND NO `SCORE` change log:
   *    >>> use the score of the `newFileSubmission`.
   * If there is a `SCORE` change log AND NO valid appeal:
   *    >>> use the score of latest `SCORE` change.
   * Finally, if there are NO `SCORE` change log AND NO valid appeal:
   *    >>> use the score of the original submission.
   */

  // Get the latest `ACCEPTED` appeal with a new score generated
  const latestValidAppeal: Appeal | undefined = appeals.find(
    (appeal) =>
      appeal.status === AppealStatus.ACCEPTED &&
      appeal.updatedAt &&
      appeal.submission &&
      appeal.submission.reports.length &&
      appeal.submission.reports[0].grade,
  );

  // Get the latest `SCORE` change log
  const latestScoreLog: ChangeLog | undefined = changeLogs.find(
    (log) => log.type === ChangeLogTypes.SCORE && log.updatedState.type === "score",
  );

  // Both appeal and score change log exist
  if (latestValidAppeal && latestScoreLog && latestScoreLog.updatedState.type === "score") {
    const acceptedAppealDate = getLocalDateFromString(latestValidAppeal.updatedAt)!;
    const scoreChangeDate = getLocalDateFromString(latestScoreLog.createdAt)!;

    // return score of the latest
    return acceptedAppealDate > scoreChangeDate
      ? latestValidAppeal.submission.reports[0].grade.score
      : latestScoreLog.updatedState.score;
  }
  // Only appeal exists
  if (latestValidAppeal && !latestScoreLog) {
    return latestValidAppeal.submission.reports[0].grade.score;
  }
  // Only score change exists
  if (latestScoreLog && !latestValidAppeal && latestScoreLog.updatedState.type === "score") {
    return latestScoreLog.updatedState.score;
  }

  // If above fails, get the original submission score
  return submissions.find(
    (submission) => !submission.isAppeal && submission.reports.length && submission.reports[0].grade,
  )?.reports[0].grade.score;
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
  } = useSubscription<{ appeals: Appeal[] }>(GET_APPEALS_DETAILS_BY_ASSIGNMENT_ID, {
    variables: { userId: user, assignmentConfigId: content.id },
  });
  const {
    data: appealChangeLogData,
    loading: appealChangeLogLoading,
    error: appealChangeLogError,
  } = useSubscription<{ changeLogs: ChangeLog[] }>(GET_APPEAL_CHANGE_LOGS_BY_ASSIGNMENT_ID, {
    variables: { userId: user, assignmentConfigId: content.id },
  });
  const {
    data: appealConfigData,
    loading: appealConfigLoading,
    error: appealConfigError,
  } = useQuery<{ assignmentConfig: AssignmentConfig }>(GET_APPEAL_CONFIG, {
    variables: { assignmentConfigId: content.id },
  });

  // Display Loading if data fetching is still in-progress
  if (submissionLoading || appealConfigLoading || appealDetailsLoading || appealChangeLogLoading) {
    return <DisplayLoading content={content} />;
  }

  // Display Error if data cannot be fetched
  let errorMessage: string | null = null;
  if (submissionError) {
    errorMessage = "Failed to fetch submission details.";
  } else if (appealConfigError || appealDetailsError || appealChangeLogError) {
    errorMessage = "Failed to fetch appeal details";
  }
  if (errorMessage) {
    return <DisplayError content={content} errorMessage={errorMessage} />;
  }

  // Translate `appealDetailsData` to `AppealAttempt[]`
  const appealAttempts: AppealAttempt[] = transformToAppealAttempt({ appealsDetailsData });

  // Transform and sort the lists
  const message: (
    | (SubmissionType & { _type: "submission" })
    | (DisplayMessageType & { _type: "appealMessage" })
    | (AppealLog & { _type: "appealLog" })
  )[] = mergeDataToActivityLogList({ appealAttempt: appealAttempts, appealChangeLogData, submissionData });

  // Get number of appeal attempt left
  const appealLimits = appealConfigData!.assignmentConfig!.appealLimits;
  const appealAttemptsLeft = appealLimits !== null ? Math.max(0, appealLimits - appealAttempts.length) : null;

  // Get the original score
  const score = getScore(appealsDetailsData!.appeals, appealChangeLogData!.changeLogs, submissionData!.submissions);

  const maxScore = getMaxScore(submissionData?.submissions);

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
                submissionClosed={content.submissionWindowPassed}
                isOpen={content.openForSubmission}
              />
              {score !== null && score !== undefined && maxScore !== null && maxScore !== undefined ? (
                <GradePanel
                  content={content}
                  assignmentId={content.id}
                  score={score}
                  maxScore={maxScore}
                  appealAttemptsLeft={appealAttemptsLeft}
                  appealAttempt={appealAttempts[0]}
                  appealConfigData={appealConfigData}
                />
              ) : null}
            </div>
          </li>
          {submissionLoading && <SubmissionLoader />}
          {message &&
            message.map((log, index) => {
              if (log._type === "appealLog") {
                return <AppealLogMessage key={index} log={log} showButton showReason={false} />;
              } else if (log._type === "submission") {
                return <Submission key={index} submission={log} />;
              }
            })}
        </ul>
      </div>
    </div>
  );
}

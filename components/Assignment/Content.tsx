import { useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDropzone } from "react-dropzone";
import { useZinc } from "../../contexts/zinc";
import { Submission } from "../Submission";
import { SubmissionCollectionStatus } from "../SubmissionCollectionStatus";
import { useLayoutDispatch } from "../../contexts/layout";
import { useSubscription } from "@apollo/client";
import { SUBMISSION_SUBSCRIPTION } from "../../graphql/queries/user";
import { SubmissionLoader } from "../SubmissionLoader";
import Link from "next/link";
import { AssignmentConfig, Grade, Submission as SubmissionType } from "@/types/tables";
import { AppealResult } from "../Appeal/AppealResult";
import { AppealLogMessage } from "../Appeal/AppealLogMessage";
import { AppealStatus, AppealAttempt, AppealLog, ChangeLogTypes, DisplayMessageType, ChangeLog } from "@/types/appeal";
import { isAppealLog, isDisplayMessageType, sort, transformToAppealLog } from "@/utils/appealUtils";
// import { Notification, SubmissionNotification } from "../Notification";
// import toast from "react-hot-toast";
// import { useMutation} from "@apollo/client";
// import { UPDATE_SUBMISSION_NOTI } from "../../graphql/mutations/user";

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

interface AssignmentContentProps {
  assignmentId: number;
  disabled: boolean;
}

function AppealGradeButton({ assignmentId, disabled }: AssignmentContentProps) {
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
  assignmentId: number;
  finalGrade: Grade;
  appealAttemptLeft: number;
  appealId: number | null;
  appealStatus: AppealStatus | null;
}

function GradePanel({ assignmentId, finalGrade, appealAttemptLeft, appealId, appealStatus }: GradePanelProps) {
  let disabled = false;
  if (appealAttemptLeft <= 0) disabled = true;

  switch (appealStatus) {
    case AppealStatus.Accept:
      if (appealId != null) {
        return (
          <div className="w-full mt-4 py-3 flex flex-col items-center bg-green-50 rounded-lg">
            <p className="text-green-800 font-medium">
              Your Grade: <span className="font-bold">{finalGrade.score}</span>/{finalGrade.maxTotal}
            </p>
            <AppealDetailsButton appealId={appealId} />
            <AppealResult appealResult={appealStatus} />
            <AppealGradeButton assignmentId={assignmentId} disabled={disabled} />
            <p className="text-green-600 font-medium text-xs mt-2">Appeal Attempts Left: {appealAttemptLeft}</p>
          </div>
        );
      } else {
        return <p>Error: appealId is NULL while AppealStatus is pending</p>;
      }
      break;

    case AppealStatus.Reject:
      if (appealId != null) {
        return (
          <div className="w-full mt-4 py-3 flex flex-col items-center bg-red-50 rounded-lg">
            <p className="text-red-800 font-medium">
              Your Grade: <span className="font-bold">{finalGrade.score}</span>/{finalGrade.maxTotal}
            </p>
            <AppealDetailsButton appealId={appealId} />
            <AppealResult appealResult={appealStatus} />
            <AppealGradeButton assignmentId={assignmentId} disabled={disabled} />
            <p className="text-red-600 font-medium text-xs mt-2">Appeal Attempts Left: {appealAttemptLeft}</p>
          </div>
        );
      } else {
        return <p>Error: appealId is NULL while AppealStatus is pending</p>;
      }
      break;

    case AppealStatus.Pending:
      if (appealId != null) {
        return (
          <div className="w-full mt-4 py-3 flex flex-col items-center bg-yellow-50 rounded-lg">
            <p className="text-yellow-800 font-medium">
              Your Grade: <span className="font-bold">{finalGrade.score}</span>/{finalGrade.maxTotal}
            </p>
            <AppealDetailsButton appealId={appealId} />
            <AppealResult appealResult={appealStatus} />
          </div>
        );
      } else {
        return <p>Error: appealId is NULL while AppealStatus is pending</p>;
      }
      break;

    case null:
      return (
        <div className="w-full mt-4 py-3 flex flex-col items-center bg-green-50 rounded-lg">
          <p className="text-green-800 font-medium">
            Your Grade: <span className="font-bold">{finalGrade.score}</span>/{finalGrade.maxTotal}
          </p>
          <AppealGradeButton assignmentId={assignmentId} disabled={disabled} />
          <p className="text-green-600 font-medium text-xs mt-2">Appeal Attempts Left: {appealAttemptLeft}</p>
        </div>
      );
      break;

    default:
      return (
        <div>
          <p>Error: Appeal Status is undefined!</p>
        </div>
      );
      break;
  }
}

export function AssignmentContent({ content }: { content: AssignmentConfig }) {
  const assignmentCreatedDate = new Date(content.createdAt);
  assignmentCreatedDate.setTime(assignmentCreatedDate.getTime() + 8 * 60 * 60 * 1000);
  const { user } = useZinc();
  const { data, loading } = useSubscription<{ submissions: SubmissionType[] }>(SUBMISSION_SUBSCRIPTION, {
    variables: {
      userId: user,
      assignmentConfigId: content.id,
    },
  });

  let finalGrade: Grade | null = null;

  if (data && data.submissions.length > 0 && data.submissions[0].reports.length > 0) {
    finalGrade = data.submissions[0].reports[0].grade;
  }

  // TODO(Bryan): Get the following data from the Database after it's been update
  const appealStatus = AppealStatus.Accept;
  const appealId = 2;
  const appealAttemptLeft = 1;
  const appealAttempts: AppealAttempt[] = [
    {
      id: 1001,
      assignmentConfigAndUserId: 999,
      createdAt: "2023-8-22",
      latestStatus: AppealStatus.Reject,
      updatedAt: "2023-12-23",
    },
    {
      id: 1002,
      assignmentConfigAndUserId: 999,
      createdAt: "2023-7-20",
      latestStatus: AppealStatus.Accept,
      updatedAt: "2023-12-21",
    },
  ];
  const changeLogList: ChangeLog[] = [
    {
      id: 2001,
      createdAt: "2023-6-22",
      type: ChangeLogTypes.APPEAL_STATUS,
      originalState: "[{'status':PENDING}]",
      updatedState: "[{'status':REJECTED}]",
      initiatedBy: 2,
    },
    {
      id: 2002,
      createdAt: "2023-1-1",
      type: ChangeLogTypes.APPEAL_STATUS,
      originalState: "[{'status':REJECTED}]",
      updatedState: "[{'status':ACCEPTED}]",
      initiatedBy: 2,
    },
  ];
  // END OF TODO

  let log: AppealLog[] = transformToAppealLog({ appeals: appealAttempts, changeLog: changeLogList });

  let message: (
    | (SubmissionType & { _type: "submission" })
    | (DisplayMessageType & { _type: "appealMessage" })
    | (AppealLog & { _type: "appealLog" })
  )[] = sort({
    submissions: data?.submissions,
    appealLog: log,
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div>
        <div>
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
        </div>
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
              {finalGrade && (
                <GradePanel
                  assignmentId={content.id}
                  finalGrade={finalGrade}
                  appealAttemptLeft={appealAttemptLeft}
                  appealId={appealId}
                  appealStatus={appealStatus}
                />
              )}
            </div>
          </li>
          {loading && <SubmissionLoader />}
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

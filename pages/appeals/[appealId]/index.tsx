import { AppealLogMessage } from "@/components/Appeal/AppealLogMessage";
import { AppealResult } from "@/components/Appeal/AppealResult";
import { AppealTextMessage } from "@/components/Appeal/AppealTextMessage";
import { AssignmentSection } from "@/components/Assignment/List";
import RichTextEditor from "@/components/RichTextEditor";
import { LayoutProvider } from "@/contexts/layout";
import { Layout } from "@/layout";
import { AppealLog, AppealStatus, DisplayMessageType } from "@/types/appeal";
import { Submission as SubmissionType } from "@/types/tables";
import { sort, transformToAppealLog } from "@/utils/appealUtils";
import { appeal, appealAttempts, changeLogList, messageList } from "@/utils/dummyData";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tab } from "@headlessui/react";
import { Alert, clsx, createStyles } from "@mantine/core";
import { GetServerSideProps } from "next";
import Link from "next/link";
import { DiffSubmissionsData } from "pages/api/appeals/diffSubmissions";
import { useEffect, useState } from "react";
import { ReactGhLikeDiff } from "react-gh-like-diff";

type ActivityLogTabProps = {
  activityLogList: (
    | (SubmissionType & { _type: "submission" })
    | (DisplayMessageType & { _type: "appealMessage" })
    | (AppealLog & { _type: "appealLog" })
  )[];
};

/**
 * Return a component that shows the Activity Log under the Activity Log Tab to show all appeal messages and appeal logs
 * @param {
 *  | ((SubmissionType & { _type: "submission" })
 *  | (DisplayMessageType & { _type: "appealMessage" })
 *  | (AppealLog & { _type: "appealLog" }))[]
 * } activityLogList - A list of logs that may include appeal messages and appeal logs
 */
function ActivityLogTab({ activityLogList }: ActivityLogTabProps) {
  const [comments, setComments] = useState("");

  return (
    <div className="flex flex-col space-y-2">
      <div>
        {activityLogList.map(
          (
            log:
              | (SubmissionType & { _type: "submission" })
              | (DisplayMessageType & { _type: "appealMessage" })
              | (AppealLog & { _type: "appealLog" }),
          ) => {
            if (log._type === "appealLog") {
              return <AppealLogMessage key={log.id} log={log} showButton={false} />;
            } else if (log._type === "appealMessage") {
              return <AppealTextMessage key={log.id} message={log} />;
            }
          },
        )}
      </div>
      <div className="mb-6 sticky bottom-0 object-bottom">
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
      </div>
    </div>
  );
}

type CodeComparisonTabProps = {
  diffData: DiffSubmissionsData & { status?: number };
};

/**
 * Show the difference between new and old file submissions under the Code Comparison Tab by using ReactGhLikeDiff
 */
function CodeComparisonTab({ diffData }: CodeComparisonTabProps) {
  const { classes } = useStyles();
  const { diff, error, status } = diffData;

  if (status !== 200) {
    return (
      <div className="mt-8 flex flex-col items-center space-y-5 text-red-500">
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
      <p className="mt-8 text-center text-gray-600">The new appeal submission is the same as the old submission.</p>
    );
  }
  return (
    <div className={clsx("relative", classes.diffView)}>
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

const useStyles = createStyles(() => ({
  diffView: {
    "& .d2h-file-name": {
      // Overrides the hidden file name in `index.css`
      display: "block !important",
    },
  },
}));

type AppealResultBoxProps = {
  appealResult: AppealStatus;
};

/**
 * Returns the component that shows the latest appeal status at the top of the page
 * @param {AppealStatus} appealResult - The latest appeal status
 */
function AppealResultBox({ appealResult }: AppealResultBoxProps) {
  switch (appealResult) {
    case AppealStatus.Accept:
      return (
        <div className="bg-green-50 py-3 rounded-md">
          <AppealResult appealResult={appealResult} />
        </div>
      );
    case AppealStatus.Reject:
      return (
        <div className="bg-red-50 py-3 rounded-md">
          <AppealResult appealResult={appealResult} />
        </div>
      );
    case AppealStatus.Pending:
      return (
        <div className="bg-yellow-50 py-3 rounded-md">
          <AppealResult appealResult={appealResult} />
        </div>
      );
  }
}

type AppealDetailsProps = {
  assignmentId: number;
  appealSubmitted: boolean;
  allowAccess: boolean;
  appealResult: AppealStatus;
  activityLogList: (
    | (SubmissionType & { _type: "submission" })
    | (DisplayMessageType & { _type: "appealMessage" })
    | (AppealLog & { _type: "appealLog" })
  )[];
};

/**
 * Returns the entire Appeal Details page
 * @param {number}  assignmentId - The assignment ID that the appeal is related to
 * @param {boolean} appealSubmitted - Is the appeal ID valid
 * @param {boolean} allowAccess - Is the student allowed to access the appeal
 * @param {AppealStatus}  appealResult - The latest appeal status
 * @param {
 *  | ((SubmissionType & { _type: "submission" })
 *  | (DisplayMessageType & { _type: "appealMessage" })
 *  | (AppealLog & { _type: "appealLog" }))[]
 * } activityLogList - A list of log that includes appeal messages and appeal logs
 */
function AppealDetails({
  assignmentId,
  appealSubmitted,
  allowAccess,
  appealResult,
  activityLogList,
}: AppealDetailsProps) {
  /** Diff data for the "Code Comparison" tab. */
  const [diffSubmissionsData, setDiffSubmissionsData] = useState<DiffSubmissionsData & { status?: number }>({
    diff: "",
    error: null,
  });

  useEffect(() => {
    // TODO(BRYAN): Obtain the submission IDs from the backend
    const oldSubmissionId = 1;
    const newSubmissionId = 2;

    const diffSubmission = async () => {
      try {
        const response = await fetch(`/api/appeals/diffSubmissions?oldId=${oldSubmissionId}&newId=${newSubmissionId}`, {
          method: "GET",
        });
        const { status } = response;
        const { diff, error } = await response.json();
        setDiffSubmissionsData({ diff, error, status });
      } catch (error) {
        setDiffSubmissionsData({ diff: "", status: 500, error: "An unknown error has occurred." });
      }
    };

    diffSubmission();
  }, []);

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
              <div className="w-full mt-3">
                <AppealResultBox appealResult={appealResult} />
              </div>
            </div>
            {appealSubmitted && allowAccess ? (
              <div className="p-2 flex-1 overflow-y-auto space-y-2">
                <Tab.Group>
                  <Tab.List className="mt-3 px-6 flex gap-6 text-sm border-b w-full">
                    <Tab
                      className={({ selected }) =>
                        `pb-3 px-1 border-b-2 font-medium text-sm leading-5 focus:outline-none transition ${
                          selected
                            ? "border-cse-500 text-cse-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`
                      }
                    >
                      Activity Log
                    </Tab>
                    <Tab
                      className={({ selected }) =>
                        `pb-3 px-1 border-b-2 font-medium text-sm leading-5 focus:outline-none transition ${
                          selected
                            ? "border-cse-500 text-cse-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`
                      }
                    >
                      Code Comparison
                    </Tab>
                  </Tab.List>
                  <Tab.Panels>
                    {/* "Messaging" tab panel */}
                    <Tab.Panel>
                      <ActivityLogTab activityLogList={activityLogList} />
                    </Tab.Panel>
                    {/* "Code Comparison" tab panel */}
                    <Tab.Panel>
                      <CodeComparisonTab diffData={diffSubmissionsData} />
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </div>
            ) : (
              <div className="my-6 mt-8 flex flex-col items-center self-center mb-4">
                <Alert
                  icon={<FontAwesomeIcon icon={["far", "circle-exclamation"]} />}
                  title="Appeal Unavailable"
                  color="red"
                  variant="filled"
                >
                  {!appealSubmitted
                    ? "You have not submitted an appeal."
                    : !allowAccess
                    ? "You do not have access to this appeal."
                    : "Unknown Error."}
                </Alert>
              </div>
            )}
          </div>
        </main>
      </Layout>
    </LayoutProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, query }) => {
  const userId = parseInt(req.cookies.user);
  const assignmentId = parseInt(query.assignmentId as string);

  // TODO(BRYAN): Retrieve the data from server once it's updated
  //The data to be retrieved: appeal, appealAttempts, changeLogList, messageList

  const appealUserID: number = userId; // Used for checking if the userID matches

  let log: AppealLog[] = transformToAppealLog({ appeals: appealAttempts, changeLog: changeLogList });

  let activityLogList: (
    | (SubmissionType & { _type: "submission" })
    | (DisplayMessageType & { _type: "appealMessage" })
    | (AppealLog & { _type: "appealLog" })
  )[] = sort({
    messages: messageList,
    appealLog: log,
  });

  // Check if appeal is non-null
  let appealSubmitted: boolean;
  if (appeal !== null) appealSubmitted = true;
  else appealSubmitted = false;

  // Check if the student has access to the appeal
  let allowAccess: boolean;
  if (appealUserID === userId) allowAccess = true;
  else allowAccess = false;

  return {
    props: {
      assignmentId,
      allowAccess,
      appealSubmitted,
      appealResult: appeal?.latestStatus,
      activityLogList,
    },
  };
};

export default AppealDetails;

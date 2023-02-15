import { AppealLogMessage } from "@/components/Appeal/AppealLogMessage";
import { AppealResult } from "@/components/Appeal/AppealResult";
import { AppealTextMessage } from "@/components/Appeal/AppealTextMessage";
import { AssignmentSection } from "@/components/Assignment/List";
import RichTextEditor from "@/components/RichTextEditor";
import { LayoutProvider, useLayoutState } from "@/contexts/layout";
import { Layout } from "@/layout";
import { AppealLog, AppealStatus, DisplayMessageType } from "@/types/appeal";
import { Submission as SubmissionType } from "@/types/tables";
import { sort, transformToAppealLog } from "@/utils/appealUtils";
import { appeal, appealAttempts, changeLogList, messageList } from "@/utils/dummyData";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tab } from "@headlessui/react";
import { Alert } from "@mantine/core";
import { GetServerSideProps } from "next";
import Link from "next/link";
import { useState } from "react";
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

type CodeComparisonTabProps = {};

/**
 * Show the difference between new and old file submissions under the Code Comparison Tab by using ReactGhLikeDiff
 */
function CodeComparisonTab({}: CodeComparisonTabProps) {
  const { stdioTestCase } = useLayoutState();

  return (
    <div>
      <ReactGhLikeDiff
        options={{
          originalFileName: "Original Submission",
          updatedFileName: "New Submission",
          outputFormat: "side-by-side",
        }}
        // TODO(ANSON): Fix diffString error
        //diffString={stdioTestCase.diff.join("\n")}
      />
    </div>
  );
}

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
        <div className="bg-green-50 mt-4 py-3">
          <AppealResult appealResult={appealResult} />
        </div>
      );
      break;

    case AppealStatus.Reject:
      return (
        <div className="bg-red-50 mt-4 py-3">
          <AppealResult appealResult={appealResult} />
        </div>
      );
      break;

    case AppealStatus.Pending:
      return (
        <div className="bg-yellow-50 mt-4 py-3">
          <AppealResult appealResult={appealResult} />
        </div>
      );
      break;
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
  return (
    <LayoutProvider>
      <Layout title="Grade Appeal Details">
        <main className="flex-1 flex bg-gray-200 overflow-y-auto">
          <AssignmentSection />
          <div className="p-5 flex flex-1 flex-col h-full w-max">
            <Link href={`/assignments/${assignmentId}`}>
              <a className="max-w-max-content w-max px-3 py-1.5 mb-3 border border-gray-300 text-sm leading-4 font-medium rounded-lg text-blue-700 bg-white hover:text-blue-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-blue-800 active:bg-gray-50 transition ease-in-out duration-150">
                <FontAwesomeIcon icon={["far", "chevron-left"]} className="mr-2" />
                Back
              </a>
            </Link>
            {appealSubmitted && allowAccess ? (
              <div>
                <h1 className="font-semibold text-2xl text-center">Grade Appeal</h1>
                <div className="w-full">
                  <AppealResultBox appealResult={appealResult} />
                </div>
                <div className="p-2 flex-1 space-y-2">
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
                        <CodeComparisonTab />
                      </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>
                </div>
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

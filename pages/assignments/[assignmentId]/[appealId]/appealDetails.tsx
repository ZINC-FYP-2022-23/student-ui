import { LayoutProvider, useLayoutState } from "@/contexts/layout";
import { Layout } from "@/layout";
import { AssignmentSection } from "@/components/Assignment/List";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GetServerSideProps } from "next";
import { Tab } from "@headlessui/react";
import React, { useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { ReactGhLikeDiff } from "react-gh-like-diff";
import { emit } from "process";
import { AppealResult } from "@/components/Assignment/AppealResult";
import { Alert } from "@mantine/core";
import { AppealStatus, AppealAttempt } from "@/types/appeal";

type IconProps = {
  name: String;
  type: "Student" | "Teaching Assistant";
};

function Icon({ name, type }: IconProps) {
  let backgroundColor: string;
  switch (type) {
    case "Student":
      backgroundColor = "bg-blue-700";
      break;
    case "Teaching Assistant":
      backgroundColor = "bg-red-800";
      break;
    default:
      backgroundColor = "bg-gray-800";
  }

  const css = "w-10 h-10 leading-10 rounded-full text-white font-bold text-lg text-center " + backgroundColor;
  return <div className={css}>{name.charAt(0)}</div>;
}

type Message = {
  id: number;
  name: String;
  type: "Student" | "Teaching Assistant";
  content: String;
  time: String;
};

function SingleMessage({ message }: { message: Message }) {
  const { name, type, time, content } = message;

  return (
    <div className="flex flex-row space-x-2">
      <Icon name={name} type={type} />
      <div className="overflow-x-auto">
        <div className="flex flex-row space-x-2">
          <p className="font-bold text-lg">{name}</p>
          <p className="text-gray-500">({type})</p>
          <p className="text-green-700">{time}</p>
        </div>
        <p>{message.content}</p>
      </div>
    </div>
  );
}

type MessagingTabProps = {
  messageList: Message[];
};

function MessagingTab({ messageList }: MessagingTabProps) {
  const [comments, setComments] = useState("");

  return (
    <div className="flex flex-col space-y-2">
      <div className="space-y-4">
        {messageList.map((message: Message) => (
          <div key={message.id}>
            <SingleMessage message={message} />
          </div>
        ))}
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
        // TODO(Bryan): Fix diffString error
        //diffString={stdioTestCase.diff.join("\n")}
      />
    </div>
  );
}

type AppealResultBoxProps = {
  appealResult: AppealStatus;
};

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
  messageList: Message[];
};

function AppealDetails({ assignmentId, appealSubmitted, allowAccess, appealResult, messageList }: AppealDetailsProps) {
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
                        Messaging
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
                        <MessagingTab messageList={messageList} />
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
  const appealResult: AppealStatus = AppealStatus.Pending;
  const appeal: AppealAttempt | null = {
    id: 1,
    submissionId: 999,
    createdAt: new Date("2022-12-20"),
    latestStatus: AppealStatus.Reject,
    changeLog: [],
    decisionTimestamp: new Date("2022-12-21"),
  };
  const appealUserID: number = userId;

  const messageList: Message[] = [
    {
      id: 1,
      name: "Lo Kwok Yan Bryan",
      type: "Student",
      time: "14 Nov 2022, 18:11",
      content: "Hi TA, I want to submit a grade appeal.",
    },
    {
      id: 2,
      name: "Gilbert Chan",
      type: "Teaching Assistant",
      time: "15 Nov 2022, 20:59",
      content: "Dear Bryan, Nice to Meet You!",
    },
    {
      id: 3,
      name: "Lo Kwok Yan Bryan",
      type: "Student",
      time: "14 Nov 2022, 18:11",
      content: "Hi TA, I want to submit a grade appeal.",
    },
    {
      id: 4,
      name: "Gilbert Chan",
      type: "Teaching Assistant",
      time: "15 Nov 2022, 20:59",
      content: "Okie, chekcing!",
    },
    {
      id: 5,
      name: "Lo Kwok Yan Bryan",
      type: "Student",
      time: "14 Nov 2022, 18:11",
      content: "Thank you.",
    },
    {
      id: 6,
      name: "Gilbert Chan",
      type: "Teaching Assistant",
      time: "15 Nov 2022, 20:59",
      content: "Still in process!",
    },
  ];
  // End of Data Retrieval

  // Check if appeal is non-null
  let appealSubmitted: boolean;
  if (appeal !== null) {
    appealSubmitted = true;
  } else {
    appealSubmitted = false;
  }

  // Check if the student has access to the appeal
  let allowAccess: boolean;
  if (appealUserID === userId) {
    allowAccess = true;
  } else {
    allowAccess = false;
  }

  return {
    props: {
      assignmentId,
      allowAccess,
      appealSubmitted,
      appealResult: appeal?.latestStatus,
      messageList,
    },
  };
};

export default AppealDetails;

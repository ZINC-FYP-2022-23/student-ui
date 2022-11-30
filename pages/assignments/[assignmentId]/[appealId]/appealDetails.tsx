import { LayoutProvider, useLayoutState } from "../../../../contexts/layout";
import { Layout } from "../../../../layout";
import { AssignmentSection } from "../../../../components/Assignment/List";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GetServerSideProps } from "next";
import { Tab } from "@headlessui/react";
import React, { useState } from "react";
import RichTextEditor from "@components/RichTextEditor";
import { ReactGhLikeDiff } from "react-gh-like-diff";
import { emit } from "process";

enum AppealStatus {
  Accept,
  Reject,
  Pending,
}

function AppealResult({ appealResult }: { appealResult: AppealStatus }) {
  switch (appealResult) {
    case AppealStatus.Accept: {
      return (
        <div className="flex flex-col items-center w-full py-3 bg-green-50 rounded-lg mt-4 mb-4">
          <div className="flex items-center mt-2 mb-2">
            <FontAwesomeIcon icon={["far", "check"]} className="text-green-600 mr-2 text-lg" />
            <p className="text-green-600 text-lg font-medium">Appeal Accepted</p>
          </div>
        </div>
      );
      break;
    }
    case AppealStatus.Reject: {
      return (
        <div className="flex flex-col items-center w-full py-3 bg-red-50 rounded-lg mt-4 mb-4">
          <div className="flex items-center mt-2 mb-2">
            <FontAwesomeIcon icon={["far", "xmark"]} className="text-red-600 mr-2 text-lg" />
            <p className="text-red-600 text-lg font-medium">Appeal Rejected</p>
          </div>
        </div>
      );
      break;
    }
    case AppealStatus.Pending: {
      return (
        <div className="flex flex-col items-center w-full py-3 bg-yellow-50 rounded-lg mt-4 mb-4">
          <div className="flex items-center mt-2 mb-2">
            <FontAwesomeIcon icon={["far", "clock"]} className="text-yellow-600 mr-2 text-lg" />
            <p className="text-yellow-600 text-lg font-medium">Pending Appeal...</p>
          </div>
        </div>
      );
      break;
    }
    default: {
      return (
        <div>
          <p className="text-lg">Error: AppealStatus Undefined in appealDetails.tsx</p>
        </div>
      );
      break;
    }
  }
}

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
      <div className="content-end mb-2">
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
      <div className="space-y-4">
        {messageList.map((message: Message) => (
          <div key={message.id}>
            <SingleMessage message={message} />
          </div>
        ))}
      </div>
    </div>
  );
}

type CodeComparisonTabProps = {};

function CodeComparisonTab({}: CodeComparisonTabProps) {
  return (
    <div>
      <ReactGhLikeDiff
        options={{
          originalFileName: "Original Submission",
          updatedFileName: "New Submission",
          outputFormat: "side-by-side",
        }}
      />
    </div>
  );
}

type AppealDetailsProps = {
  assignmentId: number;
  appealResult: AppealStatus;
  messageList: Message[];
};

function AppealDetails({ assignmentId, appealResult, messageList }: AppealDetailsProps) {
  return (
    <LayoutProvider>
      <Layout title="Grade Appeal Details">
        <main className="flex-1 flex bg-gray-200">
          <AssignmentSection />
          <div className="p-5 flex flex-1 flex-col h-full w-max">
            <Link href={`/assignments/${assignmentId}`}>
              <a className="max-w-max-content w-max px-3 py-1.5 mb-3 border border-gray-300 text-sm leading-4 font-medium rounded-lg text-blue-700 bg-white hover:text-blue-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-blue-800 active:bg-gray-50 transition ease-in-out duration-150">
                <FontAwesomeIcon icon={["far", "chevron-left"]} className="mr-2" />
                Back
              </a>
            </Link>
            <h1 className="font-semibold text-2xl text-center">Grade Appeal</h1>
            <AppealResult appealResult={appealResult} />
            <div className="p-2 flex-1 space-y-2 overflow-y-auto">
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
        </main>
      </Layout>
    </LayoutProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, query }) => {
  const userId = parseInt(req.cookies.user);
  const assignmentId = parseInt(query.assignmentId as string);

  // TODO(BRYAN): Retrieve the data from server once it's updated
  let appealResult = AppealStatus.Accept;
  const messageList: Message[] = [
    {
      id: 1,
      name: "Lo Kwok Yan",
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
  ];

  return {
    props: {
      assignmentId,
      appealResult,
      messageList,
    },
  };
};

export default AppealDetails;

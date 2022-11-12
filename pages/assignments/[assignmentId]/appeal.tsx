import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GetServerSideProps } from "next";
import RichTextEditor from "@components/RichTextEditor";
import Link from "next/link";
import { AssignmentSection } from "../../../components/Assignment/List";
import { LayoutProvider } from "../../../contexts/layout";
import { Layout } from "../../../layout";
import React, { useState } from "react";
import { Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons";

interface GradeAppealProps {
  assignmentId: number;
  acceptAppeal: boolean;
  errorMessage: String;
  numAppealsLeft: number;
}

function GradeAppeal({ assignmentId, acceptAppeal, errorMessage, numAppealsLeft }: GradeAppealProps) {
  // FIXME: Remove these temporary values and Assign with actual ones
  acceptAppeal = false;
  errorMessage = "You are not allowed to submit an appeal due to XXXXXX.";
  numAppealsLeft = 999;

  return (
    <LayoutProvider>
      <Layout title="Grade Appeal">
        <main className="flex-1 flex bg-gray-200">
          <AssignmentSection />
          <div className="p-5 flex flex-1 flex-col overflow-y-auto">
            {acceptAppeal ? (
              <AppealAccept assignmentId={assignmentId} numAppealsLeft={numAppealsLeft} />
            ) : (
              <AppealReject assignmentId={assignmentId} message={errorMessage} />
            )}
          </div>
        </main>
      </Layout>
    </LayoutProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const assignmentId = parseInt(query.assignmentId as string);
  return {
    props: {
      assignmentId,
    },
  };
};

export default GradeAppeal;

type AppealAcceptProps = {
  assignmentId: number;
  numAppealsLeft: number;
};

function AppealAccept({ assignmentId, numAppealsLeft }: AppealAcceptProps) {
  const [comments, setComments] = useState("");

  return (
    <div>
      <Link href={`/assignments/${assignmentId}`}>
        <a className="max-w-max-content w-max px-3 py-1.5 mb-3 border border-gray-300 text-sm leading-4 font-medium rounded-lg text-blue-700 bg-white hover:text-blue-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-blue-800 active:bg-gray-50 transition ease-in-out duration-150">
          <FontAwesomeIcon icon={["far", "chevron-left"]} className="mr-2" />
          Back
        </a>
      </Link>
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
      </div>
      <div className="my-6">
        <h2 className="mb-2 font-semibold text-lg">Upload fixed code</h2>
        <p className="mb-4 text-sm text-gray-600">
          Do NOT upload specific fixed files. Upload as if you are submitting for the whole assignment. The system will
          find out the fixed codes automatically.
        </p>
        {/* TODO: Add drag and drop support */}
        <div className="bg-white p-4 rounded-md">
          <div
            className={`flex justify-center px-6 pt-5 pb-6 border-2 focus:outline-none w-full border-dashed rounded-md`}
          >
            <div className="text-center">
              <FontAwesomeIcon icon={["fad", "upload"]} size="2x" />
              <p className="mt-1 text-sm text-gray-600">
                <button className="mr-1 font-medium text-cse-600 hover:text-cse-500 focus:outline-none focus:underline transition duration-150 ease-in-out">
                  Upload a file
                </button>
                or drag and drop
              </p>
              <p className="mt-1 text-xs text-gray-500">ZIP file up to 10MB</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center self-center">
        <div className="flex items-center mb-4">
          <FontAwesomeIcon icon={["far", "exclamation-triangle"]} className="text-orange-600 mr-2 text-lg" />
          <p className="text-orange-600">
            You have <strong>{numAppealsLeft}</strong> appeal(s) attempts left. You may not change any details after
            submission.
          </p>
        </div>
        <button
          className="px-4 py-1 rounded-md text-lg bg-green-500 text-white hover:bg-green-600 active:bg-green-700 transition ease-in-out duration-150"
          onClick={() => {
            // TODO: Submit the appeal
            // TODO: Validate whether "Justification and comments" is filled
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

type AppealRejectProps = {
  assignmentId: number;
  message: String;
};

function AppealReject({ assignmentId, message }: AppealRejectProps) {
  return (
    <div>
      <div>
        <Link href={`/assignments/${assignmentId}`}>
          <a className="max-w-max-content w-max px-3 py-1.5 mb-3 border border-gray-300 text-sm leading-4 font-medium rounded-lg text-blue-700 bg-white hover:text-blue-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-blue-800 active:bg-gray-50 transition ease-in-out duration-150">
            <FontAwesomeIcon icon={["far", "chevron-left"]} className="mr-2" />
            Back
          </a>
        </Link>
      </div>
      <div className="my-6 mt-8 flex flex-col items-center self-center mb-4">
        <Alert icon={<IconAlertCircle size={16} />} title="Appeal Unavailable" color="red" variant="filled">
          {message}
        </Alert>
      </div>
    </div>
  );
}

import { AssignmentSection } from "@/components/Assignment/List";
import RichTextEditor from "@/components/RichTextEditor";
import { LayoutProvider, useLayoutDispatch } from "@/contexts/layout";
import { useZinc } from "@/contexts/zinc";
import { GET_APPEAL_DETAIL } from "@/graphql/queries/user";
import { Layout } from "@/layout";
import { initializeApollo } from "@/lib/apollo";
import { Submission } from "@/types";
import { AppealAttempt, AppealStatus } from "@/types/appeal";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fad } from "@fortawesome/pro-duotone-svg-icons";
import { far } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Alert } from "@mantine/core";
import { GetServerSideProps } from "next";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { numAppealsLeft } from "@/utils/dummyData";

library.add(fad, far);

interface AppealFileSubmissionType {
  allowUpload: boolean;
  configId: any;
}

/**
 * Returns a component that allows file to be submitted along with the appeal
 * @param {boolean} allowUpload - Is the student allowed to upload files when submitting an appeal
 * @param {any} configId - The configuration ID
 */
// TODO(BRYAN): Investigate the usage of `configId`
function AppealFileSubmission({ allowUpload, configId }: AppealFileSubmissionType) {
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
              dispatch({
                type: "showNotification",
                payload: {
                  title: "Appeal Submitted",
                  message: "Your appeal will be reviewed.",
                  success: true,
                },
              });
            }
          })
          .catch((error) => {
            dispatch({
              type: "showNotification",
              payload: { title: "Appeal cannot be submitted", message: error.message, success: false },
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

  if (!allowUpload) {
    return (
      <div className="rounded-lg bg-gray-200 w-full py-4 flex flex-col items-center justify-center">
        <FontAwesomeIcon className="text-gray-500" icon={["fad", "calendar-exclamation"]} size="3x" />
        <h4 className="mt-4 font-medium text-gray-500">File Submission is NOT allowed</h4>
        <p className="text-sm text-gray-400">You are not allowed to submit file(s)</p>
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

/**
 * Returns a appeal submission button
 * @param {string} comments - The text message sent to the TA when submitting the appeal
 */
function Button({ comments }: { comments: string }) {
  return (
    <div>
      <button
        className="px-4 py-1 rounded-md text-lg bg-green-500 text-white hover:bg-green-600 active:bg-green-700 transition ease-in-out duration-150"
        onClick={() => {
          // Check if the text message blank. The student should filled in something for the appeal.
          if (comments === null || comments === "") {
            alert("Please Fill All Required Field");
          } else {
            // TODO(Bryan): Submit the appeal using GraphQL mutation
            const now = new Date();

            const appeal: AppealAttempt = {
              id: 1,
              assignmentConfigAndUserId: 999,
              createdAt: now.toString(),
              latestStatus: AppealStatus.Pending,
              updatedAt: now.toString(),
            };
          }
        }}
      >
        Submit
      </button>
    </div>
  );
}

/*  Possible values for type Condition:
 *   NotSubmitted: The student has not submitted anything yet for the assignment
 *   Processing: The system is still processing the assignment
 *   NoAppealLeft: The number of appeal attempts left is zero
 *   FullMark: The student got full mark in the assignment
 *   NotFullMark: The student did NOT get full mark in the assignment
 */
enum Condition {
  NotSubmitted,
  Processing,
  NoAppealLeft,
  FullMark,
  NotFullMark,
}

type AppealAcceptProps = {
  numAppealsLeft: number;
  condition: Condition;
};

/**
 * The content of Appeal Submission Page. Shown only if a new appeal can be sent.
 * @param {number} numAppealsLeft - Number of available appeal attempts left. Value should be >=1.
 * @param {Condition} condition - Condition of the assignment submission. Should be either `FullMark` or `NotFullMark`.
 */
function AppealAccept({ numAppealsLeft, condition }: AppealAcceptProps) {
  const [comments, setComments] = useState("");

  return (
    <div>
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
      {/* Start of Upload Fixed Code */}
      <div className="my-6">
        <h2 className="mb-2 font-semibold text-lg">Upload fixed code</h2>
        <p className="mb-4 text-sm text-gray-600">
          Do NOT upload specific fixed files. Upload as if you are submitting for the whole assignment. The system will
          find out the fixed codes automatically.
        </p>
        <div className="bg-white p-4 rounded-md">
          <AppealFileSubmission allowUpload={true} configId={1} />
        </div>
      </div>
      {/* End of Upload Fixed Code */}
      <div className="mt-8 flex flex-col items-center self-center">
        <div className="flex items-center mb-4">
          <FontAwesomeIcon icon={["far", "exclamation-triangle"]} className="text-orange-600 mr-2 text-lg" />
          <p className="text-orange-600">
            You have <strong>{numAppealsLeft}</strong> appeal(s) attempts left. You may not change any details after
            submission.
          </p>
        </div>
        {condition == Condition.FullMark ? (
          <div className="flex flex-col items-center w-full py-3 bg-red-50 rounded-lg mt-4 mb-4">
            <div className="flex items-center mt-4 mb-4">
              <FontAwesomeIcon icon={["far", "octagon-exclamation"]} className="text-red-600 mr-2 text-lg" />
              <p className="text-red-600 text-lg font-medium">
                Your have got Full Mark. Are you sure you wish to submit a grade appeal?
              </p>
            </div>
            <Button comments={comments} />
          </div>
        ) : (
          <Button comments={comments} />
        )}
      </div>
    </div>
  );
}

type AppealRejectProps = {
  message: String;
};

/**
 * The error message for the Appeal Submission Page. Shown only if a new appeal CANNOT be sent.
 * @param {string} message - The error message shown to user for rejecting an appeal submission.
 */
function AppealReject({ message }: AppealRejectProps) {
  return (
    <div>
      <div className="my-6 mt-8 flex flex-col items-center self-center mb-4">
        <Alert
          icon={<FontAwesomeIcon icon={["far", "circle-exclamation"]} />}
          title="Appeal Unavailable"
          color="red"
          variant="filled"
        >
          {"You are not allowed to submit an appeal due to the following reason: "}
          <br />
          <strong>{message}</strong>
        </Alert>
      </div>
    </div>
  );
}

interface GradeAppealProps {
  assignmentId: number;
  numAppealsLeft: number;
  condition: Condition;
}

/**
 * The Appeal Submission page.
 * @param {number} assignmentId - The assignment ID.
 * @param {number} numAppealsLeft - The number of available appeal attempts left.
 * @param {Condition} condition - Condition of the assignment submission.
 */
function AppealSubmission({ assignmentId, numAppealsLeft, condition }: GradeAppealProps) {
  let errorMessage: String = "";
  let acceptAppeal: boolean;

  // Check the condition and decide if appeal is allowed
  switch (condition) {
    case Condition.NotSubmitted: {
      errorMessage = "You have not submitted anything yet.";
      acceptAppeal = false;
      break;
    }
    case Condition.Processing: {
      errorMessage = "Submission is still being processed.";
      acceptAppeal = false;
      break;
    }
    case Condition.NoAppealLeft: {
      errorMessage = "No more Appeal Attempts left.";
      acceptAppeal = false;
      break;
    }
    case Condition.FullMark: {
      acceptAppeal = true;
      break;
    }
    case Condition.NotFullMark: {
      acceptAppeal = true;
      break;
    }
  }

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
            {acceptAppeal ? (
              <AppealAccept numAppealsLeft={numAppealsLeft} condition={condition} />
            ) : (
              <AppealReject message={errorMessage} />
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

  const apolloClient = initializeApollo(req.headers.cookie as string);
  const { data } = await apolloClient.query<{ submissions: Submission[] }>({
    query: GET_APPEAL_DETAIL,
    variables: {
      userId,
      assignmentConfigId: assignmentId,
    },
  });

  // TODO(Bryan): Get the value from database after it's updated -> `numAppealsLeft`
  let condition = Condition.NotFullMark;

  // Determine the condition based on the database state
  if (data.submissions.length === 0) {
    condition = Condition.NotSubmitted;
  } else if (data.submissions[0].reports.length === 0) {
    condition = Condition.Processing;
  } else if (numAppealsLeft === 0) {
    condition = Condition.NoAppealLeft;
  } else {
    const score = data.submissions[0].reports[0].grade.details.accScore;
    const maxScore = data.submissions[0].reports[0].grade.details.accTotal;

    score === maxScore ? (condition = Condition.FullMark) : (condition = Condition.NotFullMark);
  }

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
      assignmentId,
      numAppealsLeft,
      condition,
    },
  };
};

export default AppealSubmission;

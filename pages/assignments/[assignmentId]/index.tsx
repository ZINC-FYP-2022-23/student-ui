import { GET_ASSIGNMENT_DETAIL } from "@/graphql/queries/user";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { Modal, SlideOver } from "../../../components";
import { AssignmentContent } from "../../../components/Assignment/Content";
import { AssignmentSection } from "../../../components/Assignment/List";
import { ReportSlideOver } from "../../../components/Report/index";
import { StdioTestDetailView } from "../../../components/Report/StdioTestStageReport";
import { ValgrindDetailView } from "../../../components/Report/ValgrindStageReport";
import { LayoutProvider, useLayoutState } from "@/contexts/layout";
import { Layout } from "@/layout";
import { initializeApollo } from "@/lib/apollo";
import { AssignmentConfig } from "@/types";

export function ModalContent() {
  const { modalType } = useLayoutState();
  switch (modalType) {
    case "stdiotest":
      return <StdioTestDetailView />;
    case "valgrind":
      return <ValgrindDetailView />;
    default:
      return <div>Not Implememented</div>;
  }
}

/**
 * The Assignment Submission Page
 */
function Assignment() {
  const router = useRouter();
  const { assignmentId } = router.query;
  const assignmentConfigId = parseInt(assignmentId as string, 10);
  const { data } = useQuery<{ assignmentConfig: AssignmentConfig }>(GET_ASSIGNMENT_DETAIL, {
    variables: {
      assignmentConfigId,
    },
  });

  return (
    <LayoutProvider>
      <Layout title={data!.assignmentConfig.assignment.name}>
        <main className="flex-1 flex bg-gray-200">
          <AssignmentSection />
          <AssignmentContent content={data!.assignmentConfig} />
        </main>
      </Layout>
      <SlideOver>
        <ReportSlideOver />
      </SlideOver>
      <Modal>
        <ModalContent />
      </Modal>
      {/* <Notification>
        <SubmissionNotification/>
      </Notification> */}
    </LayoutProvider>
  );
}

export async function getServerSideProps(ctx) {
  const apolloClient = initializeApollo(ctx.req.headers.cookie);
  const userId: number = parseInt(ctx.req.cookies.user);
  const assignmentConfigId = parseInt(ctx.query.assignmentId, 10);

  await apolloClient.query({
    query: GET_ASSIGNMENT_DETAIL,
    variables: {
      assignmentConfigId,
    },
  });

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
      userId,
    },
  };
}

export default Assignment;
